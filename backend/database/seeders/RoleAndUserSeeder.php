<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class RoleAndUserSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cache permission
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Buat atau ambil Role
        $developerRole = Role::firstOrCreate(['name' => 'developer']);
        $userRole      = Role::firstOrCreate(['name' => 'user']);
        $bankRole      = Role::firstOrCreate(['name' => 'bank_sampah']);
        $komunitasRole = Role::firstOrCreate(['name' => 'komunitas_diy']);

        // 2. Ubah data akun dummy admin jadi developer
        $usersData = [
            [
                'name'     => 'Developer GoGreen',
                'email'    => 'developer@gogreen.com',
                'password' => Hash::make('password123'),
                'role'     => $developerRole,
            ],
            [
                'name'     => 'User Warga GoGreen',
                'email'    => 'user@gogreen.com',
                'password' => Hash::make('password123'),
                'role'     => $userRole,
            ],
            [
                'name'     => 'Bank Sampah Sejahtera',
                'email'    => 'banksampah@gogreen.com',
                'password' => Hash::make('password123'),
                'role'     => $bankRole,
            ],
            [
                'name'     => 'Komunitas DIY Daur Ulang',
                'email'    => 'komunitas@gogreen.com',
                'password' => Hash::make('password123'),
                'role'     => $komunitasRole,
            ],
        ];

        // 3. Loop untuk membuat user dan menugaskan role
        foreach ($usersData as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'     => $data['name'],
                    'password' => $data['password'],
                ]
            );

            if (!$user->hasRole($data['role'])) {
                $user->assignRole($data['role']);
            }
        }
    }
}
