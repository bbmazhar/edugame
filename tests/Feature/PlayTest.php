<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameConfig;
use App\Models\Level;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlayTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function seedGame(bool $configEnabled = true): array
    {
        $level = Level::create(['code' => 'SD', 'name' => 'SD', 'sort_order' => 0, 'is_enabled' => true]);
        $game = Game::create(['slug' => 'dummy', 'name' => 'Dummy', 'is_enabled' => true, 'sort_order' => 0]);
        GameConfig::create(['game_id' => $game->id, 'level_id' => $level->id, 'params' => ['rounds' => 5], 'is_enabled' => $configEnabled]);

        return [$game, $level];
    }

    public function test_play_screen_renders_with_params(): void
    {
        $this->seedGame();

        $this->get('/main/dummy?level=SD')->assertInertia(fn (Assert $page) => $page
            ->component('play')
            ->where('game.slug', 'dummy')
            ->where('level.code', 'SD')
            ->where('params.rounds', 5));
    }

    public function test_missing_level_returns_404(): void
    {
        $this->seedGame();

        $this->get('/main/dummy')->assertNotFound();
    }

    public function test_disabled_config_returns_404(): void
    {
        $this->seedGame(configEnabled: false);

        $this->get('/main/dummy?level=SD')->assertNotFound();
    }

    public function test_disabled_game_returns_404(): void
    {
        [$game] = $this->seedGame();
        $game->update(['is_enabled' => false]);

        $this->get('/main/dummy?level=SD')->assertNotFound();
    }
}
