<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diy_guides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waste_category_id')->constrained()->cascadeOnDelete();
            // created_by: user dengan role community atau developer
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('easy');
            $table->unsignedInteger('estimated_minutes')->default(30);
            $table->unsignedInteger('estimated_cost')->default(0); // dalam rupiah
            $table->json('materials');   // ['Lem', 'Cat', ...]
            $table->json('steps');       // [{step:1, description:'...'}, ...]
            $table->string('cover_image')->nullable();
            $table->string('video_url')->nullable();
            $table->unsignedInteger('reward_points')->default(0);
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index('waste_category_id');
            $table->index('created_by');
            $table->index('is_published');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diy_guides');
    }
};
