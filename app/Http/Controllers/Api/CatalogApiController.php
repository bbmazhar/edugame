<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameConfig;
use App\Models\Level;
use Illuminate\Http\JsonResponse;

class CatalogApiController extends Controller
{
    /**
     * Public catalog for the mobile shell: enabled levels, games and the
     * difficulty params per (game, level). Lets the app sync tuning and
     * render the catalog. PII-free.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'levels' => Level::query()
                ->where('is_enabled', true)
                ->orderBy('sort_order')
                ->get(['id', 'code', 'name']),

            'games' => Game::query()
                ->where('is_enabled', true)
                ->orderBy('sort_order')
                ->get(['id', 'slug', 'name', 'description', 'cognitive_domain', 'icon']),

            'configs' => GameConfig::query()
                ->where('is_enabled', true)
                ->with(['game:id,slug', 'level:id,code'])
                ->get()
                ->map(fn (GameConfig $config) => [
                    'game' => $config->game?->slug,
                    'level' => $config->level?->code,
                    'params' => $config->params,
                ])
                ->values(),
        ]);
    }
}
