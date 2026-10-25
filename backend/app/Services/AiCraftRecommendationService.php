<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AiCraftRecommendationService
 *
 * Menghasilkan rekomendasi karya/kerajinan dari bahan sampah
 * menggunakan Google Gemini API.
 *
 * Setiap rekomendasi berisi:
 *  - title       : judul karya (misal "Pot Tanaman dari Botol Bekas")
 *  - description : penjelasan singkat manfaat dan hasilnya
 *  - difficulty  : easy | medium | hard
 *  - materials   : array bahan-bahan tambahan yang dibutuhkan
 *  - steps       : array langkah singkat pembuatan
 *  - tips        : tips singkat agar hasil maksimal
 */
class AiCraftRecommendationService
{
    /** @var string Gemini API base URL */
    private string $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

    /** @var string Gemini API key dari config/env */
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY', ''));
    }

    /**
     * Dapatkan rekomendasi karya berbasis AI.
     *
     * @param  string  $objectName  Nama objek yang terdeteksi (misal "botol plastik PET")
     * @param  string  $material  Material sampah (misal "plastik", "kertas", "kaca")
     * @param  string  $wasteType  Jenis sampah: recyclable | organic | residue
     * @return array{recommendations: array<int, array{title: string, description: string, difficulty: string, materials: string[], steps: string[], tips: string}>, summary: string}
     *
     * @throws \RuntimeException Jika API tidak dapat dihubungi
     */
    public function recommend(string $objectName, string $material, string $wasteType): array
    {
        if (empty($this->apiKey)) {
            throw new \RuntimeException('GEMINI_API_KEY belum dikonfigurasi.');
        }

        $prompt = $this->buildPrompt($objectName, $material, $wasteType);

        $response = Http::timeout(20)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post("{$this->apiUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 1500,
                    'responseMimeType' => 'application/json',
                ],
            ]);

        if (! $response->successful()) {
            $errorMessage = $response->json('error.message') ?? "HTTP {$response->status()}";
            Log::error('Gemini API error saat rekomendasi karya', [
                'status' => $response->status(),
                'message' => $errorMessage,
                'object' => $objectName,
            ]);
            throw new \RuntimeException("AI API error: {$errorMessage}");
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text', '');

        return $this->parseResponse($text);
    }

    /**
     * Bangun prompt yang dikirim ke Gemini.
     */
    private function buildPrompt(string $objectName, string $material, string $wasteType): string
    {
        $wasteTypeLabel = match ($wasteType) {
            'organic' => 'organik',
            'residue' => 'residu',
            default => 'daur ulang (recyclable)',
        };

        return <<<PROMPT
Kamu adalah asisten kreatif daur ulang sampah. Berikan 3 rekomendasi karya/kerajinan kreatif yang bisa dibuat dari sampah berikut:

Objek terdeteksi: {$objectName}
Material: {$material}
Jenis sampah: {$wasteTypeLabel}

Berikan respons HANYA dalam format JSON berikut (tanpa penjelasan lain):
{
  "summary": "Satu kalimat ringkasan potensi olahan dari sampah ini",
  "recommendations": [
    {
      "title": "Nama karya yang menarik",
      "description": "Penjelasan 1-2 kalimat tentang karya ini dan manfaatnya",
      "difficulty": "easy|medium|hard",
      "materials": ["bahan tambahan 1", "bahan tambahan 2"],
      "steps": ["langkah 1", "langkah 2", "langkah 3"],
      "tips": "Satu tips agar hasilnya maksimal"
    }
  ]
}

Catatan penting:
- Gunakan Bahasa Indonesia yang ringan dan mudah dipahami
- Karya harus realistis bisa dibuat di rumah tanpa alat khusus
- Difficulty: easy = mudah (< 30 menit), medium = sedang (1-2 jam), hard = butuh keterampilan lebih
- steps maksimal 5 langkah singkat per karya
- Prioritaskan karya yang paling bermanfaat dan populer di Indonesia
PROMPT;
    }

    /**
     * Parse JSON dari respons Gemini.
     *
     * @return array{recommendations: array, summary: string}
     */
    private function parseResponse(string $text): array
    {
        // Gemini kadang membungkus JSON dalam ```json ... ``` — strip markdown fence
        $cleaned = preg_replace('/^```(?:json)?\s*/m', '', $text);
        $cleaned = preg_replace('/^```\s*$/m', '', $cleaned ?? $text);
        $cleaned = trim($cleaned ?? $text);

        $parsed = json_decode($cleaned, true);

        if (json_last_error() !== JSON_ERROR_NONE || ! isset($parsed['recommendations'])) {
            Log::warning('Gagal parse respons Gemini', ['raw' => $text]);
            throw new \RuntimeException('Respons AI tidak valid. Silakan coba lagi.');
        }

        return [
            'summary' => $parsed['summary'] ?? '',
            'recommendations' => array_slice($parsed['recommendations'], 0, 3),
        ];
    }
}
