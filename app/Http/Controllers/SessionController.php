<?php

namespace App\Http\Controllers;

use App\Actions\RebuildUserStats;
use App\Actions\RecordGameSession;
use App\Http\Requests\StoreSessionRequest;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /**
     * Persist a finished game session (guests allowed) and, for authenticated
     * players, update their stats. Returns JSON for the in-game result screen.
     */
    public function store(StoreSessionRequest $request, RecordGameSession $recorder): JsonResponse
    {
        $data = $request->validated();

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

    /**
     * Associate locally-tracked guest sessions with the now-authenticated user
     * and rebuild their stats. Only unclaimed (user_id null) sessions move.
     */
    public function claim(Request $request, RebuildUserStats $rebuild): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['array'],
            'ids.*' => ['integer'],
        ]);

        $ids = $data['ids'] ?? [];

        if (! empty($ids)) {
            $moved = GameSession::query()
                ->whereNull('user_id')
                ->whereIn('id', $ids)
                ->update(['user_id' => $request->user()->id]);

            if ($moved > 0) {
                $rebuild->forUser($request->user());
            }
        }

        return back();
    }
}
