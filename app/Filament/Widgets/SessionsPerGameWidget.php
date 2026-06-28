<?php

namespace App\Filament\Widgets;

use App\Models\Game;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class SessionsPerGameWidget extends BaseWidget
{
    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    protected static ?string $heading = 'Sesi per Game';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Game::query()
                    ->withCount('gameSessions')
                    ->orderByDesc('game_sessions_count')
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')->label('Game'),
                Tables\Columns\TextColumn::make('cognitive_domain')->label('Domain')->badge(),
                Tables\Columns\IconColumn::make('is_enabled')->label('Aktif')->boolean(),
                Tables\Columns\TextColumn::make('game_sessions_count')->label('Jumlah Sesi')->sortable(),
            ])
            ->paginated(false);
    }
}
