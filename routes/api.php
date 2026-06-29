<?php

use App\Http\Controllers\Api\AppVersionController;
use App\Http\Controllers\Api\CatalogApiController;
use Illuminate\Support\Facades\Route;

// Public: Android shell self-update check (Option A — optional, shell changes only).
Route::get('app/version', AppVersionController::class)->name('api.app.version');

// Public: catalog + difficulty params for the mobile shell to sync/render.
Route::get('catalog', CatalogApiController::class)->name('api.catalog');
