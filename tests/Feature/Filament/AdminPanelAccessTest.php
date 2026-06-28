<?php

namespace Tests\Feature\Filament;

use App\Filament\Resources\AnnouncementResource;
use App\Filament\Resources\GameConfigResource;
use App\Filament\Resources\GameResource;
use App\Filament\Resources\LevelResource;
use App\Filament\Resources\UserResource;
use App\Models\Level;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPanelAccessTest extends TestCase
{
    use RefreshDatabase;

    private function indexUrls(): array
    {
        return [
            LevelResource::getUrl('index'),
            GameResource::getUrl('index'),
            GameConfigResource::getUrl('index'),
            UserResource::getUrl('index'),
            AnnouncementResource::getUrl('index'),
        ];
    }

    public function test_admin_can_open_every_resource_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach ($this->indexUrls() as $url) {
            $this->actingAs($admin)->get($url)->assertOk();
        }
    }

    public function test_player_is_forbidden_from_the_admin_panel(): void
    {
        $player = User::factory()->create(['role' => 'player']);

        $this->actingAs($player)->get(LevelResource::getUrl('index'))->assertForbidden();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(LevelResource::getUrl('index'))->assertRedirect();
    }

    public function test_catalog_query_respects_enabled_flag(): void
    {
        Level::create(['code' => 'SD', 'name' => 'Sekolah Dasar', 'sort_order' => 0, 'is_enabled' => true]);
        Level::create(['code' => 'SMP', 'name' => 'SMP', 'sort_order' => 1, 'is_enabled' => false]);

        $enabled = Level::where('is_enabled', true)->pluck('code')->all();

        $this->assertContains('SD', $enabled);
        $this->assertNotContains('SMP', $enabled);
    }
}
