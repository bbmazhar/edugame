import GameShell from '@/components/game-shell';
import { resolveGame } from '@/games/registry';
import PublicLayout from '@/layouts/public-layout';
import type { GameParams } from '@/types/game';
import { Head } from '@inertiajs/react';

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

export default function Play({ game, level, params }: PlayProps) {
    const entry = resolveGame(game.slug);

    return (
        <PublicLayout>
            <Head title={game.name} />

            <GameShell
                game={game}
                level={level}
                params={params}
                entry={entry}
                catalogHref={`/katalog?level=${level.code}`}
            />
        </PublicLayout>
    );
}
