<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Models\UserStat;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayerProfileController extends Controller
{
    /**
     * Player profile: cross-game stats and recent session history.
     * Intentionally PII-free — only gameplay data is shown.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        $aggregate = UserStat::query()
            ->where('user_id', $user->id)
            ->whereNull('game_id')
            ->first();

        $perGame = UserStat::query()
            ->where('user_id', $user->id)
            ->whereNotNull('game_id')
            ->with('game:id,slug,name,icon')
            ->get()
            ->map(fn (UserStat $stat) => [
                'slug' => $stat->game?->slug,
                'name' => $stat->game?->name,
                'icon' => $stat->game?->icon,
                'best_score' => $stat->best_score,
                'total_sessions' => $stat->total_sessions,
                'streak_count' => $stat->streak_count,
                'last_played_date' => $stat->last_played_date?->toDateString(),
            ])
            ->values();

        $recent = GameSession::query()
            ->where('user_id', $user->id)
            ->with(['game:id,name', 'level:id,code'])
            ->latest('played_at')
            ->latest('id')
            ->limit(15)
            ->get()
            ->map(fn (GameSession $session) => [
                'id' => $session->id,
                'game' => $session->game?->name,
                'level' => $session->level?->code,
                'score' => $session->score,
                'accuracy' => (float) $session->accuracy,
                'duration_ms' => $session->duration_ms,
                'played_at' => $session->played_at?->toIso8601String(),
            ]);

        return Inertia::render('profil', [
            'displayName' => $user->profile?->display_name ?? $user->name,
            'summary' => [
                'totalSessions' => $aggregate?->total_sessions ?? 0,
                'streak' => $aggregate?->streak_count ?? 0,
                'bestScore' => $aggregate?->best_score ?? 0,
                'gamesPlayed' => $perGame->count(),
            ],
            'perGame' => $perGame,
            'recent' => $recent,
        ]);
    }
}
