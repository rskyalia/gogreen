<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware: waste_bank.verified
 *
 * Menolak request jika waste_bank.verification_status bukan 'verified'.
 * Harus digunakan SETELAH 'auth:sanctum' dan 'role:waste_bank' — middleware ini
 * tidak melakukan cek role sendiri, hanya cek status verifikasi.
 *
 * Contoh penggunaan di route:
 *   Route::middleware(['role:waste_bank', 'waste_bank.verified'])->group(...)
 */
class WasteBankVerifiedMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $wasteBank = $user->wasteBank;

        if (! $wasteBank) {
            return response()->json([
                'message' => 'Forbidden. Data bank sampah tidak ditemukan untuk akun ini.',
                'code' => 'bank_not_verified',
                'errors' => ['verification' => ['Akun bank sampah tidak terdaftar.']],
            ], 403);
        }

        if ($wasteBank->verification_status !== 'verified') {
            $status = $wasteBank->verification_status;
            $message = match ($status) {
                'pending' => 'Akun bank sampah Anda belum diverifikasi. Silakan tunggu konfirmasi dari developer.',
                'rejected' => 'Akun bank sampah Anda ditolak. Hubungi administrator untuk informasi lebih lanjut.',
                default => 'Akun bank sampah Anda tidak dapat mengakses fitur ini.',
            };

            return response()->json([
                'message' => $message,
                'code' => 'bank_not_verified',
                'errors' => ['verification' => [$message]],
            ], 403);
        }

        return $next($request);
    }
}
