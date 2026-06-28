<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    protected $fillable = [
        'user_id',
        'display_name',
        'avatar',
        'preferred_level_id',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    /**
     * Default accessibility / preference settings for a profile.
     *
     * @return array<string, mixed>
     */
    public static function defaultSettings(): array
    {
        return [
            'reduced_motion' => false,
            'sound' => true,
            'theme' => 'calm',
            'high_contrast' => false,
            'font' => 'default',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Level, $this> */
    public function preferredLevel(): BelongsTo
    {
        return $this->belongsTo(Level::class, 'preferred_level_id');
    }
}
