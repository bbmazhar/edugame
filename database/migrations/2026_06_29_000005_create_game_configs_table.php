<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->json('params'); // difficulty knobs per (game, level)
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['game_id', 'level_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_configs');
    }
};
