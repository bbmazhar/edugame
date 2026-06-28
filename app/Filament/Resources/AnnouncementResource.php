<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AnnouncementResource\Pages;
use App\Models\Announcement;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class AnnouncementResource extends Resource
{
    protected static ?string $model = Announcement::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $navigationGroup = 'Pengelolaan';

    protected static ?string $navigationLabel = 'Pengumuman';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('title')
                ->label('Judul')
                ->required()
                ->maxLength(255),
            Forms\Components\Textarea::make('body')
                ->label('Isi')
                ->rows(4)
                ->columnSpanFull(),
            Forms\Components\Toggle::make('is_active')
                ->label('Aktif')
                ->default(true),
            Forms\Components\DateTimePicker::make('starts_at')
                ->label('Mulai tampil'),
            Forms\Components\DateTimePicker::make('ends_at')
                ->label('Berhenti tampil')
                ->after('starts_at'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('title')->label('Judul')->searchable()->limit(50),
                Tables\Columns\ToggleColumn::make('is_active')->label('Aktif'),
                Tables\Columns\TextColumn::make('starts_at')->label('Mulai')->dateTime()->placeholder('—')->toggleable(),
                Tables\Columns\TextColumn::make('ends_at')->label('Selesai')->dateTime()->placeholder('—')->toggleable(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')->label('Status aktif'),
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
            'index' => Pages\ListAnnouncements::route('/'),
            'create' => Pages\CreateAnnouncement::route('/create'),
            'edit' => Pages\EditAnnouncement::route('/{record}/edit'),
        ];
    }
}
