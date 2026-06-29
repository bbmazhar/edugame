import type { GameEntry } from '@/types/game';
import dummyGame from './dummy-game';
import fokusWarna from './fokus-warna';
import hitungCepat from './hitung-cepat';
import ingatUrutan from './ingat-urutan';
import lanjutkanPola from './lanjutkan-pola';
import memoryMatch from './memory-match';
import susunKata from './susun-kata';

/**
 * Maps a game slug to its implementation. Real games are registered here in
 * Phase 5; until then unimplemented slugs fall back to the dummy game so the
 * full play → score → save pipeline can be exercised.
 */
const registry: Record<string, GameEntry> = {
    'hitung-cepat': hitungCepat as GameEntry,
    'fokus-warna': fokusWarna as GameEntry,
    'memory-match': memoryMatch as GameEntry,
    'ingat-urutan': ingatUrutan as GameEntry,
    'lanjutkan-pola': lanjutkanPola as GameEntry,
    'susun-kata': susunKata as GameEntry,
};

export function resolveGame(slug: string): GameEntry {
    return registry[slug] ?? dummyGame;
}
