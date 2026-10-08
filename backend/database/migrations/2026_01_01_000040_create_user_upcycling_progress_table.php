<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_upcycling_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('upcycling_idea_id')->constrained()->cascadeOnDelete();
            $table->foreignId('waste_scan_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['started', 'completed'])->default('started');
            $table->string('proof_image')->nullable();
            $table->unsignedInteger('points_awarded')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('upcycling_idea_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_upcycling_progress');
    }
};
