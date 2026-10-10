<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Deposit dibuat langsung oleh petugas bank sampah saat user datang
        // User dicari via member_code — tidak ada tahap pending
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waste_bank_id')->constrained()->cascadeOnDelete();
            // user_id: warga yang menyetor (dicari via member_code)
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // recorded_by: user_id petugas bank sampah yang mencatat
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->decimal('total_weight_kg', 10, 3)->default(0);
            $table->unsignedInteger('total_points')->default(0);
            $table->timestamps();

            $table->index('waste_bank_id');
            $table->index('user_id');
            $table->index('recorded_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
