<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameConfig;
use App\Models\Level;
use Database\Seeders\GameConfigSeeder;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionHardeningTest extends TestCase
{
    use RefreshDatabase;

    private int $gameId;

    private int $levelId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([LevelSeeder::class, GameSeeder::class, GameConfigSeeder::class]);
        $this->gameId = Game::where('slug', 'hitung-cepat')->value('id');
        $this->levelId = Level::where('code', 'SD')->value('id');
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'game_id' => $this->gameId,
            'level_id' => $this->levelId,
            'score' => 50,
            'accuracy' => 80,
            'duration_ms' => 2000,
            'rounds' => 5,
        ], $overrides);
    }

    public function test_a_plausible_session_is_accepted(): void
    {
        $this->postJson('/sessions', $this->payload())->assertOk();
    }

    public function test_sessions_are_rate_limited(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/sessions', $this->payload())->assertOk();
        }

        $this->postJson('/sessions', $this->payload())->assertStatus(429);
    }

    public function test_rejects_duration_too_short_for_rounds(): void
    {
        $this->postJson('/sessions', $this->payload(['rounds' => 10, 'duration_ms' => 10]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('duration_ms');
    }

    public function test_rejects_implausible_score_for_rounds(): void
    {
        $this->postJson('/sessions', $this->payload(['rounds' => 5, 'score' => 100000]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('score');
    }

    public function test_rejects_rounds_over_the_maximum(): void
    {
        $this->postJson('/sessions', $this->payload(['rounds' => 600, 'duration_ms' => 3_000_000]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('rounds');
    }

    public function test_rejects_a_disabled_game_level_combination(): void
    {
        GameConfig::where('game_id', $this->gameId)
            ->where('level_id', $this->levelId)
            ->update(['is_enabled' => false]);

        $this->postJson('/sessions', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('game_id');
    }
}
