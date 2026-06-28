<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Level;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    /**
     * Public game catalog, filtered by enabled levels/games and the selected level.
     */
    public function index(Request $request): Response
    {
        $levels = Level::query()
            ->where('is_enabled', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'name']);

        $selected = $levels->firstWhere('code', $request->query('level')) ?? $levels->first();

        $games = collect();

        if ($selected) {
            $games = Game::query()
                ->where('is_enabled', true)
                ->whereHas('configs', fn ($query) => $query
                    ->where('level_id', $selected->id)
                    ->where('is_enabled', true))
                ->orderBy('sort_order')
                ->get(['id', 'slug', 'name', 'description', 'cognitive_domain', 'icon']);
        }

        return Inertia::render('katalog', [
            'levels' => $levels,
            'selectedLevel' => $selected?->code,
            'games' => $games,
        ]);
    }
}
