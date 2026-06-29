import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
    GameEntry,
    GameModule,
    GameParams,
    GameRoundProps,
} from '@/types/game';

export const PAD_COUNT = 4;

const PADS = [
    { label: 'Merah', hex: '#ef4444' },
    { label: 'Biru', hex: '#3b82f6' },
    { label: 'Hijau', hex: '#22c55e' },
    { label: 'Kuning', hex: '#eab308' },
];

type Modality = 'color' | 'number' | 'sound';

export type SimonRound = {
    sequence: number[];
    currentLength: number;
    maxLength: number;
    modality: Modality;
    padCount: number;
    showMs: number;
    gapMs: number;
};

export type SimonAnswer = {
    success: boolean;
};

export type SimonSettings = {
    startLength: number;
    maxLength: number;
    showMs: number;
    gapMs: number;
    modality: Modality;
};

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);

    return Number.isFinite(n) ? n : fallback;
}

export function readSettings(params: GameParams): SimonSettings {
    const startLength = Math.max(
        2,
        Math.floor(toNumber(params.start_length, 3)),
    );
    const maxLength = Math.max(
        startLength,
        Math.floor(toNumber(params.max_length, 7)),
    );
    const modality =
        params.modality === 'number' || params.modality === 'sound'
            ? params.modality
            : 'color';

    return {
        startLength,
        maxLength,
        showMs: Math.max(150, Math.floor(toNumber(params.show_ms, 800))),
        gapMs: Math.max(0, Math.floor(toNumber(params.gap_ms, 300))),
        modality,
    };
}

function randomSequence(length: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * PAD_COUNT));
}

export function createModule(
    params: GameParams,
): GameModule<SimonRound, SimonAnswer> {
    const settings = readSettings(params);
    let currentLength = settings.startLength;
    let sequence: number[] = [];
    let bestLength = 0;
    let roundsCompleted = 0;
    let finished = false;

    return {
        init() {
            currentLength = settings.startLength;
            sequence = randomSequence(currentLength);
            bestLength = 0;
            roundsCompleted = 0;
            finished = false;
        },
        renderRound() {
            if (finished) {
                return null;
            }

            return {
                sequence: [...sequence],
                currentLength,
                maxLength: settings.maxLength,
                modality: settings.modality,
                padCount: PAD_COUNT,
                showMs: settings.showMs,
                gapMs: settings.gapMs,
            };
        },
        onAnswer(answer) {
            if (finished) {
                return { correct: false };
            }

            if (answer.success) {
                bestLength = currentLength;
                roundsCompleted += 1;

                if (currentLength >= settings.maxLength) {
                    finished = true;
                } else {
                    currentLength += 1;
                    sequence = randomSequence(currentLength);
                }

                return { correct: true };
            }

            finished = true;

            return { correct: false };
        },
        isFinished() {
            return finished;
        },
        getResult() {
            return {
                score: bestLength,
                accuracy:
                    settings.maxLength > 0
                        ? (bestLength / settings.maxLength) * 100
                        : 0,
                rounds: roundsCompleted,
                durationMs: 0,
                meta: {
                    bestLength,
                    maxLength: settings.maxLength,
                    startLength: settings.startLength,
                },
            };
        },
    };
}

function SimonBoard({
    round,
    onAnswer,
    disabled,
}: GameRoundProps<SimonRound, SimonAnswer>) {
    const [phase, setPhase] = useState<'showing' | 'input'>('showing');
    const [litPad, setLitPad] = useState<number | null>(null);
    const [inputCount, setInputCount] = useState(0);
    const answeredRef = useRef(false);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    const isNumber = round.modality === 'number';

    useEffect(() => {
        answeredRef.current = false;
        setPhase('showing');
        setInputCount(0);
        setLitPad(null);
        timers.current.forEach(clearTimeout);
        timers.current = [];

        const step = round.showMs + round.gapMs;
        round.sequence.forEach((pad, k) => {
            timers.current.push(setTimeout(() => setLitPad(pad), k * step));
            timers.current.push(
                setTimeout(() => setLitPad(null), k * step + round.showMs),
            );
        });
        timers.current.push(
            setTimeout(() => setPhase('input'), round.sequence.length * step),
        );

        return () => {
            timers.current.forEach(clearTimeout);
            timers.current = [];
        };
        // Replay the sequence whenever a new round (longer length) starts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round.currentLength]);

    const flash = (pad: number) => {
        setLitPad(pad);
        timers.current.push(setTimeout(() => setLitPad(null), 180));
    };

    const tap = (pad: number) => {
        if (disabled || phase !== 'input' || answeredRef.current) {
            return;
        }

        if (round.sequence[inputCount] === pad) {
            flash(pad);
            const next = inputCount + 1;
            setInputCount(next);

            if (next >= round.currentLength) {
                answeredRef.current = true;
                onAnswer({ success: true });
            }
        } else {
            answeredRef.current = true;
            onAnswer({ success: false });
        }
    };

    return (
        <div className="flex w-full flex-col items-center gap-5">
            <p className="text-sm text-muted-foreground">
                {phase === 'showing'
                    ? 'Perhatikan urutannya…'
                    : `Ulangi urutan: ${inputCount}/${round.currentLength}`}
            </p>
            <p className="text-xs text-muted-foreground">
                Level {round.currentLength}
            </p>

            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: round.padCount }, (_, i) => {
                    const lit = litPad === i;
                    const dim = phase === 'showing' && !lit;

                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={disabled || phase !== 'input'}
                            onClick={() => tap(i)}
                            aria-label={
                                isNumber
                                    ? `Angka ${i + 1}`
                                    : `Pad ${PADS[i].label}`
                            }
                            style={
                                isNumber
                                    ? undefined
                                    : { backgroundColor: PADS[i].hex }
                            }
                            className={cn(
                                'flex aspect-square min-h-20 min-w-20 items-center justify-center rounded-2xl border border-black/10 text-3xl font-bold transition-[opacity,transform]',
                                isNumber
                                    ? lit
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card text-foreground'
                                    : 'text-white',
                                dim ? 'opacity-40' : 'opacity-100',
                                lit && 'scale-105',
                            )}
                        >
                            {isNumber ? i + 1 : ''}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const ingatUrutan: GameEntry<SimonRound, SimonAnswer> = {
    createModule,
    Round: SimonBoard,
};

export default ingatUrutan;
