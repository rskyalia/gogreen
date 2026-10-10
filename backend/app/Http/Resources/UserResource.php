<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'role'           => $this->role,
            'phone'          => $this->phone,
            'avatar'         => $this->avatar
                ? asset('storage/' . $this->avatar)
                : null,
            'member_code'    => $this->member_code,
            'points_balance' => $this->points_balance,
            'status'         => $this->status,
            'created_at'     => $this->created_at?->toISOString(),

            // Hanya dimuat jika relasi sudah di-load
            'waste_bank' => $this->when(
                $this->relationLoaded('wasteBank'),
                fn () => $this->wasteBank
                    ? new WasteBankResource($this->wasteBank)
                    : null
            ),
        ];
    }
}
