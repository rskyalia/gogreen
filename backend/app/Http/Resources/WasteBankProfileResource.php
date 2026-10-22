<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full profile resource untuk petugas bank sampah sendiri.
 * Berbeda dari WasteBankResource (publik) — ini menyertakan
 * verification_status, alasan penolakan, dan accepted_categories.
 */
class WasteBankProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'phone' => $this->phone,
            'description' => $this->description,
            'opening_hours' => $this->opening_hours ?? [],
            'is_open' => $this->is_open,
            'verification_status' => $this->verification_status,
            // Diisi dari database; null jika belum ada penolakan
            'rejection_reason' => $this->rejection_reason ?? null,
            'accepted_categories' => WasteCategoryResource::collection(
                $this->whenLoaded('acceptedCategories')
            ),
        ];
    }
}
