<?php

namespace Tests\Feature;

use Database\Seeders\GameConfigSeeder;
use Database\Seeders\GameSeeder;
use Database\Seeders\LevelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HitungCepatRouteTest extends TestCase
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
        $this->get('/main/hitung-cepat?level=SD')->assertInertia(fn (Assert $page) => $page
            ->component('play')
            ->where('game.slug', 'hitung-cepat')
            ->where('level.code', 'SD')
            ->where('params.operations', ['+', '-'])
            ->where('params.max_operand', 20)
            ->where('params.allow_negative', false));
    }

    public function test_sma_gets_the_harder_seeded_params(): void
    {
        $this->get('/main/hitung-cepat?level=SMA')->assertInertia(fn (Assert $page) => $page
            ->where('level.code', 'SMA')
            ->where('params.max_operand', 100)
            ->where('params.allow_negative', true));
    }

    public function test_playable_at_every_enabled_level(): void
    {
        foreach (['SD', 'SMP', 'SMA', 'UMUM'] as $code) {
            $this->get("/main/hitung-cepat?level={$code}")
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('play'));
        }
    }
}
