<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    protected $fillable = [
        'code',
        'name',
        'sort_order',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<GameConfig, $this> */
    public function gameConfigs(): HasMany
    {
        return $this->hasMany(GameConfig::class);
    }

    /** @return HasMany<GameSession, $this> */
    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }
}
