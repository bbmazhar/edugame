<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GameResource\Pages;
use App\Models\Game;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class GameResource extends Resource
{
    protected static ?string $model = Game::class;

    protected static ?string $navigationIcon = 'heroicon-o-puzzle-piece';

    protected static ?string $navigationGroup = 'Katalog';

    protected static ?string $navigationLabel = 'Game';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')
                ->label('Nama')
                ->required()
                ->maxLength(255)
                ->live(onBlur: true)
                ->afterStateUpdated(fn (string $operation, $state, Forms\Set $set) => $operation === 'create' ? $set('slug', Str::slug($state)) : null),
            Forms\Components\TextInput::make('slug')
                ->label('Slug')
                ->required()
                ->maxLength(255)
                ->unique(ignoreRecord: true)
                ->helperText('Dipakai sebagai pengenal game di frontend; harus unik.'),
            Forms\Components\Textarea::make('description')
                ->label('Deskripsi')
                ->rows(3)
                ->columnSpanFull(),
            Forms\Components\TextInput::make('cognitive_domain')
                ->label('Domain kognitif')
                ->maxLength(255)
                ->placeholder('numerik, atensi-inhibisi, ...'),
            Forms\Components\TextInput::make('icon')
                ->label('Ikon')
                ->maxLength(255)
                ->placeholder('nama ikon lucide, mis. calculator'),
            Forms\Components\TextInput::make('sort_order')
                ->label('Urutan')
                ->numeric()
                ->default(0),
            Forms\Components\Toggle::make('is_enabled')
                ->label('Aktif')
                ->helperText('Matikan untuk menyembunyikan game dari katalog publik.')
                ->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('sort_order')
            ->columns([
                Tables\Columns\TextColumn::make('name')->label('Nama')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('slug')->label('Slug')->searchable()->toggleable(),
                Tables\Columns\TextColumn::make('cognitive_domain')->label('Domain')->badge(),
                Tables\Columns\TextColumn::make('configs_count')
                    ->label('Konfigurasi')
                    ->counts('configs'),
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
            'index' => Pages\ListGames::route('/'),
            'create' => Pages\CreateGame::route('/create'),
            'edit' => Pages\EditGame::route('/{record}/edit'),
        ];
    }
}
