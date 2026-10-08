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
            $table->decimal('confidence', 5, 4); // e.g. 0.9512
            $table->unsignedTinyInteger('green_score'); // 0-100
            $table->string('score_label');
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('low');
            $table->text('recommended_action');
            $table->json('raw_result');
            $table->timestamps();

            $table->index('user_id');
            $table->index('waste_category_id');
            $table->index('risk_level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_scans');
    }
};
