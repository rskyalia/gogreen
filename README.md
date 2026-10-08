# GO GREEN
AI-Powered Waste Innovation & Circular Economy Platform

## Struktur
- `frontend/` Next.js (App Router, TypeScript)
- `backend/`  Laravel (REST API + Sanctum)

## Setup awal

### Frontend
Folder ini baru berisi struktur. Generate project Next.js di dalam folder sementara,
lalu salin isinya ke `frontend/` (jangan timpa `src/` yang sudah ada):

    npx create-next-app@latest tmp-next --typescript --tailwind --eslint --app --src-dir
    # salin config (package.json, tsconfig.json, next.config.*, tailwind/postcss config) ke frontend/
    cd frontend && npm install && npm run dev

### Backend

    composer create-project laravel/laravel tmp-laravel
    # salin vendor-less file bawaan Laravel (artisan, bootstrap/, config/, public/, composer.json, dll)
    # ke backend/ tanpa menimpa folder app/, routes/api.php, database/ yang sudah ada
    cd backend && composer install
    cp .env.example .env && php artisan key:generate
    php artisan install:api      # Sanctum
    php artisan migrate && php artisan serve

Frontend: http://localhost:3000, Backend: http://localhost:8000
