<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upcycling_ideas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waste_category_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('easy');
            $table->unsignedInteger('estimated_minutes')->default(30);
            $table->unsignedInteger('estimated_cost')->default(0); // in IDR
            $table->json('additional_materials')->nullable();
            $table->json('tutorial_steps');
            $table->string('video_url')->nullable();
            $table->string('image')->nullable();
            $table->decimal('impact_kg', 8, 3)->default(0); // kg of waste diverted
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('waste_category_id');
            $table->index('is_active');
            $table->index('difficulty');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('upcycling_ideas');
    }
};
