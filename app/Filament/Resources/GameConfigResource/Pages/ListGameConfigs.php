<?php

namespace App\Filament\Resources\GameConfigResource\Pages;

use App\Filament\Resources\GameConfigResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListGameConfigs extends ListRecords
{
    protected static string $resource = GameConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
