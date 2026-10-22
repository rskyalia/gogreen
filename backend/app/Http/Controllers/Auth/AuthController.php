<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\WasteBank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/register
     *
     * - Tanpa payload tambahan         → role user   (member_code di-generate otomatis)
     * - Dengan payload "waste_bank"    → role waste_bank, verification_status=pending
     * - Dengan payload "community"     → role community, status=active (langsung bisa pakai)
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request): JsonResponse {
            // Tentukan role dari payload
            $role = match (true) {
                $request->has('waste_bank') => 'waste_bank',
                $request->has('community')  => 'community',
                default                     => 'user',
            };

            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => $request->password,   // auto-hashed via cast
                'role'     => $role,
                'phone'    => $request->phone,
                // member_code untuk role=user di-generate oleh User::booted()
            ]);

            $message = 'Registrasi berhasil.';

            // Daftar sebagai waste_bank — buat record WasteBank (pending)
            if ($role === 'waste_bank') {
                WasteBank::create([
                    'user_id'             => $user->id,
                    'name'                => $request->input('waste_bank.name'),
                    'address'             => $request->input('waste_bank.address'),
                    'latitude'            => $request->input('waste_bank.latitude'),
                    'longitude'           => $request->input('waste_bank.longitude'),
                    'phone'               => $request->input('waste_bank.phone'),
                    'opening_hours'       => $request->input('waste_bank.opening_hours'),
                    'description'         => $request->input('waste_bank.description'),
                    'is_open'             => false,
                    'verification_status' => 'pending',
                ]);

                $message = 'Registrasi berhasil. Akun bank sampah Anda menunggu verifikasi developer.';
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            $user->load('wasteBank');

            return response()->json([
                'message' => $message,
                'token'   => $token,
                'user'    => new UserResource($user),
            ], 201);
        });
    }

    /**
     * POST /api/login
     *
     * Ditolak jika:
     * - Akun banned
     * - Role waste_bank tapi verification_status masih pending atau rejected
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        // Cek status banned
        if ($user->isBanned()) {
            Auth::logout();
            return response()->json([
                'message' => 'Akun Anda telah diblokir. Hubungi administrator.',
                'errors'  => ['status' => ['Akun diblokir: ' . ($user->banned_reason ?? '-')]],
            ], 403);
        }

        // Cek verifikasi waste_bank
        if ($user->isWasteBank()) {
            $user->load('wasteBank');
            $wb = $user->wasteBank;

            if (! $wb || $wb->verification_status === 'pending') {
                Auth::logout();
                return response()->json([
                    'message' => 'Akun bank sampah Anda belum diverifikasi oleh developer.',
                    'errors'  => ['verification' => ['Menunggu verifikasi.']],
                ], 403);
            }

            if ($wb->verification_status === 'rejected') {
                Auth::logout();
                return response()->json([
                    'message' => 'Akun bank sampah Anda ditolak. Hubungi administrator.',
                    'errors'  => ['verification' => ['Pendaftaran ditolak.']],
                ], 403);
            }
        } else {
            $user->load('wasteBank');
        }

        // Hapus semua token lama (single-session per user)
        // Hapus baris ini jika ingin mendukung multi-device login
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token'   => $token,
            'user'    => new UserResource($user),
        ]);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('wasteBank');

        return response()->json(['user' => new UserResource($user)]);
    }
}
