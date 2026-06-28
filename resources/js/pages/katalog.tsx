import GameCard, { type CatalogGame } from '@/components/game-card';
import LevelPicker, { type CatalogLevel } from '@/components/level-picker';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';

type KatalogProps = {
    levels: CatalogLevel[];
    selectedLevel: string | null;
    games: CatalogGame[];
};

export default function Katalog({ levels, selectedLevel, games }: KatalogProps) {
    return (
        <PublicLayout>
            <Head title="Katalog Game" />

            <section className="flex flex-col gap-6">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Katalog Game
                    </h1>
                    <p className="text-muted-foreground">
                        Pilih jenjang untuk melihat game yang sesuai. Tidak perlu
                        akun untuk mulai bermain.
                    </p>
                </header>

                {levels.length > 0 ? (
                    <LevelPicker levels={levels} selected={selectedLevel} />
                ) : (
                    <p className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
                        Belum ada jenjang yang aktif saat ini.
                    </p>
                )}

                {levels.length > 0 &&
                    (games.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {games.map((game) => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
                            Belum ada game untuk jenjang ini. Coba jenjang lain.
                        </p>
                    ))}
            </section>
        </PublicLayout>
    );
}
