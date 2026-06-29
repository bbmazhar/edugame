import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type {
    GameEntry,
    GameModule,
    GameParams,
    GameRoundProps,
} from '@/types/game';

export type PatternType = 'arithmetic' | 'geometric' | 'shape' | 'color';
type Kind = 'number' | 'shape' | 'color';

const ALL_TYPES: PatternType[] = ['arithmetic', 'geometric', 'shape', 'color'];
const SPEED_REF_MS = 5000;

const SHAPES: Record<string, string> = {
    segitiga: '▲',
    lingkaran: '●',
    kotak: '■',
    bintang: '★',
    hati: '♥',
    wajik: '◆',
};
const SHAPE_KEYS = Object.keys(SHAPES);

const PATTERN_COLORS: Record<string, string> = {
    merah: '#ef4444',
    biru: '#3b82f6',
    hijau: '#22c55e',
    kuning: '#eab308',
    ungu: '#8b5cf6',
    oranye: '#f97316',
};
const COLOR_KEYS = Object.keys(PATTERN_COLORS);

export type PolaRound = {
    type: PatternType;
    kind: Kind;
    sequence: string[];
    options: string[];
    answer: string;
    index: number;
    total: number;
};

export type PolaAnswer = {
    value: string;
    elapsedMs: number;
};

export type PolaSettings = {
    patternTypes: PatternType[];
    sequenceLength: number;
    optionsCount: number;
    rounds: number;
};

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);

    return Number.isFinite(n) ? n : fallback;
}

export function readSettings(params: GameParams): PolaSettings {
    const types = Array.isArray(params.pattern_types)
        ? (params.pattern_types as unknown[]).filter((t): t is PatternType =>
              ALL_TYPES.includes(t as PatternType),
          )
        : [];

    return {
        patternTypes: types.length > 0 ? types : ['arithmetic', 'shape'],
        sequenceLength: Math.min(
            8,
            Math.max(3, Math.floor(toNumber(params.sequence_length, 4))),
        ),
        optionsCount: Math.min(
            6,
            Math.max(2, Math.floor(toNumber(params.options_count, 3))),
        ),
        rounds: Math.min(
            30,
            Math.max(
                1,
                Math.floor(
                    toNumber(params.rounds ?? params.total_questions, 10),
                ),
            ),
        ),
    };
}

function randInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function buildOptions(
    answer: string,
    distractors: string[],
    optionsCount: number,
): string[] {
    const set = new Set<string>([answer]);

    for (const d of distractors) {
        if (set.size >= optionsCount) {
            break;
        }

        set.add(d);
    }

    return shuffle([...set]);
}

function generateNumeric(
    type: 'arithmetic' | 'geometric',
    settings: PolaSettings,
): PolaRound {
    const len = settings.sequenceLength;
    const nums: number[] = [];
    let answer: number;
    const distractCandidates: number[] = [];

    if (type === 'arithmetic') {
        const start = randInt(1, 9);
        const d = randInt(1, 5);

        for (let i = 0; i < len; i++) {
            nums.push(start + i * d);
        }

        answer = start + len * d;
        distractCandidates.push(
            answer + 1,
            answer - 1,
            answer + d,
            answer - d,
            answer + 2 * d,
            nums[len - 1],
        );
    } else {
        const start = randInt(2, 4);
        const r = randInt(2, 3);

        for (let i = 0; i < len; i++) {
            nums.push(start * r ** i);
        }

        answer = start * r ** len;
        const last = nums[len - 1];
        distractCandidates.push(
            answer + 1,
            answer - 1,
            last,
            answer + last,
            answer - last,
            answer * 2,
        );
    }

    const distractors = distractCandidates
        .filter((n) => Number.isInteger(n) && n !== answer)
        .filter((n, i, arr) => arr.indexOf(n) === i)
        .map(String);

    while (distractors.length < settings.optionsCount - 1) {
        const candidate =
            answer + randInt(1, 9) * (Math.random() < 0.5 ? 1 : -1);

        if (candidate !== answer && !distractors.includes(String(candidate))) {
            distractors.push(String(candidate));
        }
    }

    return {
        type,
        kind: 'number',
        sequence: nums.map(String),
        answer: String(answer),
        options: buildOptions(
            String(answer),
            distractors,
            settings.optionsCount,
        ),
        index: 0,
        total: 0,
    };
}

function generateCyclic(
    type: 'shape' | 'color',
    settings: PolaSettings,
): PolaRound {
    const pool = type === 'shape' ? SHAPE_KEYS : COLOR_KEYS;
    const len = settings.sequenceLength;
    const maxPeriod = Math.min(3, len - 1, pool.length);
    const period = randInt(2, Math.max(2, maxPeriod));

    const cycle = shuffle(pool).slice(0, period);
    const sequence: string[] = [];

    for (let i = 0; i < len; i++) {
        sequence.push(cycle[i % period]);
    }

    const answer = cycle[len % period];

    const distractors = shuffle(pool.filter((k) => k !== answer)).slice(
        0,
        settings.optionsCount - 1,
    );

    return {
        type,
        kind: type,
        sequence,
        answer,
        options: buildOptions(answer, distractors, settings.optionsCount),
        index: 0,
        total: 0,
    };
}

