<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_request_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_request_id')->constrained()->cascadeOnDelete();
            // responder: waste_bank atau user biasa yang mau menyumbangkan material
            $table->foreignId('responder_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('quantity_offered_kg', 8, 2);
            $table->enum('status', ['offered', 'accepted', 'delivered', 'received'])->default('offered');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('material_request_id');
            $table->index('responder_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_request_responses');
    }
};
