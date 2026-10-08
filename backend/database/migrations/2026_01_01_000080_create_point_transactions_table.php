<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('action_type', ['scan', 'upcycle', 'deposit', 'recycle_per_kg', 'achievement']);
            $table->integer('points'); // bisa negatif untuk penukaran
            $table->string('description');
            // Polymorphic: morphs ke scan, deposit, progress, dsb.
            $table->nullableMorphs('reference');
            $table->timestamps();

            $table->index('user_id');
            $table->index('action_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
