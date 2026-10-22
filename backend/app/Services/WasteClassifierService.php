<?php

namespace App\Services;

use App\Models\MlApiLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * WasteClassifierService
 *
 * Wrapper untuk pemanggilan API ML deteksi sampah.
 * Setiap pemanggilan dicatat di ml_api_logs.
 * Pencatatan log TIDAK boleh menggagalkan scan jika log gagal disimpan.
 */
class WasteClassifierService
{
    private string $baseUrl;

    private string $modelName;

    public function __construct()
    {
        $this->baseUrl = config('services.ml_api.url', env('ML_API_URL', 'http://localhost:5000'));
        $this->modelName = config('services.ml_api.model', env('ML_API_MODEL', 'waste-classifier-v1'));
    }

    /**
     * Klasifikasikan gambar sampah via API ML.
     *
     * @param  string  $imagePath  Path file gambar (storage)
     * @param  int|null  $wasteScanId  ID WasteScan terkait untuk relasi log
     * @return array Raw result dari API ML
     *
     * @throws \RuntimeException Jika API ML tidak bisa dihubungi atau mengembalikan error
     */
    public function classify(string $imagePath, ?int $wasteScanId = null): array
    {
        $startTime = microtime(true);

        try {
            $response = Http::timeout(15)
                ->attach('image', file_get_contents(storage_path("app/{$imagePath}")), basename($imagePath))
                ->post("{$this->baseUrl}/classify");

            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

            if (! $response->successful()) {
                $errorMessage = $response->json('message') ?? "HTTP {$response->status()}";

                $this->logCall(
                    wasteScanId: $wasteScanId,
                    status: 'error',
                    responseTimeMs: $responseTimeMs,
                    confidence: null,
                    errorMessage: $errorMessage,
                );

                throw new \RuntimeException("ML API error: {$errorMessage}");
            }

            $result = $response->json();
            $confidence = isset($result['confidence']) ? (float) $result['confidence'] : null;

            $this->logCall(
                wasteScanId: $wasteScanId,
                status: 'success',
                responseTimeMs: $responseTimeMs,
                confidence: $confidence,
                errorMessage: null,
            );

            return $result;
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

            $this->logCall(
                wasteScanId: $wasteScanId,
                status: 'error',
                responseTimeMs: $responseTimeMs,
                confidence: null,
                errorMessage: $e->getMessage(),
            );

            throw new \RuntimeException("ML API tidak dapat dihubungi: {$e->getMessage()}");
        }
    }

    /**
     * Catat hasil pemanggilan ke ml_api_logs.
     * Error saat mencatat log tidak boleh mempengaruhi flow utama.
     */
    private function logCall(
        ?int $wasteScanId,
        string $status,
        int $responseTimeMs,
        ?float $confidence,
        ?string $errorMessage,
    ): void {
        try {
            MlApiLog::create([
                'waste_scan_id' => $wasteScanId,
                'model_name' => $this->modelName,
                'status' => $status,
                'response_time_ms' => $responseTimeMs,
                'confidence' => $confidence,
                'error_message' => $errorMessage,
            ]);
        } catch (\Throwable $e) {
            // Log ke file agar tidak hilang, tapi jangan lempar exception
            Log::warning('Gagal menyimpan ml_api_log', [
                'error' => $e->getMessage(),
                'waste_scan_id' => $wasteScanId,
                'status' => $status,
                'response_time_ms' => $responseTimeMs,
            ]);
        }
    }
}
