<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — GO GREEN
|--------------------------------------------------------------------------
|
| Semua route di sini sudah ter-prefix /api secara otomatis.
| Struktur:
|   - Auth publik  : /api/register, /api/login
|   - Auth privat  : /api/logout, /api/me
|   - User         : /api/user/*
|   - Waste Bank   : /api/waste-bank/*
|   - Community    : /api/community/*
|   - Developer    : /api/developer/*
|
*/

// ── Auth publik ───────────────────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    // Rate limit: 5 percobaan/menit per email+IP (lihat AppServiceProvider)
    Route::middleware('throttle:login')->post('/login', [AuthController::class, 'login']);

    // Register: tanpa extra payload → user
    //           dengan "waste_bank"  → waste_bank (pending)
    //           dengan "community"   → community
    Route::post('/register', [AuthController::class, 'register']);
});

// ── Auth privat (butuh token Sanctum) ────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── User (warga) ──────────────────────────────────────────────────────
    Route::middleware('role:user')->prefix('user')->group(function () {
        // Fase berikutnya:
        // Route::apiResource('scans', WasteScanController::class);
        // Route::apiResource('diy-submissions', DiySubmissionController::class);
        // Route::apiResource('redemptions', RewardRedemptionController::class);
    });

    // ── Waste Bank (petugas) ──────────────────────────────────────────────
    Route::middleware('role:waste_bank')->prefix('waste-bank')->group(function () {
        // Route::post('deposits', [DepositController::class, 'store']);
        // Route::get('deposits', [DepositController::class, 'index']);
        // Route::get('users/by-member-code/{code}', [UserLookupController::class, 'byMemberCode']);
    });

    // ── Community ─────────────────────────────────────────────────────────
    Route::middleware('role:community')->prefix('community')->group(function () {
        // Route::apiResource('diy-guides', CommunityDiyGuideController::class);
        // Route::apiResource('material-requests', MaterialRequestController::class);
    });

    // ── Developer (admin platform) ────────────────────────────────────────
    Route::middleware('role:developer')->prefix('developer')->group(function () {
        // Route::post('waste-banks/{id}/verify', [WasteBankVerificationController::class, 'verify']);
        // Route::post('users/{id}/ban', [UserManagementController::class, 'ban']);
        // Route::get('ml-logs', [MlApiLogController::class, 'index']);
    });

    // ── Route yang bisa diakses beberapa role ─────────────────────────────
    // Contoh: developer dan community bisa buat panduan DIY
    Route::middleware('role:developer,community')->prefix('diy')->group(function () {
        // Route::apiResource('guides', DiyGuideController::class);
    });
});
