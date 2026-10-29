<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('material_requests', function (Blueprint $table) {
            $table->string('permintaan_bahan')->nullable()->after('community_id');
        });
    }

    public function down(): void
    {
        Schema::table('material_requests', function (Blueprint $table) {
            $table->dropColumn('permintaan_bahan');
        });
    }
};
