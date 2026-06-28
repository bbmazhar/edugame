<?php

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'landing')->name('home');

Route::get('katalog', [CatalogController::class, 'index'])->name('catalog');
Route::get('main/{game:slug}', [GameController::class, 'show'])->name('play');
Route::post('sessions', [SessionController::class, 'store'])->name('sessions.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
