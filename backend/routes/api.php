<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — GO GREEN
|--------------------------------------------------------------------------
*/

// ── Auth (publik) ─────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    // Rate limit: 5 percobaan per menit per kombinasi email+IP
    Route::middleware('throttle:login')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
    });

    Route::post('/register', [AuthController::class, 'register']);
});

// ── Auth (butuh token) ────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── Citizen routes ────────────────────────────────────────────────────
    Route::middleware('role:citizen')->prefix('citizen')->group(function () {
        // placeholder — tambahkan controller citizen di sini
        // Route::apiResource('scans', ScanController::class);
    });

    // ── Waste Bank routes ─────────────────────────────────────────────────
    Route::middleware('role:waste_bank')->prefix('waste-bank')->group(function () {
        // placeholder — tambahkan controller waste_bank di sini
        // Route::apiResource('deposits', DepositController::class);
    });

    // ── Admin routes ──────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // placeholder — tambahkan controller admin di sini
        // Route::post('waste-banks/{id}/verify', [AdminWasteBankController::class, 'verify']);
    });
});
