<?php

use App\Http\Controllers\Api\AppVersionController;
use Illuminate\Support\Facades\Route;

// Public: Android shell self-update check (Option A — optional, shell changes only).
Route::get('app/version', AppVersionController::class)->name('api.app.version');
