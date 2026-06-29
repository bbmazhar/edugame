import { describe, expect, it } from 'vitest';
import {
    createModule,
    generateQuestion,
    readSettings,
    verifyQuestion,
} from './lanjutkan-pola';
import type { PatternType, PolaRound } from './lanjutkan-pola';

const settingsFor = (o: Record<string, unknown> = {}) =>
    readSettings({
        pattern_types: ['arithmetic', 'shape'],
        sequence_length: 5,
        options_count: 4,
        ...o,
    });

function play(
    params: Record<string, unknown>,
    correct: boolean,
    elapsedMs = 0,
) {
    const mod = createModule(params);
    mod.init();

    let guard = 0;

    while (!mod.isFinished() && guard++ < 100) {
        const round = mod.renderRound() as PolaRound | null;

        if (!round) {
            break;
        }

        mod.onAnswer({
            value: correct ? round.answer : `__wrong__${round.answer}`,
            elapsedMs,
        });
    }

    return mod.getResult();
}

describe('lanjutkan-pola generator is deterministic & verifiable', () => {
    const types: PatternType[] = ['arithmetic', 'geometric', 'shape', 'color'];

    it.each(types)(
        'every generated %s puzzle has exactly one verifiable answer',
        (type) => {
            const settings = settingsFor({ pattern_types: [type] });

            for (let i = 0; i < 300; i++) {
                const q = generateQuestion(settings);
                expect(q.type).toBe(type);
                expect(q.options).toHaveLength(settings.optionsCount);
                expect(new Set(q.options).size).toBe(settings.optionsCount);
                expect(q.options).toContain(q.answer);
                expect(verifyQuestion(q, settings.optionsCount)).toBe(true);
            }
        },
    );

    it('only generates allowed pattern types', () => {
        const settings = settingsFor({ pattern_types: ['shape'] });

        for (let i = 0; i < 100; i++) {
            expect(generateQuestion(settings).type).toBe('shape');
        }
    });

    it('falls back to a safe default when pattern_types is empty', () => {
        expect(settingsFor({ pattern_types: [] }).patternTypes).toEqual([
            'arithmetic',
            'shape',
        ]);
    });
});

describe('lanjutkan-pola scoring (correct × speed)', () => {
    const base = {
        pattern_types: ['arithmetic'],
        sequence_length: 4,
        options_count: 3,
        rounds: 8,
    };

    it('all-correct fast play scores total*100 with full accuracy', () => {
        const result = play(base, true, 0);
        expect(result.rounds).toBe(8);
        expect(result.accuracy).toBe(100);
        expect(result.score).toBe(800);
    });

    it('all-wrong play scores zero', () => {
        const result = play(base, false);
        expect(result.score).toBe(0);
        expect(result.accuracy).toBe(0);
    });

    it('weights score by speed (fast=100, slow=50)', () => {
        expect(play({ ...base, rounds: 1 }, true, 0).score).toBe(100);
        expect(play({ ...base, rounds: 1 }, true, 2500).score).toBe(75);
        expect(play({ ...base, rounds: 1 }, true, 99999).score).toBe(50);
    });

    it('defaults to 10 rounds when no count param is given', () => {
        expect(settingsFor({}).rounds).toBe(10);
    });
});
