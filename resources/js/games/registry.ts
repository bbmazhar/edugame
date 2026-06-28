import type { GameEntry } from '@/types/game';
import dummyGame from './dummy-game';
import hitungCepat from './hitung-cepat';

/**
 * Maps a game slug to its implementation. Real games are registered here in
 * Phase 5; until then unimplemented slugs fall back to the dummy game so the
 * full play → score → save pipeline can be exercised.
 */
const registry: Record<string, GameEntry> = {
    'hitung-cepat': hitungCepat as GameEntry,
};

export function resolveGame(slug: string): GameEntry {
    return registry[slug] ?? dummyGame;
}
