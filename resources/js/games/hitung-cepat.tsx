import type { GameEntry, GameModule, GameParams, GameRoundProps } from '@/types/game';
import { useEffect, useRef, useState } from 'react';

type Operation = '+' | '-' | '×' | '÷';

export type HitungCepatRound = {
    text: string;
    answer: number;
    options: number[];
    timeMs: number;
};

export type HitungCepatAnswer = {
    value: number | null;
    timedOut: boolean;
    remainingMs: number;
};

type Settings = {
    operations: Operation[];
    maxOperand: number;
    timeMs: number;
    allowNegative: boolean;
    total: number;
};

const ALL_OPERATIONS: Operation[] = ['+', '-', '×', '÷'];

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function readSettings(params: GameParams): Settings {
    const ops = Array.isArray(params.operations)
        ? (params.operations as unknown[]).filter((o): o is Operation =>
              ALL_OPERATIONS.includes(o as Operation),
          )
        : [];

    return {
        operations: ops.length > 0 ? ops : ['+', '-'],
        maxOperand: Math.max(2, Math.floor(toNumber(params.max_operand, 20))),
        timeMs: Math.max(1000, Math.floor(toNumber(params.time_per_question_ms, 8000))),
        allowNegative: Boolean(params.allow_negative),
        total: Math.min(50, Math.max(1, Math.floor(toNumber(params.total_questions, 10)))),
    };
}

function randInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function buildOptions(answer: number, allowNegative: boolean): number[] {
    const options = new Set<number>([answer]);
    const deltas = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10];

    for (const delta of deltas) {
        if (options.size >= 4) {
            break;
        }
        const candidate = answer + delta;
        if (allowNegative || candidate >= 0) {
            options.add(candidate);
        }
    }

    while (options.size < 4) {
        const candidate = answer + randInt(1, 12);
        if (allowNegative || candidate >= 0) {
            options.add(candidate);
        }
    }

    return [...options].sort(() => Math.random() - 0.5);
}

export function buildQuestion(settings: Settings): HitungCepatRound {
    const op = pick(settings.operations);
    // Keep products / dividends sane regardless of max_operand.
    const factorCap = Math.min(settings.maxOperand, 12);

    let a: number;
    let b: number;
    let answer: number;

    switch (op) {
        case '+':
            a = randInt(1, settings.maxOperand);
            b = randInt(1, settings.maxOperand);
            answer = a + b;
            break;
        case '-':
            a = randInt(1, settings.maxOperand);
            b = randInt(1, settings.maxOperand);
            if (!settings.allowNegative && b > a) {
                [a, b] = [b, a];
            }
            answer = a - b;
            break;
        case '×':
            a = randInt(2, factorCap);
            b = randInt(2, factorCap);
            answer = a * b;
            break;
        case '÷':
        default:
            b = randInt(2, factorCap);
            answer = randInt(2, factorCap);
            a = b * answer; // ensures an integer quotient
            break;
    }

    return {
        text: `${a} ${op} ${b}`,
        answer,
        options: buildOptions(answer, settings.allowNegative),
        timeMs: settings.timeMs,
    };
}

export function createModule(
    params: GameParams,
): GameModule<HitungCepatRound, HitungCepatAnswer> {
    const settings = readSettings(params);
    let index = 0;
    let correct = 0;
    let score = 0;
    let current: HitungCepatRound | null = null;

    return {
        init() {
            index = 0;
            correct = 0;
            score = 0;
            current = buildQuestion(settings);
        },
        renderRound() {
            return index < settings.total ? current : null;
        },
        onAnswer(answer) {
            const isCorrect =
                current !== null && !answer.timedOut && answer.value === current.answer;

            if (isCorrect && current) {
                correct += 1;
                const fraction = Math.max(0, Math.min(1, answer.remainingMs / current.timeMs));
                score += Math.round(100 * (0.5 + 0.5 * fraction));
            }

            index += 1;
            current = index < settings.total ? buildQuestion(settings) : null;

            return { correct: isCorrect };
        },
        isFinished() {
            return index >= settings.total;
        },
        getResult() {
            return {
                score,
                accuracy: settings.total > 0 ? (correct / settings.total) * 100 : 0,
                rounds: settings.total,
                durationMs: 0,
                meta: { correct },
            };
        },
    };
}

function Round({
    round,
    onAnswer,
    disabled,
}: GameRoundProps<HitungCepatRound, HitungCepatAnswer>) {
    const [remaining, setRemaining] = useState(round.timeMs);
    const answeredRef = useRef(false);

    useEffect(() => {
        answeredRef.current = false;
        setRemaining(round.timeMs);
        const start = Date.now();

        const id = setInterval(() => {
            const left = Math.max(0, round.timeMs - (Date.now() - start));
            setRemaining(left);

            if (left <= 0) {
                clearInterval(id);
                if (!answeredRef.current) {
                    answeredRef.current = true;
                    onAnswer({ value: null, timedOut: true, remainingMs: 0 });
                }
            }
        }, 50);

        return () => clearInterval(id);
        // Restart the per-question timer whenever a new round is shown.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round]);

    const choose = (value: number) => {
        if (answeredRef.current || disabled) {
            return;
        }
        answeredRef.current = true;
        onAnswer({ value, timedOut: false, remainingMs: remaining });
    };

    const pct = Math.round((remaining / round.timeMs) * 100);

    return (
        <div className="flex w-full flex-col items-center gap-6">
            <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                />
            </div>

            <div className="text-5xl font-bold tabular-nums">{round.text}</div>

            <div className="grid grid-cols-2 gap-3">
                {round.options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        onClick={() => choose(option)}
                        className="flex min-h-16 min-w-24 items-center justify-center rounded-xl border border-border bg-card text-2xl font-semibold tabular-nums hover:bg-accent disabled:opacity-50"
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}

const hitungCepat: GameEntry<HitungCepatRound, HitungCepatAnswer> = {
    createModule,
    Round,
};

export default hitungCepat;
