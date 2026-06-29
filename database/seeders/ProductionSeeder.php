<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Safe production seed: catalog data only (levels, games, configs).
 * Idempotent (updateOrCreate). The admin account is created separately —
 * see DEPLOYMENT.md — to avoid shipping a default password.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            LevelSeeder::class,
            GameSeeder::class,
            GameConfigSeeder::class,
        ]);
    }
}
