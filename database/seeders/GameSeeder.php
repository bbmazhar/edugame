<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        $games = [
            [
                'slug' => 'hitung-cepat',
                'name' => 'Hitung Cepat',
                'description' => 'Soal aritmetika muncul, jawab secepat mungkin sebelum waktu habis.',
                'cognitive_domain' => 'numerik',
                'icon' => 'calculator',
                'sort_order' => 0,
            ],
            [
                'slug' => 'fokus-warna',
                'name' => 'Fokus Warna',
                'description' => 'Pilih warna tinta dari kata, bukan teksnya. Melatih atensi dan inhibisi.',
                'cognitive_domain' => 'atensi-inhibisi',
                'icon' => 'palette',
                'sort_order' => 1,
            ],
            [
                'slug' => 'memory-match',
                'name' => 'Memory Match',
                'description' => 'Balik kartu dan cocokkan pasangannya. Melatih memori visual.',
                'cognitive_domain' => 'memori-visual',
                'icon' => 'grid',
                'sort_order' => 2,
            ],
            [
                'slug' => 'ingat-urutan',
                'name' => 'Ingat Urutan',
                'description' => 'Tirukan urutan yang ditampilkan; urutan memanjang tiap ronde.',
                'cognitive_domain' => 'working-memory',
                'icon' => 'list-ordered',
                'sort_order' => 3,
            ],
            [
                'slug' => 'lanjutkan-pola',
                'name' => 'Lanjutkan Pola',
                'description' => 'Diberi sebuah deret, pilih lanjutan yang benar. Melatih logika.',
                'cognitive_domain' => 'logika',
                'icon' => 'trending-up',
                'sort_order' => 4,
            ],
            [
                'slug' => 'susun-kata',
                'name' => 'Susun Kata',
                'description' => 'Susun huruf menjadi kata atau temukan kata di dalam grid.',
                'cognitive_domain' => 'verbal',
                'icon' => 'spell-check',
                'sort_order' => 5,
            ],
        ];

        foreach ($games as $game) {
            Game::updateOrCreate(
                ['slug' => $game['slug']],
                $game + ['is_enabled' => true],
            );
        }
    }
}
