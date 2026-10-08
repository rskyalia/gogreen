<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Hanya FRONTEND_URL yang boleh mengakses API ini.
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

    /*
     * Set true jika frontend mengirim cookies (misal: session-based auth).
     * Untuk Sanctum SPA (cookie), harus true. Untuk token saja, false cukup.
     */
    'supports_credentials' => true,
];
