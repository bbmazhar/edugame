import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameEntry, GameModule, GameParams, GameResult } from '@/types/game';
import { recordSession } from './storage';

type Phase = 'intro' | 'countdown' | 'playing' | 'result';

type Props = {
    game: { slug: string; name: string; domain: string };
    level: { code: string; name: string };
    params: GameParams;
    entry: GameEntry;
    onExit: () => void;
};

export default function OfflineGameShell({ game, level, params, entry, onExit }: Props) {
    const moduleRef = useRef<GameModule | null>(null);
    const startedAtRef = useRef(0);
    const accumulatedRef = useRef(0);

    const [phase, setPhase] = useState<Phase>('intro');
    const [countdown, setCountdown] = useState(3);
    const [round, setRound] = useState<unknown>(null);
    const [answered, setAnswered] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [paused, setPaused] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [result, setResult] = useState<GameResult | null>(null);

    const elapsedNow = useCallback(() => {
        const seg = phase === 'playing' && !paused ? Date.now() - startedAtRef.current : 0;

        return accumulatedRef.current + seg;
    }, [phase, paused]);

    const start = useCallback(() => {
        const mod = entry.createModule(params);
        mod.init();
        moduleRef.current = mod;
        accumulatedRef.current = 0;
        setAnswered(0);
        setCorrect(0);
        setPaused(false);
        setElapsed(0);
        setResult(null);
        setCountdown(3);
        setPhase('countdown');
    }, [entry, params]);

    useEffect(() => {
        if (phase !== 'countdown') {
            return;
        }

        if (countdown <= 0) {
            startedAtRef.current = Date.now();
            setRound(moduleRef.current?.renderRound() ?? null);
            setPhase('playing');

            return;
        }

        const id = setTimeout(() => setCountdown((c) => c - 1), 700);

        return () => clearTimeout(id);
    }, [phase, countdown]);

    useEffect(() => {
        if (phase !== 'playing' || paused) {
            return;
        }

        const id = setInterval(() => setElapsed(elapsedNow()), 200);

        return () => clearInterval(id);
    }, [phase, paused, elapsedNow]);

    const finish = useCallback(() => {
        accumulatedRef.current = elapsedNow();
        const base = moduleRef.current?.getResult();

        if (!base) {
            return;
        }

        const final: GameResult = { ...base, durationMs: accumulatedRef.current };
        setResult(final);
        setElapsed(accumulatedRef.current);
        setPhase('result');
        recordSession(game.slug, level.code, final);
    }, [elapsedNow, game.slug, level.code]);

    const handleAnswer = useCallback(
        (answer: unknown) => {
            const mod = moduleRef.current;

            if (!mod || paused) {
                return;
            }

            const { correct: ok } = mod.onAnswer(answer);
            setAnswered((a) => a + 1);

            if (ok) {
                setCorrect((c) => c + 1);
            }

            if (mod.isFinished()) {
                finish();
            } else {
                setRound(mod.renderRound());
            }
        },
        [paused, finish],
    );

    const togglePause = useCallback(() => {
        setPaused((prev) => {
            if (!prev) {
                accumulatedRef.current += Date.now() - startedAtRef.current;
            } else {
                startedAtRef.current = Date.now();
            }

            return !prev;
        });
    }, []);

    const RoundComponent = entry.Round;
    const seconds = (elapsed / 1000).toFixed(1);

    return (
        <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col px-4 py-6">
            {phase === 'intro' && (
                <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                    <h1 className="text-3xl font-semibold">{game.name}</h1>
                    <p className="text-muted-foreground">
                        Jenjang {level.code} · {level.name}
                    </p>
                    <button
                        type="button"
                        onClick={start}
                        className="min-h-12 rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground"
                    >
                        Mulai
                    </button>
                    <button type="button" onClick={onExit} className="text-sm text-muted-foreground hover:underline">
                        Kembali
                    </button>
                </div>
            )}

            {phase === 'countdown' && (
                <div className="flex flex-1 items-center justify-center">
                    <span className="text-7xl font-bold text-primary">{countdown > 0 ? countdown : 'Mulai!'}</span>
                </div>
            )}

            {phase === 'playing' && (
                <>
                    <div className="mb-6 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ronde {answered + 1}</span>
                        <span className="font-medium">Benar {correct}</span>
                        <span className="text-muted-foreground tabular-nums">{seconds}s</span>
                        <button type="button" onClick={togglePause} className="min-h-11 rounded-md border border-border px-3 py-1.5">
                            {paused ? 'Lanjut' : 'Jeda'}
                        </button>
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        {paused ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <p className="text-lg font-medium">Dijeda</p>
                                <button type="button" onClick={togglePause} className="min-h-11 rounded-md bg-primary px-6 py-2 text-primary-foreground">
                                    Lanjutkan
                                </button>
                                <button type="button" onClick={onExit} className="text-sm text-muted-foreground hover:underline">
                                    Keluar
                                </button>
                            </div>
                        ) : (
                            round !== null && <RoundComponent round={round} onAnswer={handleAnswer} />
                        )}
                    </div>
                </>
            )}

            {phase === 'result' && result && (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-semibold">Kerja bagus! 🎉</h2>
                        <p className="text-muted-foreground">Setiap latihan membuatmu makin tajam.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Stat label="Skor" value={String(result.score)} />
                        <Stat label="Akurasi" value={`${result.accuracy.toFixed(0)}%`} />
                        <Stat label="Durasi" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
                        <Stat label="Ronde" value={String(result.rounds)} />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button type="button" onClick={start} className="min-h-12 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground">
                            Main lagi
                        </button>
                        <button type="button" onClick={onExit} className="min-h-12 rounded-lg border border-border px-6 py-3 hover:bg-accent">
                            Game lain
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
        </div>
    );
}
