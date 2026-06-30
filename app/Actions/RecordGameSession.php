<?php

namespace App\Actions;

use App\Models\GameSession;
use App\Models\User;
use App\Models\UserStat;
use Illuminate\Support\Carbon;

class RecordGameSession
{
    /**
     * Update a user's per-game and aggregate stats from a finished session.
     * Returns the per-game stat row (the one shown on the result screen).
     */
    public function update(User $user, GameSession $session): UserStat
    {
        $perGame = $this->upsert($user->id, $session->game_id, $session);
        $this->upsert($user->id, null, $session); // aggregate across all games

        return $perGame;
    }

    private function upsert(int $userId, ?int $gameId, GameSession $session): UserStat
    {
        $stat = UserStat::firstOrNew([
            'user_id' => $userId,
            'game_id' => $gameId,
        ]);

        $today = Carbon::today();
        $last = $stat->last_played_date;

        if ($last === null) {
            $stat->streak_count = 1;
        } elseif ($last->isSameDay($today)) {
            $stat->streak_count = max(1, $stat->streak_count);
        } elseif ($last->copy()->addDay()->isSameDay($today)) {
            $stat->streak_count = $stat->streak_count + 1;
        } else {
            $stat->streak_count = 1;
        }

        $stat->best_score = max($stat->best_score ?? 0, $session->score);
        $stat->total_sessions = ($stat->total_sessions ?? 0) + 1;
        $stat->last_played_date = $today;
        $stat->save();

        return $stat;
    }
}
