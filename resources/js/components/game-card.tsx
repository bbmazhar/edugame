import {
    Calculator,
    LayoutGrid,
    ListOrdered,
    Palette,
    Puzzle,
    SpellCheck,
    TrendingUp,
    type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
    calculator: Calculator,
    palette: Palette,
    grid: LayoutGrid,
    'list-ordered': ListOrdered,
    'trending-up': TrendingUp,
    'spell-check': SpellCheck,
};

export type CatalogGame = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    cognitive_domain: string | null;
    icon: string | null;
};

export default function GameCard({ game }: { game: CatalogGame }) {
    const Icon = (game.icon && ICONS[game.icon]) || Puzzle;

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-card-foreground">
            <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div>
                    <h3 className="leading-tight font-semibold">{game.name}</h3>
                    {game.cognitive_domain && (
                        <span className="text-xs text-muted-foreground">
                            {game.cognitive_domain}
                        </span>
                    )}
                </div>
            </div>

            {game.description && (
                <p className="text-sm text-muted-foreground">{game.description}</p>
            )}

            <button
                type="button"
                disabled
                className="mt-auto min-h-11 cursor-not-allowed rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
            >
                Segera hadir
            </button>
        </div>
    );
}
