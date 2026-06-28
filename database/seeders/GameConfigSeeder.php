<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\GameConfig;
use App\Models\Level;
use Illuminate\Database\Seeder;

class GameConfigSeeder extends Seeder
{
    /**
     * Default difficulty params per (game slug, level code), from Appendix A.
     * Levels not explicitly listed in the spec (e.g. SMP) are interpolated.
     */
    public function run(): void
    {
        $matrix = [
            'hitung-cepat' => [
                'SD' => ['operations' => ['+', '-'], 'max_operand' => 20, 'time_per_question_ms' => 8000, 'allow_negative' => false, 'total_questions' => 10],
                'SMP' => ['operations' => ['+', '-', '×'], 'max_operand' => 50, 'time_per_question_ms' => 6000, 'allow_negative' => false, 'total_questions' => 12],
                'SMA' => ['operations' => ['+', '-', '×', '÷'], 'max_operand' => 100, 'time_per_question_ms' => 5000, 'allow_negative' => true, 'total_questions' => 15],
                'UMUM' => ['operations' => ['+', '-', '×', '÷'], 'max_operand' => 100, 'time_per_question_ms' => 5000, 'allow_negative' => true, 'total_questions' => 15],
            ],
            'fokus-warna' => [
                'SD' => ['display_ms' => 3000, 'congruent_ratio' => 0.6, 'distractor_count' => 2, 'rounds' => 10],
                'SMP' => ['display_ms' => 2200, 'congruent_ratio' => 0.45, 'distractor_count' => 3, 'rounds' => 12],
                'SMA' => ['display_ms' => 1500, 'congruent_ratio' => 0.3, 'distractor_count' => 4, 'rounds' => 15],
                'UMUM' => ['display_ms' => 1500, 'congruent_ratio' => 0.3, 'distractor_count' => 4, 'rounds' => 15],
            ],
            'memory-match' => [
                'SD' => ['rows' => 3, 'cols' => 4, 'flip_back_ms' => 1200, 'theme' => 'animals'],
                'SMP' => ['rows' => 4, 'cols' => 4, 'flip_back_ms' => 1000, 'theme' => 'animals'],
                'SMA' => ['rows' => 4, 'cols' => 6, 'flip_back_ms' => 900, 'theme' => 'animals'],
                'UMUM' => ['rows' => 5, 'cols' => 6, 'flip_back_ms' => 800, 'theme' => 'animals'],
            ],
            'ingat-urutan' => [
                'SD' => ['start_length' => 3, 'max_length' => 7, 'show_ms' => 800, 'gap_ms' => 300, 'modality' => 'color'],
                'SMP' => ['start_length' => 3, 'max_length' => 8, 'show_ms' => 650, 'gap_ms' => 250, 'modality' => 'color'],
                'SMA' => ['start_length' => 4, 'max_length' => 9, 'show_ms' => 500, 'gap_ms' => 200, 'modality' => 'color'],
                'UMUM' => ['start_length' => 4, 'max_length' => 10, 'show_ms' => 500, 'gap_ms' => 200, 'modality' => 'color'],
            ],
            'lanjutkan-pola' => [
                'SD' => ['pattern_types' => ['arithmetic', 'shape'], 'sequence_length' => 4, 'options_count' => 3],
                'SMP' => ['pattern_types' => ['arithmetic', 'shape', 'color'], 'sequence_length' => 5, 'options_count' => 3],
                'SMA' => ['pattern_types' => ['arithmetic', 'geometric', 'shape', 'color'], 'sequence_length' => 6, 'options_count' => 4],
                'UMUM' => ['pattern_types' => ['arithmetic', 'geometric', 'shape', 'color'], 'sequence_length' => 6, 'options_count' => 4],
            ],
            'susun-kata' => [
                'SD' => ['mode' => 'anagram', 'min_len' => 3, 'max_len' => 4, 'time_ms' => 45000, 'dictionary' => 'id', 'grid_size' => 0],
                'SMP' => ['mode' => 'anagram', 'min_len' => 4, 'max_len' => 6, 'time_ms' => 40000, 'dictionary' => 'id', 'grid_size' => 0],
                'SMA' => ['mode' => 'search', 'min_len' => 5, 'max_len' => 8, 'time_ms' => 60000, 'dictionary' => 'id', 'grid_size' => 8],
                'UMUM' => ['mode' => 'search', 'min_len' => 5, 'max_len' => 8, 'time_ms' => 60000, 'dictionary' => 'id', 'grid_size' => 10],
            ],
        ];

        $gameIds = Game::pluck('id', 'slug');
        $levelIds = Level::pluck('id', 'code');

        foreach ($matrix as $slug => $perLevel) {
            foreach ($perLevel as $code => $params) {
                GameConfig::updateOrCreate(
                    ['game_id' => $gameIds[$slug], 'level_id' => $levelIds[$code]],
                    ['params' => $params, 'is_enabled' => true],
                );
            }
        }
    }
}
