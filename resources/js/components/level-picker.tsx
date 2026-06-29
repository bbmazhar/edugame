import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type CatalogLevel = {
    id: number;
    code: string;
    name: string;
};

export default function LevelPicker({
    levels,
    selected,
}: {
    levels: CatalogLevel[];
    selected: string | null;
}) {
    if (levels.length === 0) {
        return null;
    }

    return (
        <div
            role="tablist"
            aria-label="Pilih jenjang"
            className="flex flex-wrap gap-2"
        >
            {levels.map((level) => {
                const isActive = level.code === selected;

                return (
                    <Link
                        key={level.id}
                        href={`/katalog?level=${level.code}`}
                        preserveScroll
                        preserveState
                        only={['games', 'selectedLevel']}
                        role="tab"
                        aria-selected={isActive}
                        className={cn(
                            'min-h-11 rounded-full border px-5 py-2 text-sm font-medium transition-colors',
                            isActive
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card hover:bg-accent',
                        )}
                        title={level.name}
                    >
                        {level.code}
                    </Link>
                );
            })}
        </div>
    );
}
