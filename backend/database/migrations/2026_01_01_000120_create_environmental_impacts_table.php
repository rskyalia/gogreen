<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('environmental_impacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('waste_diverted_kg', 10, 3)->default(0);
            $table->unsignedInteger('items_reused')->default(0);
            $table->decimal('waste_deposited_kg', 10, 3)->default(0);
            $table->unsignedInteger('total_scans')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('environmental_impacts');
    }
};