export function generateQuestion(settings: PolaSettings): PolaRound {
    const type = pick(settings.patternTypes);

    if (type === 'arithmetic' || type === 'geometric') {
        return generateNumeric(type, settings);
    }

    return generateCyclic(type, settings);
}

/**
 * Independently re-derives the expected next item from the sequence and
 * confirms exactly one option matches it. Used by tests to guarantee every
 * generated puzzle has a single verifiable answer.
 */
export function verifyQuestion(
    round: PolaRound,
    optionsCount: number,
): boolean {
    let expected: string;

    if (round.type === 'arithmetic') {
        const seq = round.sequence.map(Number);
        const d = seq[1] - seq[0];

        if (!seq.every((v, i) => i === 0 || v - seq[i - 1] === d)) {
            return false;
        }

        expected = String(seq[seq.length - 1] + d);
    } else if (round.type === 'geometric') {
        const seq = round.sequence.map(Number);
        const r = seq[1] / seq[0];

        if (!seq.every((v, i) => i === 0 || v / seq[i - 1] === r)) {
            return false;
        }

        expected = String(seq[seq.length - 1] * r);
    } else {
        const seq = round.sequence;
        let period = seq.length;

        for (let p = 1; p < seq.length; p++) {
            let ok = true;

            for (let i = p; i < seq.length; i++) {
                if (seq[i] !== seq[i - p]) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                period = p;
                break;
            }
        }

        expected = seq[seq.length - period];
    }

    if (expected !== round.answer) {
        return false;
    }

    if (round.options.length !== optionsCount) {
        return false;
    }

    if (new Set(round.options).size !== round.options.length) {
        return false;
    }

    return round.options.filter((o) => o === round.answer).length === 1;
}

export function createModule(
    params: GameParams,
): GameModule<PolaRound, PolaAnswer> {
    const settings = readSettings(params);
    let index = 0;
    let correct = 0;
    let score = 0;
    let current: PolaRound | null = null;

    const next = (): PolaRound => ({
        ...generateQuestion(settings),
        index,
        total: settings.rounds,
    });

    return {
        init() {
            index = 0;
            correct = 0;
            score = 0;
            current = next();
        },
        renderRound() {
            return index < settings.rounds ? current : null;
        },
        onAnswer(answer) {
            const isCorrect =
                current !== null && answer.value === current.answer;

            if (isCorrect) {
                correct += 1;
                const fraction = Math.max(
                    0,
                    Math.min(1, 1 - answer.elapsedMs / SPEED_REF_MS),
                );
                score += 50 + Math.round(50 * fraction);
            }

            index += 1;
            current = index < settings.rounds ? next() : null;

            return { correct: isCorrect };
        },
        isFinished() {
            return index >= settings.rounds;
        },
        getResult() {
            return {
                score,
                accuracy:
                    settings.rounds > 0 ? (correct / settings.rounds) * 100 : 0,
                rounds: settings.rounds,
                durationMs: 0,
                meta: { correct },
            };
        },
    };
}

function Token({
    kind,
    token,
    large,
}: {
    kind: Kind;
    token: string;
    large?: boolean;
}) {
    if (kind === 'number') {
        return (
            <span
                className={cn(
                    'font-bold tabular-nums',
                    large ? 'text-3xl' : 'text-2xl',
                )}
            >
                {token}
            </span>
        );
    }

    if (kind === 'shape') {
        return (
            <span
                className={large ? 'text-4xl' : 'text-3xl'}
                aria-label={token}
            >
                {SHAPES[token]}
            </span>
        );
    }

    return (
        <span className="flex items-center gap-2">
            <span
                aria-hidden
                className="h-6 w-6 rounded-full border border-black/10"
                style={{ backgroundColor: PATTERN_COLORS[token] }}
            />
            <span className="text-sm capitalize">{token}</span>
        </span>
    );
}

function PolaBoard({
    round,
    onAnswer,
    disabled,
}: GameRoundProps<PolaRound, PolaAnswer>) {
    const startRef = useRef<number>(0);
    const answeredRef = useRef(false);

    useEffect(() => {
        startRef.current = Date.now();
        answeredRef.current = false;
    }, [round.index]);

    const choose = (value: string) => {
        if (disabled || answeredRef.current) {
            return;
        }

        answeredRef.current = true;
        // Date.now() in an event handler is intentional (reaction-time measure).
        // eslint-disable-next-line react-hooks/purity
        onAnswer({ value, elapsedMs: Date.now() - startRef.current });
    };

    return (
        <div className="flex w-full flex-col items-center gap-6">
            <p className="text-sm text-muted-foreground">Lanjutkan polanya</p>

            <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
                {round.sequence.map((token, i) => (
                    <Token key={i} kind={round.kind} token={token} large />
                ))}
                <span className="text-3xl font-bold text-muted-foreground">
                    ?
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {round.options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        onClick={() => choose(option)}
                        aria-label={`Pilih ${option}`}
                        className="flex min-h-16 min-w-24 items-center justify-center rounded-xl border border-border bg-card px-4 hover:bg-accent disabled:opacity-50"
                    >
                        <Token kind={round.kind} token={option} />
                    </button>
                ))}
            </div>
        </div>
    );
}

const lanjutkanPola: GameEntry<PolaRound, PolaAnswer> = {
    createModule,
    Round: PolaBoard,
};

export default lanjutkanPola;
