<?php

namespace Tests\Feature;

use Database\Seeders\GameConfigSeeder;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FokusWarnaRouteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed([LevelSeeder::class, GameSeeder::class, GameConfigSeeder::class]);
    }

    public function test_sd_gets_the_easy_seeded_params(): void
    {
        $this->get('/main/fokus-warna?level=SD')->assertInertia(fn (Assert $page) => $page
            ->component('play')
            ->where('game.slug', 'fokus-warna')
            ->where('level.code', 'SD')
            ->where('params.display_ms', 3000)
            ->where('params.congruent_ratio', 0.6)
            ->where('params.distractor_count', 2)
            ->where('params.rounds', 10));
    }

    public function test_sma_gets_the_harder_seeded_params(): void
    {
        $this->get('/main/fokus-warna?level=SMA')->assertInertia(fn (Assert $page) => $page
            ->where('level.code', 'SMA')
            ->where('params.display_ms', 1500)
            ->where('params.congruent_ratio', 0.3)
            ->where('params.distractor_count', 4)
            ->where('params.rounds', 15));
    }

    public function test_playable_at_every_enabled_level(): void
    {
        foreach (['SD', 'SMP', 'SMA', 'UMUM'] as $code) {
            $this->get("/main/fokus-warna?level={$code}")
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('play'));
        }
    }
}
