<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waste_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('waste_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('image_path');
            $table->string('object_name');
            $table->string('material');
            $table->decimal('confidence', 5, 2); // 0.00 – 100.00
            $table->unsignedTinyInteger('green_score'); // 0-100
            // recommended_path: diy = panduan upcycling, bank_sampah = setor ke bank, both = keduanya
            $table->enum('recommended_path', ['diy', 'bank_sampah', 'both'])->default('both');
            $table->json('raw_result');
            $table->timestamps();

            $table->index('user_id');
            $table->index('waste_category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_scans');
    }
};
