<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameConfig;
use App\Models\Level;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Render Inertia pages without resolving built Vite assets.
        $this->withoutVite();
    }

    private function seedCatalog(): Level
    {
        $sd = Level::create(['code' => 'SD', 'name' => 'SD', 'sort_order' => 0, 'is_enabled' => true]);
        Level::create(['code' => 'SMP', 'name' => 'SMP', 'sort_order' => 1, 'is_enabled' => false]);

        $visible = Game::create(['slug' => 'visible', 'name' => 'Visible', 'is_enabled' => true, 'sort_order' => 0]);
        $disabledGame = Game::create(['slug' => 'hidden', 'name' => 'Hidden', 'is_enabled' => false, 'sort_order' => 1]);
        $noEnabledConfig = Game::create(['slug' => 'noconfig', 'name' => 'NoConfig', 'is_enabled' => true, 'sort_order' => 2]);

        GameConfig::create(['game_id' => $visible->id, 'level_id' => $sd->id, 'params' => ['x' => 1], 'is_enabled' => true]);
        GameConfig::create(['game_id' => $disabledGame->id, 'level_id' => $sd->id, 'params' => ['x' => 1], 'is_enabled' => true]);
        GameConfig::create(['game_id' => $noEnabledConfig->id, 'level_id' => $sd->id, 'params' => ['x' => 1], 'is_enabled' => false]);

        return $sd;
    }

    public function test_catalog_only_lists_enabled_levels_and_games_with_enabled_config(): void
    {
        $this->seedCatalog();

        $this->get('/katalog')->assertInertia(fn (Assert $page) => $page
            ->component('katalog')
            ->where('selectedLevel', 'SD')
            ->has('levels', 1)
            ->where('levels.0.code', 'SD')
            ->has('games', 1)
            ->where('games.0.slug', 'visible'));
    }

    public function test_disabled_level_query_falls_back_to_first_enabled_level(): void
    {
        $this->seedCatalog();

        $this->get('/katalog?level=SMP')->assertInertia(fn (Assert $page) => $page
            ->where('selectedLevel', 'SD'));
    }

    public function test_catalog_is_public(): void
    {
        $this->seedCatalog();

        $this->get('/katalog')->assertOk();
    }
}
