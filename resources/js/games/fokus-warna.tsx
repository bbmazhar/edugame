import type { GameEntry, GameModule, GameParams, GameRoundProps } from '@/types/game';
import { useEffect, useRef, useState } from 'react';

export type ColorKey = 'merah' | 'biru' | 'hijau' | 'kuning' | 'ungu' | 'oranye';

export const COLORS: Record<ColorKey, { label: string; hex: string; text: string }> = {
    merah: { label: 'Merah', hex: '#dc2626', text: '#ffffff' },
    biru: { label: 'Biru', hex: '#2563eb', text: '#ffffff' },
    hijau: { label: 'Hijau', hex: '#16a34a', text: '#ffffff' },
    kuning: { label: 'Kuning', hex: '#a16207', text: '#ffffff' },
    ungu: { label: 'Ungu', hex: '#7c3aed', text: '#ffffff' },
    oranye: { label: 'Oranye', hex: '#ea580c', text: '#ffffff' },
};

const KEYS = Object.keys(COLORS) as ColorKey[];

export type FokusWarnaRound = {
    wordKey: ColorKey; // text shown
    inkKey: ColorKey; // ink colour = the answer
    options: ColorKey[];
    timeMs: number;
    congruent: boolean;
};

export type FokusWarnaAnswer = {
    value: ColorKey | null;
    timedOut: boolean;
    remainingMs: number;
};

type Settings = {
    displayMs: number;
    congruentRatio: number;
    distractorCount: number;
    rounds: number;
};

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function readSettings(params: GameParams): Settings {
    return {
        displayMs: Math.max(800, Math.floor(toNumber(params.display_ms, 3000))),
        congruentRatio: Math.min(1, Math.max(0, toNumber(params.congruent_ratio, 0.5))),
        distractorCount: Math.min(
            KEYS.length - 1,
            Math.max(1, Math.floor(toNumber(params.distractor_count, 2))),
        ),
        rounds: Math.min(50, Math.max(1, Math.floor(toNumber(params.rounds, 10)))),
    };
}

function pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
    return [...items].sort(() => Math.random() - 0.5);
}

export function buildRound(settings: Settings): FokusWarnaRound {
    const inkKey = pick(KEYS);
    const congruent = Math.random() < settings.congruentRatio;
    const wordKey = congruent ? inkKey : pick(KEYS.filter((k) => k !== inkKey));

    const options = new Set<ColorKey>([inkKey]);
    // On incongruent rounds, the word's colour is the classic tempting trap.
    if (!congruent) {
        options.add(wordKey);
    }

    const pool = shuffle(KEYS.filter((k) => !options.has(k)));
    while (options.size < settings.distractorCount + 1 && pool.length > 0) {
        options.add(pool.pop() as ColorKey);
    }

    return {
        wordKey,
        inkKey,
        options: shuffle([...options]),
        timeMs: settings.displayMs,
        congruent,
    };
}

export function createModule(
    params: GameParams,
): GameModule<FokusWarnaRound, FokusWarnaAnswer> {
    const settings = readSettings(params);
    let index = 0;
    let correct = 0;
    let score = 0;
    let reactionSum = 0;
    let reactionCount = 0;
    let current: FokusWarnaRound | null = null;

    return {
        init() {
            index = 0;
            correct = 0;
            score = 0;
            reactionSum = 0;
            reactionCount = 0;
            current = buildRound(settings);
        },
        renderRound() {
            return index < settings.rounds ? current : null;
        },
        onAnswer(answer) {
            const isCorrect =
                current !== null && !answer.timedOut && answer.value === current.inkKey;

            if (current) {
                if (isCorrect) {
                    correct += 1;
                    const fraction = Math.max(0, Math.min(1, answer.remainingMs / current.timeMs));
                    score += Math.round(100 * (0.5 + 0.5 * fraction));
                    reactionSum += current.timeMs - answer.remainingMs;
                    reactionCount += 1;
                } else if (!answer.timedOut && answer.value !== null) {
                    // Wrong tap is penalised; timeouts are not (non-punishing).
                    score = Math.max(0, score - 50);
                }
            }

            index += 1;
            current = index < settings.rounds ? buildRound(settings) : null;

            return { correct: isCorrect };
        },
        isFinished() {
            return index >= settings.rounds;
        },
        getResult() {
            return {
                score: Math.max(0, score),
                accuracy: settings.rounds > 0 ? (correct / settings.rounds) * 100 : 0,
                rounds: settings.rounds,
                durationMs: 0,
                meta: {
                    correct,
                    avgReactionMs: reactionCount > 0 ? Math.round(reactionSum / reactionCount) : null,
                },
            };
        },
    };
}

function Round({
    round,
    onAnswer,
    disabled,
}: GameRoundProps<FokusWarnaRound, FokusWarnaAnswer>) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round]);

    const choose = (value: ColorKey) => {
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
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} aria-hidden />
            </div>

            <p className="text-sm text-muted-foreground">
                Pilih <strong>warna tinta</strong>-nya, bukan teksnya
            </p>

            <div
                className="text-6xl font-extrabold tracking-wide"
                style={{ color: COLORS[round.inkKey].hex }}
            >
                {COLORS[round.wordKey].label.toUpperCase()}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {round.options.map((key) => (
                    <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        onClick={() => choose(key)}
                        aria-label={`Pilih warna ${COLORS[key].label}`}
                        style={{ backgroundColor: COLORS[key].hex, color: COLORS[key].text }}
                        className="flex min-h-16 min-w-24 items-center justify-center rounded-xl border border-black/10 text-lg font-semibold disabled:opacity-50"
                    >
                        {COLORS[key].label}
                    </button>
                ))}
            </div>
        </div>
    );
}

const fokusWarna: GameEntry<FokusWarnaRound, FokusWarnaAnswer> = {
    createModule,
    Round,
};

export default fokusWarna;
