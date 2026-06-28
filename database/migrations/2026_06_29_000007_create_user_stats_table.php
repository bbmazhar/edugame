<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->nullable()->constrained()->cascadeOnDelete(); // null = aggregate across games
            $table->unsignedInteger('best_score')->default(0);
            $table->unsignedInteger('total_sessions')->default(0);
            $table->unsignedInteger('streak_count')->default(0);
            $table->date('last_played_date')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'game_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_stats');
    }
};
