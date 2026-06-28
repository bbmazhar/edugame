<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
