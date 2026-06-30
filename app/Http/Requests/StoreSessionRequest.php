<?php

namespace App\Http\Requests;

use App\Models\GameConfig;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreSessionRequest extends FormRequest
{
    private const MAX_ROUNDS = 500;

    private const MAX_DURATION_MS = 3_600_000; // 1 hour

    private const MAX_SCORE = 1_000_000;

    private const MAX_SCORE_PER_ROUND = 1000;

    private const MIN_MS_PER_ROUND = 60;

    public function authorize(): bool
    {
        // Public endpoint: guests may record sessions too.
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'game_id' => ['required', 'integer', 'exists:games,id'],
            'level_id' => ['required', 'integer', 'exists:levels,id'],
            'score' => ['required', 'integer', 'min:0', 'max:'.self::MAX_SCORE],
            'accuracy' => ['required', 'numeric', 'min:0', 'max:100'],
            'duration_ms' => ['required', 'integer', 'min:0', 'max:'.self::MAX_DURATION_MS],
            'rounds' => ['required', 'integer', 'min:0', 'max:'.self::MAX_ROUNDS],
            'metadata' => ['nullable', 'array'],
        ];
    }

    /**
     * Server-side sanity checks. Client scores cannot be fully recomputed for
     * procedural games, so we reject implausible submissions and bind each
     * session to a real, enabled (game, level) configuration.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $rounds = (int) $this->input('rounds', 0);
            $score = (int) $this->input('score', 0);
            $duration = (int) $this->input('duration_ms', 0);

            if ($score > ($rounds + 1) * self::MAX_SCORE_PER_ROUND) {
                $validator->errors()->add('score', 'Skor tidak masuk akal untuk jumlah ronde.');
            }

            if ($rounds > 0 && $duration < $rounds * self::MIN_MS_PER_ROUND) {
                $validator->errors()->add('duration_ms', 'Durasi terlalu singkat untuk jumlah ronde.');
            }

            if ($this->filled('game_id') && $this->filled('level_id')) {
                $playable = GameConfig::query()
                    ->where('game_id', $this->input('game_id'))
                    ->where('level_id', $this->input('level_id'))
                    ->where('is_enabled', true)
                    ->exists();

                if (! $playable) {
                    $validator->errors()->add('game_id', 'Kombinasi game dan jenjang tidak tersedia.');
                }
            }
        });
    }
}
