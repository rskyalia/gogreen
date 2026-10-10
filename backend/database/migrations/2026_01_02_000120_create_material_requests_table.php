<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Permintaan bahan bekas dari komunitas DIY
        Schema::create('material_requests', function (Blueprint $table) {
            $table->id();
            // community_id: user dengan role community
            $table->foreignId('community_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('waste_category_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity_needed_kg', 8, 2);
            $table->text('notes')->nullable();
            $table->enum('status', ['open', 'fulfilled', 'closed'])->default('open');
            $table->timestamps();

            $table->index('community_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_requests');
    }
};
