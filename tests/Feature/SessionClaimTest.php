<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameSession;
use App\Models\Level;
use App\Models\User;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionClaimTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([LevelSeeder::class, GameSeeder::class]);
    }

    private function guestSession(Game $game, Level $level, int $score, ?int $userId = null): GameSession
    {
        return GameSession::create([
            'user_id' => $userId,
            'game_id' => $game->id,
            'level_id' => $level->id,
            'score' => $score,
            'accuracy' => 75,
            'duration_ms' => 1200,
            'rounds' => 6,
            'played_at' => now(),
        ]);
    }

    public function test_claim_associates_guest_sessions_and_rebuilds_stats(): void
    {
        $user = User::factory()->create();
        $sd = Level::where('code', 'SD')->first();
        $game = Game::where('slug', 'hitung-cepat')->first();

        $s1 = $this->guestSession($game, $sd, 40);
        $s2 = $this->guestSession($game, $sd, 60);

        $this->actingAs($user)
            ->post('/sessions/claim', ['ids' => [$s1->id, $s2->id]])
            ->assertRedirect();

        $this->assertDatabaseHas('game_sessions', ['id' => $s1->id, 'user_id' => $user->id]);
        $this->assertDatabaseHas('game_sessions', ['id' => $s2->id, 'user_id' => $user->id]);
        $this->assertDatabaseHas('user_stats', [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'best_score' => 60,
            'total_sessions' => 2,
        ]);
        $this->assertDatabaseHas('user_stats', [
            'user_id' => $user->id,
            'game_id' => null,
            'total_sessions' => 2,
        ]);
    }

    public function test_claim_cannot_steal_another_users_sessions(): void
    {
        $other = User::factory()->create();
        $sd = Level::where('code', 'SD')->first();
        $game = Game::where('slug', 'hitung-cepat')->first();
        $owned = $this->guestSession($game, $sd, 99, $other->id);

        $user = User::factory()->create();
        $this->actingAs($user)
            ->post('/sessions/claim', ['ids' => [$owned->id]])
            ->assertRedirect();

        $this->assertDatabaseHas('game_sessions', ['id' => $owned->id, 'user_id' => $other->id]);
    }

    public function test_guest_cannot_claim(): void
    {
        $this->post('/sessions/claim', ['ids' => [1]])->assertRedirect('/login');
    }

    public function test_guest_can_still_record_a_session_without_an_account(): void
    {
        $sd = Level::where('code', 'SD')->first();
        $game = Game::where('slug', 'hitung-cepat')->first();

        $this->postJson('/sessions', [
            'game_id' => $game->id,
            'level_id' => $sd->id,
            'score' => 10,
            'accuracy' => 100,
            'duration_ms' => 500,
            'rounds' => 3,
        ])->assertOk();

        $this->assertDatabaseHas('game_sessions', ['game_id' => $game->id, 'user_id' => null]);
    }
}
