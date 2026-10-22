<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\WasteBank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

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
                $request->has('community') => 'community',
                default => 'user',
            };

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,   // auto-hashed via cast
                'role' => $role,
                'phone' => $request->phone,
                // member_code untuk role=user di-generate oleh User::booted()
            ]);

            $message = 'Registrasi berhasil.';

            // Daftar sebagai waste_bank — buat record WasteBank (pending)
            if ($role === 'waste_bank') {
                WasteBank::create([
                    'user_id' => $user->id,
                    'name' => $request->input('waste_bank.name'),
                    'address' => $request->input('waste_bank.address'),
                    'latitude' => $request->input('waste_bank.latitude'),
                    'longitude' => $request->input('waste_bank.longitude'),
                    'phone' => $request->input('waste_bank.phone'),
                    'opening_hours' => $request->input('waste_bank.opening_hours'),
                    'description' => $request->input('waste_bank.description'),
                    'is_open' => false,
                    'verification_status' => 'pending',
                ]);

                $message = 'Registrasi berhasil. Akun bank sampah Anda menunggu verifikasi developer.';
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            $user->load('wasteBank');

            return response()->json([
                'message' => $message,
                'token' => $token,
                'user' => new UserResource($user),
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
                'errors' => ['status' => ['Akun diblokir: '.($user->banned_reason ?? '-')]],
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
                    'errors' => ['verification' => ['Menunggu verifikasi.']],
                ], 403);
            }

            if ($wb->verification_status === 'rejected') {
                Auth::logout();

                return response()->json([
                    'message' => 'Akun bank sampah Anda ditolak. Hubungi administrator.',
                    'errors' => ['verification' => ['Pendaftaran ditolak.']],
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
            'token' => $token,
            'user' => new UserResource($user),
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

    /**
     * GET /api/auth/google/redirect
     *
     * Kembalikan URL redirect Google OAuth sebagai JSON
     * (stateless — cocok untuk SPA).
     */
    public function googleRedirect(): JsonResponse
    {
        /** @var string $url */
        $url = Socialite::driver('google')->stateless()->redirect()->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * GET /api/auth/google/callback
     *
     * Diproses setelah Google redirect balik ke sini.
     * Hanya untuk role=user — role lain ditolak (403).
     *
     * Alur:
     *  1. Ambil data Google user (stateless)
     *  2. Cari user via google_id ATAU email
     *  3. Jika user ditemukan tapi bukan role=user → 403
     *  4. Jika user ditemukan & role=user → link google_id jika belum, login
     *  5. Jika user belum ada → buat akun baru role=user
     *  6. Redirect ke frontend dengan token & data user di query-string
     */
    public function googleCallback(): RedirectResponse
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable) {
            return redirect("{$frontendUrl}/login?google_error=oauth_failed");
        }

        // Cari user yang sudah ada
        /** @var User|null $user */
        $user = User::where('google_id', $googleUser->getId())->first()
            ?? User::where('email', $googleUser->getEmail())->first();

        // Tolak role selain user (waste_bank, developer, community)
        if ($user && ! $user->isUser()) {
            return redirect("{$frontendUrl}/login?google_error=role_mismatch");
        }

        if ($user) {
            // Akun lama ditemukan — cek status banned
            if ($user->isBanned()) {
                return redirect("{$frontendUrl}/login?google_error=banned");
            }

            // Hubungkan google_id jika belum ter-link (login email biasa sebelumnya)
            if (! $user->google_id) {
                $user->update(['google_id' => $googleUser->getId()]);
            }
        } else {
            // Buat akun baru sebagai role=user
            $user = User::create([
                'name' => $googleUser->getName() ?? $googleUser->getEmail(),
                'email' => $googleUser->getEmail(),
                'password' => Hash::make(Str::random(32)),
                'role' => 'user',
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
                // member_code di-generate otomatis oleh User::booted()
            ]);
        }

        // Single-session: hapus semua token lama, konsisten dengan login biasa
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Encode data user ke JSON → base64 agar aman di URL
        $userJson = base64_encode(json_encode(new UserResource($user)));
        $encodedToken = urlencode($token);

        return redirect("{$frontendUrl}/auth/google/callback?token={$encodedToken}&user={$userJson}");
    }
}
