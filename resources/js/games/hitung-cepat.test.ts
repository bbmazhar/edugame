import { describe, expect, it } from 'vitest';
import { buildQuestion, createModule } from './hitung-cepat';
import type { HitungCepatRound, Operation } from './hitung-cepat';

const settings = (
    overrides: Partial<Parameters<typeof buildQuestion>[0]> = {},
) => ({
    operations: ['+'] as Operation[],
    maxOperand: 10,
    timeMs: 5000,
    allowNegative: false,
    total: 5,
    ...overrides,
});

function playAll(
    params: Record<string, unknown>,
    answerFor: (round: HitungCepatRound) => {
        value: number | null;
        timedOut: boolean;
        remainingMs: number;
    },
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

describe('hitung-cepat question generation', () => {
    it('division questions always have an integer quotient', () => {
        for (let i = 0; i < 300; i++) {
            const q = buildQuestion(
                settings({ operations: ['÷'], maxOperand: 12 }),
            );
            const [a, , b] = q.text.split(' ');
            expect(Number(a) % Number(b)).toBe(0);
            expect(Number(a) / Number(b)).toBe(q.answer);
        }
    });

    it('never produces negative results or options when allowNegative is false', () => {
        for (let i = 0; i < 300; i++) {
            const q = buildQuestion(
                settings({ operations: ['-'], maxOperand: 20 }),
            );
            expect(q.answer).toBeGreaterThanOrEqual(0);
            q.options.forEach((o) => expect(o).toBeGreaterThanOrEqual(0));
        }
    });

    it('always offers four unique options that include the answer', () => {
        for (let i = 0; i < 200; i++) {
            const q = buildQuestion(
                settings({
                    operations: ['+', '-', '×', '÷'],
                    maxOperand: 50,
                    allowNegative: true,
                }),
            );
            expect(q.options).toHaveLength(4);
            expect(new Set(q.options).size).toBe(4);
            expect(q.options).toContain(q.answer);
        }
    });
});

describe('hitung-cepat scoring', () => {
    const params = {
        operations: ['+'],
        max_operand: 10,
        time_per_question_ms: 5000,
        allow_negative: false,
        total_questions: 5,
    };

    it('rewards all-correct play with full accuracy and positive score', () => {
        const result = playAll(params, (round) => ({
            value: round.answer,
            timedOut: false,
            remainingMs: round.timeMs,
        }));

        expect(result.rounds).toBe(5);
        expect(result.accuracy).toBe(100);
        expect(result.score).toBe(500); // 100 pts each at full time
    });

    it('gives zero score and accuracy for all-wrong play, without punishing crashes', () => {
        const result = playAll(params, (round) => ({
            value: round.answer + 1000,
            timedOut: false,
            remainingMs: 0,
        }));

        expect(result.accuracy).toBe(0);
        expect(result.score).toBe(0);
        expect(result.rounds).toBe(5);
    });

    it('clamps total_questions into a sane range', () => {
        const result = playAll(
            { ...params, total_questions: 999 },
            (round) => ({
                value: round.answer,
                timedOut: false,
                remainingMs: round.timeMs,
            }),
        );

        expect(result.rounds).toBe(50);
    });
});
