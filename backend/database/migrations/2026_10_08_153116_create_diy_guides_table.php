<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('diy_guides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade'); // Admin / Komunitas DIY
            $table->string('title'); // Contoh: Pot Bunga dari Botol Plastik
            $table->string('waste_category'); // Jenis sampah yang dibutuhkan
            $table->text('description');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('easy');
            $table->integer('points_reward')->default(50); // Poin yang didapet user
            $table->string('image_path')->nullable(); // Foto contoh hasil karya
            $table->json('steps'); // Langkah-langkah pembuatan (format JSON array)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diy_guides');
    }
};
