import type { GameEntry } from '@/types/game';
import dummyGame from './dummy-game';
import fokusWarna from './fokus-warna';
import hitungCepat from './hitung-cepat';
import memoryMatch from './memory-match';

/**
 * Maps a game slug to its implementation. Real games are registered here in
 * Phase 5; until then unimplemented slugs fall back to the dummy game so the
 * full play → score → save pipeline can be exercised.
 */
const registry: Record<string, GameEntry> = {
    'hitung-cepat': hitungCepat as GameEntry,
    'fokus-warna': fokusWarna as GameEntry,
    'memory-match': memoryMatch as GameEntry,
};

export function resolveGame(slug: string): GameEntry {
    return registry[slug] ?? dummyGame;
}
