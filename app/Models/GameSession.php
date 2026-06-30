<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $user_id
 * @property int $game_id
 * @property int $level_id
 * @property int $score
 * @property string $accuracy
 * @property int $duration_ms
 * @property int $rounds
 * @property array<string, mixed>|null $metadata
 * @property Carbon|null $played_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class GameSession extends Model
{
    protected $fillable = [
        'user_id',
        'game_id',
        'level_id',
        'score',
        'accuracy',
        'duration_ms',
        'rounds',
        'metadata',
        'played_at',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'accuracy' => 'decimal:2',
            'duration_ms' => 'integer',
            'rounds' => 'integer',
            'metadata' => 'array',
            'played_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Game, $this> */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /** @return BelongsTo<Level, $this> */
    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }
}
