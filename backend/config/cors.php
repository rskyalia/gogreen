<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CORS — hanya izinkan request dari FRONTEND_URL
    |--------------------------------------------------------------------------
    |
    | Set FRONTEND_URL di .env, contoh: http://localhost:3000
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // true jika frontend mengirim cookie (Sanctum SPA).
    // Untuk token-only (Next.js fetch + Bearer), false sudah cukup.
    'supports_credentials' => true,
];
