<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin default
        User::updateOrCreate(
            ['email' => 'admin@gogreen.id'],
            [
                'name'              => 'Super Admin',
                'password'          => Hash::make('admin123'),
                'role'              => 'admin',
                'phone'             => '081200000000',
                'is_active'         => true,
                'email_verified_at' => now(),
            ]
        );

        // Contoh akun waste_bank
        $wb1 = User::updateOrCreate(
            ['email' => 'banksampahjaya@gogreen.id'],
            [
                'name'              => 'Bank Sampah Jaya',
                'password'          => Hash::make('password'),
                'role'              => 'waste_bank',
                'phone'             => '081211111111',
                'is_active'         => true,
                'email_verified_at' => now(),
            ]
        );

        $wb2 = User::updateOrCreate(
            ['email' => 'banksampahmakmur@gogreen.id'],
            [
                'name'              => 'Bank Sampah Makmur',
                'password'          => Hash::make('password'),
                'role'              => 'waste_bank',
                'phone'             => '081222222222',
                'is_active'         => true,
                'email_verified_at' => now(),
            ]
        );

        // Contoh akun citizen
        User::updateOrCreate(
            ['email' => 'citizen@gogreen.id'],
            [
                'name'              => 'Budi Santoso',
                'password'          => Hash::make('password'),
                'role'              => 'citizen',
                'phone'             => '081233333333',
                'total_points'      => 150,
                'is_active'         => true,
                'email_verified_at' => now(),
            ]
        );

        // Simpan id waste_bank user agar bisa dipakai seeder lain
        $this->command->getOutput()->writeln(
            "  <info>Waste bank user IDs: {$wb1->id}, {$wb2->id}</info>"
        );
    }
}
