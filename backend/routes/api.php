<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DiyGuideController;
use App\Http\Controllers\Admin\DiySubmissionController as AdminDiySubmissionController;
use App\Http\Controllers\Admin\MlStatusController;
use App\Http\Controllers\Admin\RedemptionController;
use App\Http\Controllers\Admin\RewardController;
use App\Http\Controllers\Admin\StatsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\WasteBankController as AdminWasteBankController;
use App\Http\Controllers\Api\AiCraftRecommendationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\User\DiySubmissionController;
use App\Http\Controllers\User\MemberCardController;
use App\Http\Controllers\User\NotificationController;
use App\Http\Controllers\User\PointLedgerController;
use App\Http\Controllers\User\SummaryController;
use App\Http\Controllers\User\UserDepositController;
use App\Http\Controllers\User\WasteBankSearchController;
use App\Http\Controllers\WasteBank\DepositController;
use App\Http\Controllers\WasteBank\MaterialRequestController;
use App\Http\Controllers\WasteBank\ProfileController;
use App\Http\Controllers\WasteBank\StatsController as WasteBankStatsController;
use App\Models\WasteBank;
use Illuminate\Support\Facades\Route;

// ── Auth publik ───────────────────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::middleware('throttle:login')->post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    // Google OAuth — hanya untuk role user
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/google/callback', [AuthController::class, 'googleCallback']);
});

Route::get('waste-banks', function () {
    return response()->json([
        'data' => WasteBank::verified()->select('id', 'name', 'address')->orderBy('name')->get(),
    ]);
});

