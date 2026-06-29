<?php

namespace Tests\Feature;

use Database\Seeders\GameConfigSeeder;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LanjutkanPolaRouteTest extends TestCase
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
        $this->get('/main/lanjutkan-pola?level=SD')->assertInertia(fn (Assert $page) => $page
            ->component('play')
            ->where('game.slug', 'lanjutkan-pola')
            ->where('level.code', 'SD')
            ->where('params.pattern_types', ['arithmetic', 'shape'])
            ->where('params.sequence_length', 4)
            ->where('params.options_count', 3));
    }

    public function test_sma_gets_the_harder_seeded_params(): void
    {
        $this->get('/main/lanjutkan-pola?level=SMA')->assertInertia(fn (Assert $page) => $page
            ->where('level.code', 'SMA')
            ->where('params.pattern_types', ['arithmetic', 'geometric', 'shape', 'color'])
            ->where('params.sequence_length', 6)
            ->where('params.options_count', 4));
    }

    public function test_playable_at_every_enabled_level(): void
    {
        foreach (['SD', 'SMP', 'SMA', 'UMUM'] as $code) {
            $this->get("/main/lanjutkan-pola?level={$code}")
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('play'));
        }
    }
}
