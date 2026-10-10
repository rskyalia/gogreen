<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Detail per kategori sampah dalam satu sesi deposit
        Schema::create('deposit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deposit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('waste_category_id')->constrained()->cascadeOnDelete();
            $table->decimal('weight_kg', 8, 2);
            $table->unsignedInteger('points'); // weight_kg * points_per_kg

            $table->index('deposit_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposit_items');
    }
};
