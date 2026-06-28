<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessibilitySettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_persist_accessibility_settings(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch('/settings/accessibility', [
            'reduced_motion' => true,
            'theme' => 'default',
        ]);

        $response->assertRedirect();

        $settings = $user->fresh()->profile->settings;

        $this->assertTrue($settings['reduced_motion']);
        $this->assertSame('default', $settings['theme']);
        // Untouched keys fall back to defaults.
        $this->assertTrue($settings['sound']);
        $this->assertFalse($settings['high_contrast']);
    }

    public function test_invalid_theme_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch('/settings/accessibility', ['theme' => 'neon'])
            ->assertSessionHasErrors('theme');
    }

    public function test_guest_cannot_persist_settings(): void
    {
        $this->patch('/settings/accessibility', ['reduced_motion' => true])
            ->assertRedirect('/login');
    }
}
