import { useAccessibility } from '@/hooks/use-accessibility';
import { postJson } from '@/lib/csrf';
import type { GameEntry, GameModule, GameParams, GameResult } from '@/types/game';
import { Link } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Phase = 'intro' | 'countdown' | 'playing' | 'result';

type ServerStats = {
    best_score: number;
    streak_count: number;
    total_sessions: number;
} | null;

type GameShellProps = {
    game: { id: number; slug: string; name: string; cognitive_domain?: string | null };
    level: { id: number; code: string; name: string };
    params: GameParams;
    entry: GameEntry;
    catalogHref: string;
};

export default function GameShell({ game, level, params, entry, catalogHref }: GameShellProps) {
    const { settings } = useAccessibility();

    const moduleRef = useRef<GameModule | null>(null);
    const startedAtRef = useRef<number>(0);
    const accumulatedRef = useRef<number>(0);

    const [phase, setPhase] = useState<Phase>('intro');
    const [countdown, setCountdown] = useState(3);
    const [round, setRound] = useState<unknown>(null);
    const [answered, setAnswered] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [paused, setPaused] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    const [result, setResult] = useState<GameResult | null>(null);
    const [serverStats, setServerStats] = useState<ServerStats>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);

    const elapsedNow = useCallback(() => {
        const segment = phase === 'playing' && !paused ? Date.now() - startedAtRef.current : 0;
        return accumulatedRef.current + segment;
    }, [phase, paused]);

    const start = useCallback(() => {
        const mod = entry.createModule(params);
        mod.init(params);
        moduleRef.current = mod;
        accumulatedRef.current = 0;
        setAnswered(0);
        setCorrect(0);
        setPaused(false);
        setElapsed(0);
        setResult(null);
        setServerStats(null);
        setSaveError(false);
        setCountdown(3);
        setPhase('countdown');
    }, [entry, params]);

    // Countdown ticker.
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

    // Live timer display while playing.
    useEffect(() => {
        if (phase !== 'playing' || paused) {
            return;
        }

        const id = setInterval(() => setElapsed(elapsedNow()), 200);
        return () => clearInterval(id);
    }, [phase, paused, elapsedNow]);

    const save = useCallback(
        (finalResult: GameResult) => {
            setSaving(true);
            setSaveError(false);

            postJson<{ ok: boolean; stats: ServerStats }>('/sessions', {
                game_id: game.id,
                level_id: level.id,
                score: finalResult.score,
                accuracy: Number(finalResult.accuracy.toFixed(2)),
                duration_ms: finalResult.durationMs,
                rounds: finalResult.rounds,
                metadata: { slug: game.slug, prototype: entry.prototype ?? false },
            })
                .then((res) => setServerStats(res.stats))
                .catch(() => setSaveError(true))
                .finally(() => setSaving(false));
        },
        [game.id, game.slug, level.id, entry.prototype],
    );

    const finish = useCallback(() => {
        accumulatedRef.current = elapsedNow();
        const base = moduleRef.current?.getResult();

        if (!base) {
            return;
        }

        const finalResult: GameResult = { ...base, durationMs: accumulatedRef.current };
        setResult(finalResult);
        setElapsed(accumulatedRef.current);
        setPhase('result');
        save(finalResult);
    }, [elapsedNow, save]);

    const handleAnswer = useCallback(
        (answer: unknown) => {
            const mod = moduleRef.current;
            if (!mod || paused) {
                return;
            }

            const { correct: wasCorrect } = mod.onAnswer(answer);
            setAnswered((a) => a + 1);
            if (wasCorrect) {
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
                accumulatedRef.current = accumulatedRef.current + (Date.now() - startedAtRef.current);
            } else {
                startedAtRef.current = Date.now();
            }
            return !prev;
        });
    }, []);

    const RoundComponent = entry.Round;
    const seconds = (elapsed / 1000).toFixed(1);

    return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col">
            {entry.prototype && (
                <p className="mb-4 rounded-md bg-accent px-3 py-2 text-center text-xs text-accent-foreground">
                    Mode prototipe — mekanik asli untuk game ini menyusul.
                </p>
            )}

            {phase === 'intro' && (
                <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                    <h1 className="text-3xl font-semibold">{game.name}</h1>
                    <p className="text-muted-foreground">
                        Jenjang {level.code} · {level.name}
                    </p>
                    <button
                        type="button"
                        onClick={start}
                        className="min-h-12 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
                    >
                        Mulai
                    </button>
                    <Link href={catalogHref} className="text-sm text-muted-foreground hover:underline">
                        Kembali ke katalog
                    </Link>
                </div>
            )}

            {phase === 'countdown' && (
                <div className="flex flex-1 items-center justify-center">
                    <span className="text-7xl font-bold text-primary">
                        {countdown > 0 ? countdown : 'Mulai!'}
                    </span>
                </div>
            )}

            {phase === 'playing' && (
                <>
                    <div className="mb-6 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ronde {answered + 1}</span>
                        <span className="font-medium">Benar {correct}</span>
                        <span className="text-muted-foreground tabular-nums">{seconds}s</span>
                        <button
                            type="button"
                            onClick={togglePause}
                            className="min-h-11 rounded-md border border-border px-3 py-1.5"
                        >
                            {paused ? 'Lanjut' : 'Jeda'}
                        </button>
                    </div>

                    <div className="flex flex-1 items-center justify-center">
                        {paused ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <p className="text-lg font-medium">Dijeda</p>
                                <button
                                    type="button"
                                    onClick={togglePause}
                                    className="min-h-11 rounded-md bg-primary px-6 py-2 text-primary-foreground"
                                >
                                    Lanjutkan
                                </button>
                                <Link href={catalogHref} className="text-sm text-muted-foreground hover:underline">
                                    Keluar
                                </Link>
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

                    {serverStats && (
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <span>Skor terbaik: {serverStats.best_score}</span>
                            <span>Streak: {serverStats.streak_count} hari</span>
                            <span>Total main: {serverStats.total_sessions}</span>
                        </div>
                    )}
                    {saving && <p className="text-sm text-muted-foreground">Menyimpan skor…</p>}
                    {saveError && (
                        <p className="text-sm text-muted-foreground">
                            Skor belum tersimpan, tapi kamu tetap hebat. Coba lagi kapan saja.
                        </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={start}
                            className="min-h-12 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
                        >
                            Main lagi
                        </button>
                        <Link
                            href={catalogHref}
                            className="min-h-12 rounded-lg border border-border px-6 py-3 hover:bg-accent"
                        >
                            Game lain
                        </Link>
                    </div>
                </div>
            )}

            {/* Sound preference is read here so games can opt into audio later. */}
            <span className="sr-only">{settings.sound ? 'suara aktif' : 'suara nonaktif'}</span>
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
