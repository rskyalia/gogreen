<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pivot: kategori sampah apa saja yang diterima oleh suatu bank sampah
        Schema::create('waste_bank_categories', function (Blueprint $table) {
            $table->foreignId('waste_bank_id')->constrained()->cascadeOnDelete();
            $table->foreignId('waste_category_id')->constrained()->cascadeOnDelete();

            $table->primary(['waste_bank_id', 'waste_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_bank_categories');
    }
};
