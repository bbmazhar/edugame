<?php

namespace Database\Seeders;

use App\Models\Level;
use Illuminate\Database\Seeder;

class LevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['code' => 'SD', 'name' => 'Sekolah Dasar', 'sort_order' => 0],
            ['code' => 'SMP', 'name' => 'Sekolah Menengah Pertama', 'sort_order' => 1],
            ['code' => 'SMA', 'name' => 'Sekolah Menengah Atas', 'sort_order' => 2],
            ['code' => 'UMUM', 'name' => 'Umum', 'sort_order' => 3],
        ];

        foreach ($levels as $level) {
            Level::updateOrCreate(
                ['code' => $level['code']],
                $level + ['is_enabled' => true],
            );
        }
    }
}
