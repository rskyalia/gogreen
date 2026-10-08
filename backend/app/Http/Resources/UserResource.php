<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'email'        => $this->email,
            'role'         => $this->role,
            'phone'        => $this->phone,
            'avatar'       => $this->avatar
                ? asset('storage/' . $this->avatar)
                : null,
            'total_points' => $this->total_points,
            'is_active'    => $this->is_active,
            'created_at'   => $this->created_at?->toISOString(),

            // Relasi kondisional — hanya dimuat jika sudah di-load
            'waste_bank' => $this->when(
                $this->relationLoaded('wasteBank'),
                fn () => new WasteBankResource($this->wasteBank)
            ),
        ];
    }
}
