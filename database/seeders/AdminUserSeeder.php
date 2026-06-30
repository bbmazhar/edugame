<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the default admin account used to log in to the Filament panel.
     *
     * Credentials come from config/admin.php (fed by ADMIN_* env) so they are
     * never committed and stay safe when config is cached.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => config('admin.email')],
            [
                'name' => config('admin.name'),
                'password' => config('admin.password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );
    }
}
