<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LevelResource\Pages;
use App\Models\Level;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class LevelResource extends Resource
{
    protected static ?string $model = Level::class;

    protected static ?string $navigationIcon = 'heroicon-o-academic-cap';

    protected static ?string $navigationGroup = 'Katalog';

    protected static ?string $navigationLabel = 'Jenjang';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('code')
                ->label('Kode jenjang')
                ->options([
                    'SD' => 'SD',
                    'SMP' => 'SMP',
                    'SMA' => 'SMA',
                    'UMUM' => 'UMUM',
                ])
                ->required()
                ->unique(ignoreRecord: true),
            Forms\Components\TextInput::make('name')
                ->label('Nama')
                ->required()
                ->maxLength(255),
            Forms\Components\TextInput::make('sort_order')
                ->label('Urutan')
                ->numeric()
                ->default(0),
            Forms\Components\Toggle::make('is_enabled')
                ->label('Aktif')
                ->helperText('Matikan untuk membatasi target pasar (jenjang ini disembunyikan dari katalog publik).')
                ->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('sort_order')
            ->columns([
                Tables\Columns\TextColumn::make('code')->label('Kode')->badge()->sortable(),
                Tables\Columns\TextColumn::make('name')->label('Nama')->searchable(),
                Tables\Columns\TextColumn::make('game_configs_count')
                    ->label('Konfigurasi')
                    ->counts('gameConfigs'),
                Tables\Columns\TextColumn::make('sort_order')->label('Urutan')->sortable(),
                Tables\Columns\ToggleColumn::make('is_enabled')->label('Aktif'),
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
            'index' => Pages\ListLevels::route('/'),
            'create' => Pages\CreateLevel::route('/create'),
            'edit' => Pages\EditLevel::route('/{record}/edit'),
        ];
    }
}
