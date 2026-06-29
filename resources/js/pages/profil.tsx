import PublicLayout from '@/layouts/public-layout';
import { clearGuestSessions, getGuestSessions } from '@/lib/guest-progress';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type PerGame = {
    slug: string | null;
    name: string | null;
    best_score: number;
    total_sessions: number;
    streak_count: number;
    last_played_date: string | null;
};

type RecentSession = {
    id: number;
    game: string | null;
    level: string | null;
    score: number;
    accuracy: number;
    duration_ms: number;
    played_at: string | null;
};

type ProfilProps = {
    displayName: string;
    summary: { totalSessions: number; streak: number; bestScore: number; gamesPlayed: number };
    perGame: PerGame[];
    recent: RecentSession[];
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Profil({ displayName, summary, perGame, recent }: ProfilProps) {
    const [guestIds, setGuestIds] = useState<number[]>([]);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        setGuestIds(getGuestSessions());
    }, []);

    const claim = () => {
        setClaiming(true);
        router.post(
            '/sessions/claim',
            { ids: guestIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    clearGuestSessions();
                    setGuestIds([]);
                },
                onFinish: () => setClaiming(false),
            },
        );
    };

    const hasPlayed = summary.totalSessions > 0;

    return (
        <PublicLayout>
            <Head title="Profil" />

            <section className="flex flex-col gap-8">
                <header className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Halo, {displayName}
                    </h1>
                    <p className="text-muted-foreground">Pantau perkembangan latihanmu di sini.</p>
                </header>

                {guestIds.length > 0 && (
                    <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-accent/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm">
                            Ada <strong>{guestIds.length}</strong> sesi yang kamu mainkan sebagai tamu.
                            Klaim untuk menyimpannya ke akunmu.
                        </p>
                        <button
                            type="button"
                            onClick={claim}
                            disabled={claiming}
                            className="min-h-11 shrink-0 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            {claiming ? 'Mengklaim…' : 'Klaim progres tamu'}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <SummaryCard label="Total main" value={summary.totalSessions} />
                    <SummaryCard label="Streak" value={`${summary.streak} hari`} />
                    <SummaryCard label="Skor terbaik" value={summary.bestScore} />
                    <SummaryCard label="Game dimainkan" value={summary.gamesPlayed} />
                </div>

                {!hasPlayed ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                        <p className="text-muted-foreground">Kamu belum bermain. Yuk mulai!</p>
                        <Link
                            href="/katalog"
                            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                            Jelajahi game
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold">Statistik per game</h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {perGame.map((g) => (
                                    <div
                                        key={g.slug ?? g.name}
                                        className="rounded-xl border border-border bg-card p-4"
                                    >
                                        <h3 className="font-semibold">{g.name}</h3>
                                        <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                            <Metric label="Terbaik" value={g.best_score} />
                                            <Metric label="Main" value={g.total_sessions} />
                                            <Metric label="Streak" value={g.streak_count} />
                                        </dl>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold">Riwayat terbaru</h2>
                            <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Game</th>
                                            <th className="px-4 py-2 font-medium">Jenjang</th>
                                            <th className="px-4 py-2 font-medium">Skor</th>
                                            <th className="px-4 py-2 font-medium">Akurasi</th>
                                            <th className="px-4 py-2 font-medium">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.map((s) => (
                                            <tr key={s.id} className="border-t border-border">
                                                <td className="px-4 py-2">{s.game}</td>
                                                <td className="px-4 py-2">{s.level}</td>
                                                <td className="px-4 py-2 tabular-nums">{s.score}</td>
                                                <td className="px-4 py-2 tabular-nums">
                                                    {s.accuracy.toFixed(0)}%
                                                </td>
                                                <td className="px-4 py-2 text-muted-foreground">
                                                    {formatDate(s.played_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </PublicLayout>
    );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
        </div>
    );
}
