<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mendukung "karya mandiri": karya DIY yang tidak terikat tutorial (diy_guide_id nullable)
     * plus menyimpan judul, kategori, dan catatan yang sebelumnya divalidasi tapi tidak disimpan.
     */
    public function up(): void
    {
        // 1. Lepas FK dulu agar kolom bisa diubah menjadi nullable.
        Schema::table('diy_submissions', function (Blueprint $table) {
            $table->dropForeign(['diy_guide_id']);
        });

        // 2. Buat diy_guide_id nullable + tambah kolom karya mandiri.
        Schema::table('diy_submissions', function (Blueprint $table) {
            $table->foreignId('diy_guide_id')
                ->nullable()
                ->change();

            $table->string('title')->nullable()->after('diy_guide_id');
            $table->string('category')->nullable()->after('title');
            $table->string('notes', 1000)->nullable()->after('category');
        });

        // 3. Pasang kembali FK dengan nullOnDelete (karya mandiri tidak punya guide).
        Schema::table('diy_submissions', function (Blueprint $table) {
            $table->foreign('diy_guide_id')
                ->references('id')
                ->on('diy_guides')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('diy_submissions', function (Blueprint $table) {
            $table->dropForeign(['diy_guide_id']);
        });

        Schema::table('diy_submissions', function (Blueprint $table) {
            $table->dropColumn(['title', 'category', 'notes']);
            $table->foreignId('diy_guide_id')
                ->nullable(false)
                ->change();
        });

        Schema::table('diy_submissions', function (Blueprint $table) {
            $table->foreign('diy_guide_id')
                ->references('id')
                ->on('diy_guides')
                ->cascadeOnDelete();
        });
    }
};
