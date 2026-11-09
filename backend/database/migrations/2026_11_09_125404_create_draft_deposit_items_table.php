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
        // Detail per kategori sampah dalam draft setoran
        Schema::create('draft_deposit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('draft_deposit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('waste_category_id')->constrained()->cascadeOnDelete();
            $table->decimal('weight_kg', 8, 2);

            $table->index('draft_deposit_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('draft_deposit_items');
    }
};
