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
        Schema::create('waste_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('image_path'); // Path foto sampah yang di-upload
            $table->string('detected_category'); // Contoh: botol_plastik, kardus, dll
            $table->enum('waste_type', ['recyclable', 'non_recyclable', 'organic']);
            $table->float('confidence_score'); // Skor akurasi dari ML (contoh: 95.5)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waste_scans');
    }
};
