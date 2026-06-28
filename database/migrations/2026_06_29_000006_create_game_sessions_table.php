<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // null = guest
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('score')->default(0);
            $table->decimal('accuracy', 5, 2)->default(0); // 0.00 - 100.00
            $table->unsignedInteger('duration_ms')->default(0);
            $table->unsignedInteger('rounds')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamp('played_at')->nullable();
            $table->timestamps();

            $table->index(['game_id', 'level_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};
