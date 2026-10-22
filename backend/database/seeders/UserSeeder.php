<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Developer (admin platform) ────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'dev@gogreen.id'],
            [
                'name'              => 'Developer GO GREEN',
                'password'          => Hash::make('dev123'),
                'role'              => 'developer',
                'phone'             => '081200000001',
                'status'            => 'active',
                'member_code'       => null,
                'email_verified_at' => now(),
            ]
        );

        // ── Waste Bank accounts ───────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'jaya@gogreen.id'],
            [
                'name'              => 'Petugas Bank Sampah Jaya',
                'password'          => Hash::make('password'),
                'role'              => 'waste_bank',
                'phone'             => '081211111111',
                'status'            => 'active',
                'member_code'       => null,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'makmur@gogreen.id'],
            [
                'name'              => 'Petugas Bank Sampah Makmur',
                'password'          => Hash::make('password'),
                'role'              => 'waste_bank',
                'phone'             => '081222222222',
                'status'            => 'active',
                'member_code'       => null,
                'email_verified_at' => now(),
            ]
        );

        // ── Community accounts ────────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'komunitas@gogreen.id'],
            [
                'name'              => 'Komunitas DIY Jakarta',
                'password'          => Hash::make('password'),
                'role'              => 'community',
                'phone'             => '081233333333',
                'status'            => 'active',
                'member_code'       => null,
                'email_verified_at' => now(),
            ]
        );

        // ── Regular users (warga) — member_code di-generate otomatis ──────
        User::updateOrCreate(
            ['email' => 'budi@gogreen.id'],
            [
                'name'              => 'Budi Santoso',
                'password'          => Hash::make('password'),
                'role'              => 'user',
                'phone'             => '081244444444',
                'status'            => 'active',
                'points_balance'    => 150,
                'email_verified_at' => now(),
                // member_code akan di-generate oleh model boot jika belum ada
            ]
        );

        User::updateOrCreate(
            ['email' => 'sari@gogreen.id'],
            [
                'name'              => 'Sari Dewi',
                'password'          => Hash::make('password'),
                'role'              => 'user',
                'phone'             => '081255555555',
                'status'            => 'active',
                'points_balance'    => 80,
                'email_verified_at' => now(),
            ]
        );
    }
}
