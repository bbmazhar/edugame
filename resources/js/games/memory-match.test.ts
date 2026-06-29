import { describe, expect, it } from 'vitest';
import { createModule, readLayout, type MemoryRound } from './memory-match';

type Card = MemoryRound['cards'][number];

function findMatch(cards: Card[]): [number, number] | null {
    const bySymbol = new Map<string, number[]>();
    for (const c of cards) {
        if (c.matched) continue;
        const ids = bySymbol.get(c.symbol) ?? [];
        ids.push(c.id);
        bySymbol.set(c.symbol, ids);
        if (ids.length === 2) return [ids[0], ids[1]];
    }
    return null;
}

function findMismatch(cards: Card[]): [number, number] | null {
    const un = cards.filter((c) => !c.matched);
    for (let i = 0; i < un.length; i++) {
        for (let j = i + 1; j < un.length; j++) {
            if (un[i].symbol !== un[j].symbol) return [un[i].id, un[j].id];
        }
    }
    return null;
}

const params = (o: Record<string, unknown> = {}) => ({
    rows: 3,
    cols: 4,
    flip_back_ms: 1000,
    theme: 'animals',
    ...o,
});

describe('memory-match layout guard', () => {
    it('always yields an even number of cards (pairs * 2)', () => {
        expect(readLayout(params({ rows: 3, cols: 4 }))).toMatchObject({ cells: 12, pairs: 6 });
        // Odd rows*cols guards down to whole pairs with a leftover cell.
        expect(readLayout(params({ rows: 3, cols: 3 }))).toMatchObject({ cells: 9, pairs: 4 });
        expect(readLayout(params({ rows: 5, cols: 6 }))).toMatchObject({ cells: 30, pairs: 15 });
    });

    it('clamps oversized dimensions', () => {
        const layout = readLayout(params({ rows: 99, cols: 99 }));
        expect(layout.rows).toBe(6);
        expect(layout.cols).toBe(8);
    });

    it('builds a deck whose card count equals pairs * 2', () => {
        const mod = createModule(params({ rows: 3, cols: 3 }));
        mod.init();
        const round = mod.renderRound()!;
        expect(round.cards).toHaveLength(8); // 4 pairs, 1 blank cell
        expect(round.cells).toBe(9);
    });
});

describe('memory-match scoring', () => {
    it('perfect play gives 100% accuracy and full score', () => {
        const mod = createModule(params());
        mod.init();

        let guard = 0;
        while (!mod.isFinished() && guard++ < 500) {
            const round = mod.renderRound();
            if (!round) break;
            const pair = findMatch(round.cards);
            if (!pair) break;
            mod.onAnswer({ firstId: pair[0], secondId: pair[1] });
        }

        const result = mod.getResult();
        expect(result.accuracy).toBe(100);
        expect(result.rounds).toBe(6); // attempts === pairs
        expect(result.score).toBe(600); // 6 pairs * 100, no penalties at ~0ms
    });

    it('extra attempts lower accuracy and score', () => {
        const mod = createModule(params());
        mod.init();

        // Three wasted mismatched attempts first.
        for (let i = 0; i < 3; i++) {
            const round = mod.renderRound()!;
            const miss = findMismatch(round.cards)!;
            mod.onAnswer({ firstId: miss[0], secondId: miss[1] });
        }

        let guard = 0;
        while (!mod.isFinished() && guard++ < 500) {
            const round = mod.renderRound();
            if (!round) break;
            const pair = findMatch(round.cards);
            if (!pair) break;
            mod.onAnswer({ firstId: pair[0], secondId: pair[1] });
        }

        const result = mod.getResult();
        expect(result.rounds).toBe(9); // 3 misses + 6 matches
        expect(result.accuracy).toBeLessThan(100);
        expect(result.score).toBe(600 - 3 * 15); // 555
    });

    it('floors the score at zero after many wasted attempts', () => {
        const mod = createModule(params());
        mod.init();

        for (let i = 0; i < 60; i++) {
            const round = mod.renderRound()!;
            const miss = findMismatch(round.cards)!;
            mod.onAnswer({ firstId: miss[0], secondId: miss[1] });
        }

        let guard = 0;
        while (!mod.isFinished() && guard++ < 500) {
            const round = mod.renderRound();
            if (!round) break;
            const pair = findMatch(round.cards);
            if (!pair) break;
            mod.onAnswer({ firstId: pair[0], secondId: pair[1] });
        }

        expect(mod.getResult().score).toBe(0);
    });

    it('marks matched cards persistently in the snapshot', () => {
        const mod = createModule(params());
        mod.init();
        const pair = findMatch(mod.renderRound()!.cards)!;
        mod.onAnswer({ firstId: pair[0], secondId: pair[1] });

        const after = mod.renderRound()!;
        expect(after.cards.find((c) => c.id === pair[0])!.matched).toBe(true);
        expect(after.cards.find((c) => c.id === pair[1])!.matched).toBe(true);
    });
});
