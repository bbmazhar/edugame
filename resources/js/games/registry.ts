import type { GameEntry } from '@/types/game';

type Loader = () => Promise<{ default: unknown }>;

/**
 * Each game is loaded on demand (code-split into its own chunk) so the play
 * screen ships only the mechanic the player actually opened. Unknown slugs
 * fall back to the dummy game.
 */
const loaders: Record<string, Loader> = {
    'hitung-cepat': () => import('./hitung-cepat'),
    'fokus-warna': () => import('./fokus-warna'),
    'memory-match': () => import('./memory-match'),
    'ingat-urutan': () => import('./ingat-urutan'),
    'lanjutkan-pola': () => import('./lanjutkan-pola'),
    'susun-kata': () => import('./susun-kata'),
};

export async function resolveGame(slug: string): Promise<GameEntry> {
    const loader = loaders[slug] ?? (() => import('./dummy-game'));
    const mod = (await loader()) as { default: GameEntry };

    return mod.default;
}
