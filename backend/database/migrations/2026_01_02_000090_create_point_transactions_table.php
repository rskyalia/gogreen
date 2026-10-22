<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ledger poin — sumber kebenaran saldo poin user
        // Setiap perubahan poin (tambah/kurang) wajib dicatat di sini
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['deposit', 'diy_approved', 'redeem', 'adjustment']);
            // points bisa negatif untuk redeem/adjustment pengurangan
            $table->integer('points');
            // snapshot saldo setelah transaksi ini
            $table->unsignedInteger('balance_after');
            // Polymorphic reference ke sumber transaksi
            $table->nullableMorphs('reference');
            $table->string('description');
            $table->timestamps();

            $table->index('user_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
