<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
    
class AuthController extends Controller
{
    use ApiResponse;

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Email atau password salah', 401);
        }

        // Bikin token Sanctum resmi
        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->successResponse([
            'user'  => $user,
            'token' => $token,
        ], 'Login berhasil!');
    }

    public function registerCommunity(Request $request)
{
    $request->validate([
        'name'     => 'required|string|max:255',
        'email'    => 'required|string|email|unique:users',
        'password' => 'required|string|min:8',
    ]);

    $user = User::create([
        'name'                => $request->name,
        'email'               => $request->email,
        'password'            => Hash::make($request->password),
        'verification_status' => 'pending',
    ]);

    $user->assignRole('komunitas_diy');

    return $this->successResponse(
        $user,
        'Pendaftaran akun Komunitas berhasil! Akun kamu sedang menunggu verifikasi Developer.',
        201
    );
}
}
