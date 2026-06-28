<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the default admin account used to log in to the Filament panel.
     *
     * Credentials are read from the environment so they are never committed.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@edugame.test');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('ADMIN_NAME', 'EduGame Admin'),
                'password' => env('ADMIN_PASSWORD', 'password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );
    }
}
