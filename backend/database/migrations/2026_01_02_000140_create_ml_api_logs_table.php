<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Log panggilan API ML — developer bisa memantau performa model
        Schema::create('ml_api_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waste_scan_id')->nullable()->constrained()->nullOnDelete();
            $table->string('model_name');
            $table->enum('status', ['success', 'error']);
            $table->unsignedInteger('response_time_ms');
            $table->decimal('confidence', 5, 2)->nullable();
            $table->text('error_message')->nullable();
            // Hanya created_at — log tidak diupdate
            $table->timestamp('created_at')->useCurrent();

            $table->index('status');
            $table->index('model_name');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ml_api_logs');
    }
};
