<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class AppVersionTest extends TestCase
{
    public function test_version_endpoint_returns_the_self_update_shape(): void
    {
        config([
            'mobile.version_code' => 3,
            'mobile.version_name' => '1.2.0',
            'mobile.apk_url' => 'https://cdn.example/edugame-3.apk',
            'mobile.changelog' => 'Perbaikan kecil',
            'mobile.force_update' => true,
        ]);

        $this->getJson('/api/app/version')
            ->assertOk()
            ->assertExactJson([
                'latest_version_code' => 3,
                'latest_version_name' => '1.2.0',
                'apk_url' => 'https://cdn.example/edugame-3.apk',
                'changelog' => 'Perbaikan kecil',
                'force_update' => true,
            ]);
    }

    public function test_version_code_is_an_integer_for_safe_comparison(): void
    {
        $response = $this->getJson('/api/app/version')->assertOk();

        $this->assertIsInt($response->json('latest_version_code'));
        $this->assertIsBool($response->json('force_update'));
    }
}
