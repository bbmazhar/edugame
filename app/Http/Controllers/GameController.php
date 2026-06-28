<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\GameConfig;
use App\Models\Level;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    /**
     * Render the play screen for a game at the chosen level, injecting the
     * difficulty params from the matching (enabled) game_config.
     */
    public function show(Request $request, Game $game): Response
    {
        abort_unless($game->is_enabled, 404);

        $level = Level::query()
            ->where('code', $request->query('level'))
            ->where('is_enabled', true)
            ->first();

        abort_unless($level !== null, 404);

        $config = GameConfig::query()
            ->where('game_id', $game->id)
            ->where('level_id', $level->id)
            ->where('is_enabled', true)
            ->first();

        abort_unless($config !== null, 404);

        return Inertia::render('play', [
            'game' => $game->only(['id', 'slug', 'name', 'cognitive_domain', 'icon']),
            'level' => $level->only(['id', 'code', 'name']),
            'params' => $config->params,
        ]);
    }
}
