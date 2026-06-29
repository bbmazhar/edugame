import { describe, expect, it } from 'vitest';
import {
    buildRound,
    createModule,
    type FokusWarnaAnswer,
    type FokusWarnaRound,
} from './fokus-warna';

const settings = (overrides: Partial<Parameters<typeof buildRound>[0]> = {}) => ({
    displayMs: 3000,
    congruentRatio: 0.5,
    distractorCount: 2,
    rounds: 10,
    ...overrides,
});

function playAll(
    params: Record<string, unknown>,
    answerFor: (round: FokusWarnaRound) => FokusWarnaAnswer,
) {
    const mod = createModule(params);
    mod.init();

    let guard = 0;
    while (!mod.isFinished() && guard++ < 200) {
        const round = mod.renderRound();
        if (!round) {
            break;
        }
        mod.onAnswer(answerFor(round));
    }

    return mod.getResult();
}

describe('fokus-warna round generation', () => {
    it('offers distractor_count + 1 unique options that include the ink colour', () => {
        for (let i = 0; i < 300; i++) {
            const r = buildRound(settings({ distractorCount: 4 }));
            expect(r.options).toHaveLength(5);
            expect(new Set(r.options).size).toBe(5);
            expect(r.options).toContain(r.inkKey);
        }
    });

    it('congruent_ratio of 1 always matches word and ink', () => {
        for (let i = 0; i < 200; i++) {
            const r = buildRound(settings({ congruentRatio: 1 }));
            expect(r.congruent).toBe(true);
            expect(r.wordKey).toBe(r.inkKey);
        }
    });

    it('congruent_ratio of 0 never matches word and ink', () => {
        for (let i = 0; i < 200; i++) {
            const r = buildRound(settings({ congruentRatio: 0 }));
            expect(r.congruent).toBe(false);
            expect(r.wordKey).not.toBe(r.inkKey);
        }
    });
});

describe('fokus-warna scoring (correct − penalty, reaction measured)', () => {
    const params = {
        display_ms: 3000,
        congruent_ratio: 0.5,
        distractor_count: 2,
        rounds: 6,
    };

    it('all-correct play yields full accuracy and positive score', () => {
        const result = playAll(params, (round) => ({
            value: round.inkKey,
            timedOut: false,
            remainingMs: round.timeMs,
        }));

        expect(result.rounds).toBe(6);
        expect(result.accuracy).toBe(100);
        expect(result.score).toBe(600);
        expect((result.meta as { correct: number }).correct).toBe(6);
    });

    it('all-wrong play floors the score at zero, never negative', () => {
        const result = playAll(params, (round) => ({
            value: round.options.find((k) => k !== round.inkKey) ?? null,
            timedOut: false,
            remainingMs: 1500,
        }));

        expect(result.accuracy).toBe(0);
        expect(result.score).toBe(0);
    });

    it('timeouts are not penalised', () => {
        const result = playAll(params, () => ({
            value: null,
            timedOut: true,
            remainingMs: 0,
        }));

        expect(result.score).toBe(0);
        expect(result.accuracy).toBe(0);
    });

    it('measures average reaction time on correct answers', () => {
        const result = playAll(params, (round) => ({
            value: round.inkKey,
            timedOut: false,
            remainingMs: round.timeMs - 500,
        }));

        expect((result.meta as { avgReactionMs: number }).avgReactionMs).toBe(500);
    });

    it('clamps rounds into a sane range', () => {
        const result = playAll({ ...params, rounds: 999 }, (round) => ({
            value: round.inkKey,
            timedOut: false,
            remainingMs: round.timeMs,
        }));

        expect(result.rounds).toBe(50);
    });
});
