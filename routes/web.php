<?php

use App\Http\Controllers\CatalogController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'landing')->name('home');

Route::get('katalog', [CatalogController::class, 'index'])->name('catalog');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
