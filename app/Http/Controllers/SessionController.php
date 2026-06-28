<?php

namespace App\Http\Controllers;

use App\Actions\RecordGameSession;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /**
     * Persist a finished game session (guests allowed) and, for authenticated
     * players, update their stats. Returns JSON for the in-game result screen.
     */
    public function store(Request $request, RecordGameSession $recorder): JsonResponse
    {
        $data = $request->validate([
            'game_id' => ['required', 'integer', 'exists:games,id'],
            'level_id' => ['required', 'integer', 'exists:levels,id'],
            'score' => ['required', 'integer', 'min:0'],
            'accuracy' => ['required', 'numeric', 'min:0', 'max:100'],
            'duration_ms' => ['required', 'integer', 'min:0'],
            'rounds' => ['required', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $session = GameSession::create([
            ...$data,
            'user_id' => $request->user()?->id,
            'played_at' => now(),
        ]);

        $stats = $request->user()
            ? $recorder->update($request->user(), $session)
            : null;

        return response()->json([
            'ok' => true,
            'session_id' => $session->id,
            'stats' => $stats?->only(['best_score', 'streak_count', 'total_sessions']),
        ]);
    }
}
