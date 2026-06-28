<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GameConfigResource\Pages;
use App\Models\GameConfig;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Validation\Rules\Unique;

class GameConfigResource extends Resource
{
    protected static ?string $model = GameConfig::class;

    protected static ?string $navigationIcon = 'heroicon-o-adjustments-horizontal';

    protected static ?string $navigationGroup = 'Katalog';

    protected static ?string $navigationLabel = 'Tuning (Game Config)';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('game_id')
                ->label('Game')
                ->relationship('game', 'name')
                ->required()
                ->live()
                ->unique(
                    ignoreRecord: true,
                    modifyRuleUsing: fn (Unique $rule, Forms\Get $get) => $rule->where('level_id', $get('level_id')),
                )
                ->validationMessages([
                    'unique' => 'Konfigurasi untuk kombinasi game & jenjang ini sudah ada.',
                ]),
            Forms\Components\Select::make('level_id')
                ->label('Jenjang')
                ->relationship('level', 'code')
                ->required()
                ->live(),
            Forms\Components\Textarea::make('params')
                ->label('Parameter (JSON)')
                ->required()
                ->rows(12)
                ->columnSpanFull()
                ->rules(['json'])
                ->formatStateUsing(fn ($state) => is_array($state)
                    ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                    : $state)
                ->dehydrateStateUsing(fn ($state) => is_string($state) ? json_decode($state, true) : $state)
                ->helperText('Knob kesulitan per (game, jenjang). Harus JSON valid. Contoh Hitung Cepat: {"operations":["+","-"],"max_operand":20,"time_per_question_ms":8000,"allow_negative":false,"total_questions":10}'),
            Forms\Components\Toggle::make('is_enabled')
                ->label('Aktif')
                ->helperText('Matikan untuk menonaktifkan game ini khusus pada jenjang terpilih.')
                ->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('game.name')->label('Game')->sortable()->searchable(),
                Tables\Columns\TextColumn::make('level.code')->label('Jenjang')->badge()->sortable(),
                Tables\Columns\ToggleColumn::make('is_enabled')->label('Aktif'),
                Tables\Columns\TextColumn::make('updated_at')->label('Diperbarui')->dateTime()->since()->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('game')->relationship('game', 'name'),
                Tables\Filters\SelectFilter::make('level')->relationship('level', 'code'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGameConfigs::route('/'),
            'create' => Pages\CreateGameConfig::route('/create'),
            'edit' => Pages\EditGameConfig::route('/{record}/edit'),
        ];
    }
}
