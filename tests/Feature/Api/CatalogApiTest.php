<?php

namespace Tests\Feature\Api;

use App\Models\Game;
use App\Models\GameConfig;
use App\Models\Level;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_returns_only_enabled_levels_games_and_configs(): void
    {
        $sd = Level::create(['code' => 'SD', 'name' => 'SD', 'sort_order' => 0, 'is_enabled' => true]);
        Level::create(['code' => 'SMP', 'name' => 'SMP', 'sort_order' => 1, 'is_enabled' => false]);

        $visible = Game::create(['slug' => 'visible', 'name' => 'Visible', 'is_enabled' => true, 'sort_order' => 0]);
        Game::create(['slug' => 'hidden', 'name' => 'Hidden', 'is_enabled' => false, 'sort_order' => 1]);

        GameConfig::create(['game_id' => $visible->id, 'level_id' => $sd->id, 'params' => ['rounds' => 8], 'is_enabled' => true]);

        $response = $this->getJson('/api/catalog')->assertOk();

        $response->assertJsonCount(1, 'levels')
            ->assertJsonPath('levels.0.code', 'SD')
            ->assertJsonCount(1, 'games')
            ->assertJsonPath('games.0.slug', 'visible')
            ->assertJsonCount(1, 'configs')
            ->assertJsonPath('configs.0.game', 'visible')
            ->assertJsonPath('configs.0.level', 'SD')
            ->assertJsonPath('configs.0.params.rounds', 8);
    }

    public function test_catalog_is_public(): void
    {
        $this->getJson('/api/catalog')->assertOk();
    }
}
