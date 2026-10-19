<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\WasteScanController;
use App\Http\Controllers\Api\DiyGuideController;
use App\Http\Controllers\Api\DiySubmissionController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register/community', [AuthController::class, 'registerCommunity']);

// Protected Routes (Wajib Pakai Token Bearer Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Feature: Machine Learning Scan
    Route::post('/waste/scan', [WasteScanController::class, 'scan']);

    // Feature: DIY Guides
    Route::get('/diy-guides', [DiyGuideController::class, 'index']);
    Route::get('/diy-guides/{id}', [DiyGuideController::class, 'show']);
    Route::post('/diy-guides', [DiyGuideController::class, 'store']); // Admin/Komunitas DIY

    // Feature: DIY Submissions & Validation
    Route::post('/diy-submissions', [DiySubmissionController::class, 'submit']); // User submit
    Route::get('/diy-submissions', [DiySubmissionController::class, 'index']); // Admin/Komunitas list
    Route::patch('/diy-submissions/{id}/validate', [DiySubmissionController::class, 'validateSubmission']); // Kurasi
});
