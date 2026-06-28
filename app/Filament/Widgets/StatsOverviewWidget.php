<?php

namespace App\Filament\Widgets;

use App\Models\Game;
use App\Models\GameSession;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        return [
            Stat::make('Total Sesi', GameSession::count())
                ->description('Seluruh sesi bermain')
                ->color('primary'),
            Stat::make('Sesi Hari Ini', GameSession::whereDate('created_at', today())->count())
                ->color('success'),
            Stat::make('Pemain Aktif', GameSession::whereNotNull('user_id')->distinct('user_id')->count('user_id'))
                ->description('Akun yang pernah bermain')
                ->color('info'),
            Stat::make('Game Aktif', Game::where('is_enabled', true)->count())
                ->description('Dari '.Game::count().' total game'),
        ];
    }
}
