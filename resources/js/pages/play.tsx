import ErrorBoundary from '@/components/error-boundary';
import GameShell from '@/components/game-shell';
import { resolveGame } from '@/games/registry';
import PublicLayout from '@/layouts/public-layout';
import type { GameEntry, GameParams } from '@/types/game';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type PlayProps = {
    game: {
        id: number;
        slug: string;
        name: string;
        cognitive_domain: string | null;
        icon: string | null;
    };
    level: { id: number; code: string; name: string };
    params: GameParams;
};

function Notice({ title, body, catalogHref }: { title: string; body: string; catalogHref: string }) {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-medium">{title}</p>
            <p className="max-w-md text-sm text-muted-foreground">{body}</p>
            <Link
                href={catalogHref}
                className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-2 text-sm hover:bg-accent"
            >
                Kembali ke katalog
            </Link>
        </div>
    );
}

export default function Play({ game, level, params }: PlayProps) {
    const catalogHref = `/katalog?level=${level.code}`;
    const [entry, setEntry] = useState<GameEntry | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;
        setEntry(null);
        setFailed(false);

        resolveGame(game.slug)
            .then((resolved) => {
                if (active) setEntry(resolved);
            })
            .catch(() => {
                if (active) setFailed(true);
            });

        return () => {
            active = false;
        };
    }, [game.slug]);

    return (
        <PublicLayout>
            <Head title={game.name} />

            {failed ? (
                <Notice
                    title="Gagal memuat game"
                    body="Periksa koneksimu lalu muat ulang halaman."
                    catalogHref={catalogHref}
                />
            ) : !entry ? (
                <div
                    className="flex min-h-[50vh] items-center justify-center text-muted-foreground"
                    role="status"
                    aria-live="polite"
                >
                    Memuat game…
                </div>
            ) : (
                <ErrorBoundary
                    fallback={
                        <Notice
                            title="Game tersendat"
                            body="Maaf, terjadi gangguan. Coba muat ulang halaman — skor sebelumnya tetap aman."
                            catalogHref={catalogHref}
                        />
                    }
                >
                    <GameShell
                        game={game}
                        level={level}
                        params={params}
                        entry={entry}
                        catalogHref={catalogHref}
                    />
                </ErrorBoundary>
            )}
        </PublicLayout>
    );
}
