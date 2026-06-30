<?php

return [
    /*
    | Default admin account used by AdminUserSeeder. Reading via config (not
    | env() directly in the seeder) keeps it safe when config is cached.
    */
    'name' => env('ADMIN_NAME', 'EduGame Admin'),
    'email' => env('ADMIN_EMAIL', 'admin@edugame.test'),
    'password' => env('ADMIN_PASSWORD', 'password'),
];
