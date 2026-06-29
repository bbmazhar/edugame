<?php

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\PlayerProfileController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'landing')->name('home');

Route::get('katalog', [CatalogController::class, 'index'])->name('catalog');
Route::get('main/{game:slug}', [GameController::class, 'show'])->name('play');
Route::post('sessions', [SessionController::class, 'store'])
    ->middleware('throttle:30,1')
    ->name('sessions.store');

Route::middleware(['auth'])->group(function () {
    Route::get('profil', [PlayerProfileController::class, 'show'])->name('profile.show');
    Route::post('sessions/claim', [SessionController::class, 'claim'])
        ->middleware('throttle:20,1')
        ->name('sessions.claim');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
