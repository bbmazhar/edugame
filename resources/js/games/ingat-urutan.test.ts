import { describe, expect, it } from 'vitest';
import { PAD_COUNT, createModule, readSettings, type SimonRound } from './ingat-urutan';

const params = (o: Record<string, unknown> = {}) => ({
    start_length: 3,
    max_length: 7,
    show_ms: 800,
    gap_ms: 300,
    modality: 'color',
    ...o,
});

function play(p: Record<string, unknown>, decide: (round: SimonRound) => boolean) {
    const mod = createModule(p);
    mod.init();

    let guard = 0;
    while (!mod.isFinished() && guard++ < 100) {
        const round = mod.renderRound();
        if (!round) break;
        mod.onAnswer({ success: decide(round) });
    }

    return mod.getResult();
}

describe('ingat-urutan settings', () => {
    it('normalises an unknown modality to color', () => {
        expect(readSettings(params({ modality: 'sparkle' })).modality).toBe('color');
        expect(readSettings(params({ modality: 'number' })).modality).toBe('number');
        expect(readSettings(params({ modality: 'sound' })).modality).toBe('sound');
    });

    it('keeps max_length no smaller than start_length', () => {
        expect(readSettings(params({ start_length: 5, max_length: 2 })).maxLength).toBe(5);
    });
});

describe('ingat-urutan sequence', () => {
    it('starts at start_length with valid pad values', () => {
        const mod = createModule(params());
        mod.init();
        const round = mod.renderRound()!;
        expect(round.sequence).toHaveLength(3);
        round.sequence.forEach((v) => {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(PAD_COUNT);
        });
    });

    it('grows by one each round and never exceeds max_length', () => {
        const mod = createModule(params());
        mod.init();
        const lengths: number[] = [];

        let guard = 0;
        while (!mod.isFinished() && guard++ < 100) {
            const round = mod.renderRound();
            if (!round) break;
            lengths.push(round.currentLength);
            mod.onAnswer({ success: true });
        }

        expect(lengths).toEqual([3, 4, 5, 6, 7]);
        expect(Math.max(...lengths)).toBeLessThanOrEqual(7);
    });
});

describe('ingat-urutan scoring (longest correct sequence)', () => {
    it('perfect play scores the max length with full accuracy', () => {
        const result = play(params(), () => true);
        expect(result.score).toBe(7);
        expect(result.accuracy).toBe(100);
        expect(result.rounds).toBe(5); // lengths 3..7
    });

    it('failing the first round scores zero', () => {
        const result = play(params(), () => false);
        expect(result.score).toBe(0);
        expect(result.rounds).toBe(0);
    });

    it('scores the last fully-correct length on a mid-run miss', () => {
        const result = play(params(), (round) => round.currentLength < 5);
        expect(result.score).toBe(4); // cleared 3 and 4, missed at 5
        expect(result.rounds).toBe(2);
    });
});
