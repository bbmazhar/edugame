<?php

namespace Tests\Feature;

use Database\Seeders\GameConfigSeeder;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class IngatUrutanRouteTest extends TestCase
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
        $this->get('/main/ingat-urutan?level=SD')->assertInertia(fn (Assert $page) => $page
            ->component('play')
            ->where('game.slug', 'ingat-urutan')
            ->where('level.code', 'SD')
            ->where('params.start_length', 3)
            ->where('params.max_length', 7)
            ->where('params.show_ms', 800)
            ->where('params.modality', 'color'));
    }

    public function test_sma_gets_the_harder_seeded_params(): void
    {
        $this->get('/main/ingat-urutan?level=SMA')->assertInertia(fn (Assert $page) => $page
            ->where('level.code', 'SMA')
            ->where('params.start_length', 4)
            ->where('params.max_length', 9)
            ->where('params.show_ms', 500));
    }

    public function test_playable_at_every_enabled_level(): void
    {
        foreach (['SD', 'SMP', 'SMA', 'UMUM'] as $code) {
            $this->get("/main/ingat-urutan?level={$code}")
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('play'));
        }
    }
}