// ── Auth privat ───────────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── Waste Bank ────────────────────────────────────────────────────────
    Route::middleware('role:waste_bank')->prefix('waste-bank')->group(function () {

        // Profil: dapat diakses meski belum verified (agar bisa lihat status verifikasi)
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);

        // Kategori yang tersedia (untuk checklist profil, tidak perlu verified)
        Route::get('categories/available', [ProfileController::class, 'availableCategories']);

        // Rute yang butuh verified
        Route::middleware('waste_bank.verified')->group(function () {
            // Toggle buka/tutup hanya relevan setelah verified
            Route::patch('status', [ProfileController::class, 'toggleStatus']);
            Route::put('categories', [ProfileController::class, 'syncCategories']);

            // Member lookup — ?token= (QR) atau ?code= (manual, cadangan)
            Route::middleware('throttle:member-lookup')->get('members/lookup', [DepositController::class, 'findMember']);

            // Kategori yang diterima bank ini
            Route::get('deposit-categories', [DepositController::class, 'depositCategories']);

            // Setoran — export harus sebelum {id} agar tidak terambil sebagai param
            Route::get('deposits/export', [DepositController::class, 'export']);
            Route::get('deposits', [DepositController::class, 'index']);
            Route::post('deposits', [DepositController::class, 'store']);
            Route::get('deposits/{id}', [DepositController::class, 'show']);

            // Statistik
            Route::get('stats', [WasteBankStatsController::class, 'index']);

            // Material requests
            Route::get('material-requests', [MaterialRequestController::class, 'index']);
            Route::post('material-requests/{id}/responses', [MaterialRequestController::class, 'respond']);
            Route::get('responses', [MaterialRequestController::class, 'myResponses']);
            Route::patch('responses/{id}/delivered', [MaterialRequestController::class, 'markDelivered']);
        });
    });

    // ── User (warga) ──────────────────────────────────────────────────────
    Route::middleware('role:user')->prefix('user')->group(function () {
        Route::get('member-card', [MemberCardController::class, 'show']);
        Route::middleware('throttle:member-token')->post('member-token', [MemberCardController::class, 'generateToken']);
        Route::get('member-token/status', [MemberCardController::class, 'tokenStatus']);

        Route::get('summary', SummaryController::class);

        Route::get('deposits', [UserDepositController::class, 'index']);
        Route::post('deposits', [UserDepositController::class, 'store']);
        Route::get('deposits/{id}', [UserDepositController::class, 'show']);

        Route::get('points', PointLedgerController::class);

        // Upload karya / DIY submissions
        Route::get('diy-submissions', [DiySubmissionController::class, 'index']);
        Route::post('diy-submissions', [DiySubmissionController::class, 'store']);

        // Notifikasi — read-all sebelum {id} agar tidak terambil sebagai param
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead']);

        // Pencarian bank sampah
        Route::get('waste-banks', [WasteBankSearchController::class, 'index']);
        Route::get('waste-banks/{id}', [WasteBankSearchController::class, 'show']);

        // Rekomendasi karya berbasis AI dari hasil scan sampah
        Route::middleware('throttle:ai-recommend')->post('scan/ai-recommend', [AiCraftRecommendationController::class, 'recommend']);
    });

    // ── Community ─────────────────────────────────────────────────────────
    Route::middleware('role:community')->prefix('community')->group(function () {
        Route::get('dashboard', DashboardController::class);
        Route::get('material-requests', [App\Http\Controllers\Community\MaterialRequestController::class, 'index']);
        Route::post('material-requests', [App\Http\Controllers\Community\MaterialRequestController::class, 'store']);
        Route::patch('material-requests/{id}', [App\Http\Controllers\Community\MaterialRequestController::class, 'update']);
        Route::delete('material-requests/{id}', [App\Http\Controllers\Community\MaterialRequestController::class, 'destroy']);
    });

    // ── Developer ─────────────────────────────────────────────────────────
    Route::middleware('role:developer')->prefix('admin')->group(function () {
        // Stats ringkasan
        Route::get('stats', [StatsController::class, 'index']);

        // Bank sampah — verifikasi
        Route::get('waste-banks', [AdminWasteBankController::class, 'index']);
        Route::get('waste-banks/{id}', [AdminWasteBankController::class, 'show']);
        Route::patch('waste-banks/{id}/verify', [AdminWasteBankController::class, 'verify']);

        // Users — status management
        Route::get('users', [UserController::class, 'index']);
        Route::get('users/{id}', [UserController::class, 'show']);
        Route::patch('users/{id}/status', [UserController::class, 'updateStatus']);

        // Kategori sampah — CRUD
        Route::get('categories', [CategoryController::class, 'index']);
        Route::post('categories', [CategoryController::class, 'store']);
        Route::get('categories/{id}', [CategoryController::class, 'show']);
        Route::put('categories/{id}', [CategoryController::class, 'update']);
        Route::delete('categories/{id}', [CategoryController::class, 'destroy']);

        // Rewards — CRUD
        Route::get('rewards', [RewardController::class, 'index']);
        Route::post('rewards', [RewardController::class, 'store']);
        Route::get('rewards/{id}', [RewardController::class, 'show']);
        Route::put('rewards/{id}', [RewardController::class, 'update']);
        Route::delete('rewards/{id}', [RewardController::class, 'destroy']);

        // Redemptions — list + status update
        Route::get('redemptions', [RedemptionController::class, 'index']);
        Route::patch('redemptions/{id}', [RedemptionController::class, 'update']);

        // ML status monitoring
        Route::get('ml-status', [MlStatusController::class, 'index']);
    });

    // Developer + Community — panduan DIY
    Route::middleware('role:developer,community')->prefix('admin')->group(function () {
        Route::get('diy-guides', [DiyGuideController::class, 'index']);
        Route::post('diy-guides', [DiyGuideController::class, 'store']);
        Route::get('diy-guides/{id}', [DiyGuideController::class, 'show']);
        Route::put('diy-guides/{id}', [DiyGuideController::class, 'update']);
        Route::delete('diy-guides/{id}', [DiyGuideController::class, 'destroy']);
    });

    // Developer saja — validasi karya
    Route::middleware('role:developer')->prefix('admin')->group(function () {
        Route::get('diy-submissions', [AdminDiySubmissionController::class, 'index']);
        Route::patch('diy-submissions/{id}/review', [AdminDiySubmissionController::class, 'review']);
    });
});
