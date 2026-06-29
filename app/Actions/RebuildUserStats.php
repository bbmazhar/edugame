<?php

namespace App\Actions;

use App\Models\GameSession;
use App\Models\User;
use App\Models\UserStat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class RebuildUserStats
{
    /**
     * Recompute a user's per-game and aggregate stats from scratch using every
     * game session they own. Authoritative rebuild used after claiming guest
     * sessions.
     */
    public function forUser(User $user): void
    {
        UserStat::where('user_id', $user->id)->delete();

        $sessions = GameSession::where('user_id', $user->id)
            ->get(['game_id', 'score', 'played_at', 'created_at']);

        if ($sessions->isEmpty()) {
            return;
        }

        foreach ($sessions->groupBy('game_id') as $gameId => $group) {
            $this->store($user->id, (int) $gameId, $group);
        }

        // Aggregate row across all games.
        $this->store($user->id, null, $sessions);
    }

    private function store(int $userId, ?int $gameId, Collection $group): void
    {
        $dates = $group
            ->map(fn (GameSession $s) => ($s->played_at ?? $s->created_at)->toDateString())
            ->unique()
            ->sort()
            ->values();

        UserStat::create([
            'user_id' => $userId,
            'game_id' => $gameId,
            'best_score' => (int) $group->max('score'),
            'total_sessions' => $group->count(),
            'streak_count' => $this->trailingStreak($dates),
            'last_played_date' => $dates->last(),
        ]);
    }

    /**
     * Length of the run of consecutive days ending on the most recent play.
     *
     * @param  Collection<int, string>  $dates  ascending date strings (Y-m-d)
     */
    private function trailingStreak(Collection $dates): int
    {
        if ($dates->isEmpty()) {
            return 0;
        }

        $present = $dates->flip();
        $cursor = Carbon::parse($dates->last());
        $streak = 0;

        while ($present->has($cursor->toDateString())) {
            $streak++;
            $cursor->subDay();
        }

        return $streak;
    }
}
