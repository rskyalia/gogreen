<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * users.status + users.banned_reason already exist in the initial migration.
 * This migration is a no-op placeholder — keeping it so the migration history
 * stays consistent if the schema is rebuilt from scratch.
 */
return new class extends Migration
{
    public function up(): void
    {
        // No-op: status and banned_reason columns were created in 000000_create_users_table
    }

    public function down(): void
    {
        // No-op
    }
};
