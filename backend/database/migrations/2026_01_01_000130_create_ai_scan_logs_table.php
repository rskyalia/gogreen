<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_scan_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waste_scan_id')->constrained()->cascadeOnDelete();
            $table->string('model_name');
            $table->decimal('confidence', 5, 4);
            $table->boolean('is_corrected')->default(false);
            $table->string('corrected_label')->nullable();
            $table->timestamps();

            $table->index('waste_scan_id');
            $table->index('is_corrected');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_scan_logs');
    }
};
