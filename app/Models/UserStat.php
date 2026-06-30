<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $game_id
 * @property int $best_score
 * @property int $total_sessions
 * @property int $streak_count
 * @property Carbon|null $last_played_date
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class UserStat extends Model
{
    protected $fillable = [
        'user_id',
        'game_id',
        'best_score',
        'total_sessions',
        'streak_count',
        'last_played_date',
    ];

    protected function casts(): array
    {
        return [
            'best_score' => 'integer',
            'total_sessions' => 'integer',
            'streak_count' => 'integer',
            'last_played_date' => 'date',
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
}
