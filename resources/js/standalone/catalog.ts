// Bundled catalog + difficulty params (mirrors the seeded game_configs) so the
// standalone app runs fully offline — no server, no BASE_URL.
import type { GameParams } from '@/types/game';

export type LevelCode = 'SD' | 'SMP' | 'SMA' | 'UMUM';

export const LEVELS: { code: LevelCode; name: string }[] = [
    { code: 'SD', name: 'Sekolah Dasar' },
    { code: 'SMP', name: 'Sekolah Menengah Pertama' },
    { code: 'SMA', name: 'Sekolah Menengah Atas' },
    { code: 'UMUM', name: 'Umum' },
];

export type CatalogGame = {
    slug: string;
    name: string;
    description: string;
    domain: string;
    icon: string;
    params: Record<LevelCode, GameParams>;
};

export const GAMES: CatalogGame[] = [
    {
        slug: 'hitung-cepat',
        name: 'Hitung Cepat',
        description: 'Jawab soal aritmetika secepat mungkin.',
        domain: 'numerik',
        icon: 'calculator',
        params: {
            SD: { operations: ['+', '-'], max_operand: 20, time_per_question_ms: 8000, allow_negative: false, total_questions: 10 },
            SMP: { operations: ['+', '-', '×'], max_operand: 50, time_per_question_ms: 6000, allow_negative: false, total_questions: 12 },
            SMA: { operations: ['+', '-', '×', '÷'], max_operand: 100, time_per_question_ms: 5000, allow_negative: true, total_questions: 15 },
            UMUM: { operations: ['+', '-', '×', '÷'], max_operand: 100, time_per_question_ms: 5000, allow_negative: true, total_questions: 15 },
        },
    },
    {
        slug: 'fokus-warna',
        name: 'Fokus Warna',
        description: 'Pilih warna tinta, bukan teksnya.',
        domain: 'atensi-inhibisi',
        icon: 'palette',
        params: {
            SD: { display_ms: 3000, congruent_ratio: 0.6, distractor_count: 2, rounds: 10 },
            SMP: { display_ms: 2200, congruent_ratio: 0.45, distractor_count: 3, rounds: 12 },
            SMA: { display_ms: 1500, congruent_ratio: 0.3, distractor_count: 4, rounds: 15 },
            UMUM: { display_ms: 1500, congruent_ratio: 0.3, distractor_count: 4, rounds: 15 },
        },
    },
    {
        slug: 'memory-match',
        name: 'Memory Match',
        description: 'Balik kartu dan cocokkan pasangannya.',
        domain: 'memori-visual',
        icon: 'grid',
        params: {
            SD: { rows: 3, cols: 4, flip_back_ms: 1200, theme: 'animals' },
            SMP: { rows: 4, cols: 4, flip_back_ms: 1000, theme: 'animals' },
            SMA: { rows: 4, cols: 6, flip_back_ms: 900, theme: 'animals' },
            UMUM: { rows: 5, cols: 6, flip_back_ms: 800, theme: 'animals' },
        },
    },
    {
        slug: 'ingat-urutan',
        name: 'Ingat Urutan',
        description: 'Tirukan urutan yang makin panjang.',
        domain: 'working-memory',
        icon: 'list-ordered',
        params: {
            SD: { start_length: 3, max_length: 7, show_ms: 800, gap_ms: 300, modality: 'color' },
            SMP: { start_length: 3, max_length: 8, show_ms: 650, gap_ms: 250, modality: 'color' },
            SMA: { start_length: 4, max_length: 9, show_ms: 500, gap_ms: 200, modality: 'color' },
            UMUM: { start_length: 4, max_length: 10, show_ms: 500, gap_ms: 200, modality: 'color' },
        },
    },
    {
        slug: 'lanjutkan-pola',
        name: 'Lanjutkan Pola',
        description: 'Pilih lanjutan deret yang benar.',
        domain: 'logika',
        icon: 'trending-up',
        params: {
            SD: { pattern_types: ['arithmetic', 'shape'], sequence_length: 4, options_count: 3 },
            SMP: { pattern_types: ['arithmetic', 'shape', 'color'], sequence_length: 5, options_count: 3 },
            SMA: { pattern_types: ['arithmetic', 'geometric', 'shape', 'color'], sequence_length: 6, options_count: 4 },
            UMUM: { pattern_types: ['arithmetic', 'geometric', 'shape', 'color'], sequence_length: 6, options_count: 4 },
        },
    },
    {
        slug: 'susun-kata',
        name: 'Susun Kata',
        description: 'Susun huruf atau cari kata di grid.',
        domain: 'verbal',
        icon: 'spell-check',
        params: {
            SD: { mode: 'anagram', min_len: 3, max_len: 4, time_ms: 45000, dictionary: 'id', grid_size: 0 },
            SMP: { mode: 'anagram', min_len: 4, max_len: 6, time_ms: 40000, dictionary: 'id', grid_size: 0 },
            SMA: { mode: 'search', min_len: 5, max_len: 8, time_ms: 60000, dictionary: 'id', grid_size: 8 },
            UMUM: { mode: 'search', min_len: 5, max_len: 8, time_ms: 60000, dictionary: 'id', grid_size: 10 },
        },
    },
];
