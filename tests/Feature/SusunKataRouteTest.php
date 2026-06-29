<?php

namespace Tests\Feature;

use Database\Seeders\GameConfigSeeder;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SusunKataRouteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed([LevelSeeder::class, GameSeeder::class, GameConfigSeeder::class]);
    }

    public function test_sd_gets_anagram_mode_in_indonesian(): void
    {
        $this->get('/main/susun-kata?level=SD')->assertInertia(fn (Assert $page) => $page
            ->component('play')
            ->where('game.slug', 'susun-kata')
            ->where('level.code', 'SD')
            ->where('params.mode', 'anagram')
            ->where('params.min_len', 3)
            ->where('params.max_len', 4)
            ->where('params.dictionary', 'id'));
    }

    public function test_sma_gets_search_mode_with_bigger_grid(): void
    {
        $this->get('/main/susun-kata?level=SMA')->assertInertia(fn (Assert $page) => $page
            ->where('level.code', 'SMA')
            ->where('params.mode', 'search')
            ->where('params.min_len', 5)
            ->where('params.max_len', 8)
            ->where('params.grid_size', 8));
    }

    public function test_playable_at_every_enabled_level(): void
    {
        foreach (['SD', 'SMP', 'SMA', 'UMUM'] as $code) {
            $this->get("/main/susun-kata?level={$code}")
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('play'));
        }
    }
}
