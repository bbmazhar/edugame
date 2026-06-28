<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameConfig extends Model
{
    protected $fillable = [
        'game_id',
        'level_id',
        'params',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'params' => 'array',
            'is_enabled' => 'boolean',
        ];
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
