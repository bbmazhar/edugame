<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameConfig;
use App\Models\Level;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: Game, 1: Level} */
    private function seedGame(): array
    {
        $level = Level::create(['code' => 'SD', 'name' => 'SD', 'sort_order' => 0, 'is_enabled' => true]);
        $game = Game::create(['slug' => 'dummy', 'name' => 'Dummy', 'is_enabled' => true, 'sort_order' => 0]);
        GameConfig::create(['game_id' => $game->id, 'level_id' => $level->id, 'params' => ['rounds' => 5], 'is_enabled' => true]);

        return [$game, $level];
    }

    private function payload(Game $game, Level $level, int $score = 50): array
    {
        return [
            'game_id' => $game->id,
            'level_id' => $level->id,
            'score' => $score,
            'accuracy' => 80,
            'duration_ms' => 1234,
            'rounds' => 5,
        ];
    }

    public function test_guest_session_is_stored_without_user_or_stats(): void
    {
        [$game, $level] = $this->seedGame();

        $this->postJson('/sessions', $this->payload($game, $level))
            ->assertOk()
            ->assertJson(['ok' => true, 'stats' => null]);

        $this->assertDatabaseHas('game_sessions', [
            'game_id' => $game->id,
            'user_id' => null,
            'score' => 50,
        ]);
        $this->assertDatabaseCount('user_stats', 0);
    }

    public function test_authenticated_session_updates_per_game_and_aggregate_stats(): void
    {
        [$game, $level] = $this->seedGame();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/sessions', $this->payload($game, $level, 50))
            ->assertOk()
            ->assertJsonPath('stats.best_score', 50)
            ->assertJsonPath('stats.streak_count', 1);

        $this->assertDatabaseHas('game_sessions', ['user_id' => $user->id, 'game_id' => $game->id]);
        $this->assertDatabaseHas('user_stats', [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'best_score' => 50,
            'total_sessions' => 1,
            'streak_count' => 1,
        ]);
        // Aggregate row (game_id null).
        $this->assertDatabaseHas('user_stats', [
            'user_id' => $user->id,
            'game_id' => null,
            'total_sessions' => 1,
        ]);
    }

    public function test_best_score_is_kept_and_total_increments_across_sessions(): void
    {
        [$game, $level] = $this->seedGame();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/sessions', $this->payload($game, $level, 50))->assertOk();

        $this->actingAs($user)
            ->postJson('/sessions', $this->payload($game, $level, 30))
            ->assertJsonPath('stats.best_score', 50)
            ->assertJsonPath('stats.total_sessions', 2);
    }

    public function test_session_payload_is_validated(): void
    {
        $this->postJson('/sessions', [])->assertStatus(422);
    }
}
