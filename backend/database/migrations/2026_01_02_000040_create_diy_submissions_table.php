<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diy_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('diy_guide_id')->constrained()->cascadeOnDelete();
            $table->foreignId('waste_scan_id')->nullable()->constrained()->nullOnDelete();
            $table->string('proof_image');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            // review_note wajib diisi saat reject
            $table->text('review_note')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedInteger('points_awarded')->default(0);
            $table->timestamps();

            $table->index('user_id');
            $table->index('diy_guide_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diy_submissions');
    }
};
