<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\WasteBank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Pencarian bank sampah publik (verified) untuk user.
 *
 * Strategi jarak:
 *   1. Bounding-box SQL (lat/lng BETWEEN) untuk memangkas kandidat.
 *   2. Haversine dihitung di PHP agar kompatibel dengan SQLite (test) dan MySQL (produksi).
 *   3. Hasil di-sort dan di-filter di PHP, lalu dikirim ke paginator manual.
 *
 * Filter:
 *  - lat / lng      : titik asal pengguna (opsional)
 *  - radius_km      : radius maksimum (default 10, max 50)
 *  - category_id    : hanya bank yang menerima kategori ini
 *  - open_now       : is_open = true DAN jam hari ini belum habis
 */
class WasteBankSearchController extends Controller
{
    private const EARTH_RADIUS_KM = 6371.0;

    // Peta nama hari PHP (0=Sun…6=Sat) → kunci opening_hours
    private const DAY_KEYS = [
        0 => 'minggu',
        1 => 'senin',
        2 => 'selasa',
        3 => 'rabu',
        4 => 'kamis',
        5 => 'jumat',
        6 => 'sabtu',
    ];

    /**
     * GET /api/user/waste-banks
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_km' => ['nullable', 'numeric', 'min:1', 'max:50'],
            'category_id' => ['nullable', 'integer', 'exists:waste_categories,id'],
            'open_now' => ['nullable', 'in:1,0,true,false'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $lat = isset($validated['lat']) ? (float) $validated['lat'] : null;
        $lng = isset($validated['lng']) ? (float) $validated['lng'] : null;
        $radiusKm = (float) ($validated['radius_km'] ?? 10);
        $hasCoords = $lat !== null && $lng !== null;
        $openNow = filter_var($validated['open_now'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $perPage = (int) ($validated['per_page'] ?? 20);
        $page = (int) ($validated['page'] ?? 1);

        $now = now();
        $dayKey = self::DAY_KEYS[(int) $now->format('w')];
        $timeNow = $now->format('H:i');

        // ── Query dasar ───────────────────────────────────────────────────
        $query = WasteBank::verified()->with('acceptedCategories');

        // Filter kategori
        if (! empty($validated['category_id'])) {
            $query->whereHas('acceptedCategories', function ($q) use ($validated) {
                $q->where('waste_categories.id', $validated['category_id']);
            });
        }

        // Filter is_open (kasar — jam diverifikasi di PHP)
        if ($openNow) {
            $query->where('is_open', true);
        }

        // Bounding-box kasar jika ada koordinat
        if ($hasCoords) {
            $latDelta = $radiusKm / self::EARTH_RADIUS_KM * (180 / M_PI);
            $lngDelta = $radiusKm / self::EARTH_RADIUS_KM * (180 / M_PI)
                / max(cos(deg2rad($lat)), 0.0001);

            $query->whereBetween('latitude', [$lat - $latDelta, $lat + $latDelta])
                ->whereBetween('longitude', [$lng - $lngDelta, $lng + $lngDelta]);
        }

        // Ambil semua kandidat (bounding-box sudah memangkas banyak)
        $banks = $query->get();

        // ── Proses di PHP: hitung jarak, filter Haversine & jam, sort ────
        $results = [];

        foreach ($banks as $bank) {
            $distKm = null;

            if ($hasCoords) {
                $distKm = $this->haversine($lat, $lng, (float) $bank->latitude, (float) $bank->longitude);
                if ($distKm > $radiusKm) {
                    continue; // luar radius presisi
                }
            }

            $todayHours = $bank->opening_hours[$dayKey] ?? null;
            $isOpenNow = $this->isOpenNow($bank, $todayHours, $timeNow);

            if ($openNow && ! $isOpenNow) {
                continue;
            }

            $results[] = [
                'bank' => $bank,
                'distance' => $distKm,
                'is_open_now' => $isOpenNow,
                'today_hours' => $todayHours,
            ];
        }

        // Sort: dekat dulu jika ada koordinat, lain-lain urut nama
        usort($results, function ($a, $b) use ($hasCoords): int {
            if ($hasCoords) {
                return $a['distance'] <=> $b['distance'];
            }

            return strcmp($a['bank']->name, $b['bank']->name);
        });

        // ── Paginasi manual ───────────────────────────────────────────────
        $total = count($results);
        $offset = ($page - 1) * $perPage;
        $slice = array_slice($results, $offset, $perPage);

        $items = array_map(
            fn ($r) => $this->formatBank($r['bank'], $r['distance'], $r['is_open_now'], $r['today_hours']),
            $slice,
        );

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / $perPage)),
                'total' => $total,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * GET /api/user/waste-banks/{id}
     * Detail bank sampah — hanya verified.
     */
    public function show(int $id): JsonResponse
    {
        $bank = WasteBank::verified()
            ->with('acceptedCategories')
            ->findOrFail($id);

        $now = now();
        $dayKey = self::DAY_KEYS[(int) $now->format('w')];
        $timeNow = $now->format('H:i');
        $todayHours = $bank->opening_hours[$dayKey] ?? null;

        return response()->json([
            'data' => $this->formatBankDetail($bank, $todayHours, $timeNow),
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * Format data bank untuk response list (ringkas).
     */
    private function formatBank(
        WasteBank $bank,
        ?float $distanceKm,
        bool $isOpenNow,
        ?string $todayHours,
    ): array {
        return [
            'id' => $bank->id,
            'name' => $bank->name,
            'address' => $bank->address,
            'latitude' => (float) $bank->latitude,
            'longitude' => (float) $bank->longitude,
            'is_open' => $bank->is_open,
            'is_open_now' => $isOpenNow,
            'today_hours' => $todayHours,
            'distance_km' => $distanceKm !== null ? (float) round($distanceKm, 2) : null,
            'accepted_categories' => $bank->acceptedCategories->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'icon' => $c->icon,
            ])->values()->all(),
        ];
    }

    /**
     * Format detail lengkap bank sampah.
     */
    private function formatBankDetail(WasteBank $bank, ?string $todayHours, string $timeNow): array
    {
        return [
            'id' => $bank->id,
            'name' => $bank->name,
            'address' => $bank->address,
            'latitude' => (float) $bank->latitude,
            'longitude' => (float) $bank->longitude,
            'phone' => $bank->phone,
            'description' => $bank->description,
            'is_open' => $bank->is_open,
            'is_open_now' => $this->isOpenNow($bank, $todayHours, $timeNow),
            'today_hours' => $todayHours,
            'opening_hours' => $bank->opening_hours ?? [],
            'accepted_categories' => $bank->acceptedCategories->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'icon' => $c->icon,
                'points_per_kg' => $c->points_per_kg,
            ])->values()->all(),
        ];
    }

    /**
     * Periksa apakah bank sampah sedang buka berdasarkan is_open flag DAN jam operasional.
     * Format jam: "HH:MM-HH:MM" atau "Tutup".
     */
    private function isOpenNow(WasteBank $bank, ?string $todayHours, string $timeNow): bool
    {
        if (! $bank->is_open) {
            return false;
        }

        if (! $todayHours || strtolower($todayHours) === 'tutup') {
            return false;
        }

        if (! preg_match('/^(\d{2}:\d{2})-(\d{2}:\d{2})$/', $todayHours, $m)) {
            return true; // format tidak dikenali — percaya is_open flag
        }

        return $timeNow >= $m[1] && $timeNow <= $m[2];
    }

    /**
     * Hitung jarak Haversine antara dua koordinat dalam kilometer.
     * Dihitung di PHP agar kompatibel dengan SQLite dan MySQL.
     */
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return self::EARTH_RADIUS_KM * 2 * asin(sqrt($a));
    }
}
