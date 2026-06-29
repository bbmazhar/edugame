<?php

namespace Tests\Feature;

use Database\Seeders\GameConfigSeeder;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MemoryMatchRouteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed([LevelSeeder::class, GameSeeder::class, GameConfigSeeder::class]);
    }

    public function test_sd_gets_a_three_by_four_board(): void
    {
        $this->get('/main/memory-match?level=SD')->assertInertia(fn (Assert $page) => $page
            ->component('play')
            ->where('game.slug', 'memory-match')
            ->where('level.code', 'SD')
            ->where('params.rows', 3)
            ->where('params.cols', 4)
            ->where('params.flip_back_ms', 1200));
    }

    public function test_sma_gets_a_four_by_six_board(): void
    {
        $this->get('/main/memory-match?level=SMA')->assertInertia(fn (Assert $page) => $page
            ->where('params.rows', 4)
            ->where('params.cols', 6)
            ->where('params.flip_back_ms', 900));
    }

    public function test_every_level_has_an_even_card_count_and_loads(): void
    {
        $grids = ['SD' => 12, 'SMP' => 16, 'SMA' => 24, 'UMUM' => 30];

        foreach ($grids as $code => $cards) {
            $this->assertSame(0, $cards % 2, "Grid for {$code} must be even");

            $this->get("/main/memory-match?level={$code}")
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('play'));
        }
    }
}
