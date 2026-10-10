<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waste_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_recyclable')->default(true);
            $table->boolean('is_upcyclable')->default(true);
            // Poin yang diberikan per kg sampah yang disetor ke bank sampah
            $table->unsignedInteger('points_per_kg')->default(0);
            $table->string('icon')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_categories');
    }
};
