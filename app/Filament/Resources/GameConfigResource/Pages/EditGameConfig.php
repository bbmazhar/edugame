<?php

namespace App\Filament\Resources\GameConfigResource\Pages;

use App\Filament\Resources\GameConfigResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditGameConfig extends EditRecord
{
    protected static string $resource = GameConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
