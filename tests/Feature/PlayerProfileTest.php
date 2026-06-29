<?php

namespace Tests\Feature;

use App\Actions\RebuildUserStats;
use App\Models\Game;
use App\Models\GameSession;
use App\Models\Level;
use App\Models\User;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlayerProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed([LevelSeeder::class, GameSeeder::class]);
    }

    private function recordSession(User $user, Game $game, Level $level, int $score): void
    {
        GameSession::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'level_id' => $level->id,
            'score' => $score,
            'accuracy' => 80,
            'duration_ms' => 1000,
            'rounds' => 5,
            'played_at' => now(),
        ]);
    }

    public function test_profile_shows_accurate_cross_game_stats(): void
    {
        $user = User::factory()->create();
        $sd = Level::where('code', 'SD')->first();
        $hitung = Game::where('slug', 'hitung-cepat')->first();
        $memory = Game::where('slug', 'memory-match')->first();

        $this->recordSession($user, $hitung, $sd, 30);
        $this->recordSession($user, $hitung, $sd, 50);
        $this->recordSession($user, $memory, $sd, 20);
        app(RebuildUserStats::class)->forUser($user);

        $this->actingAs($user)->get('/profil')->assertInertia(fn (Assert $page) => $page
            ->component('profil')
            ->where('summary.totalSessions', 3)
            ->where('summary.bestScore', 50)
            ->where('summary.gamesPlayed', 2)
            ->where('summary.streak', 1)
            ->has('perGame', 2)
            ->has('recent', 3));
    }

    public function test_guest_is_redirected_from_profile(): void
    {
        $this->get('/profil')->assertRedirect('/login');
    }
}
