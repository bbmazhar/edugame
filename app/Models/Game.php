<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'cognitive_domain',
        'icon',
        'is_enabled',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<GameConfig, $this> */
    public function configs(): HasMany
    {
        return $this->hasMany(GameConfig::class);
    }

    /** @return HasMany<GameSession, $this> */
    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    /** @return HasMany<UserStat, $this> */
    public function userStats(): HasMany
    {
        return $this->hasMany(UserStat::class);
    }
}
