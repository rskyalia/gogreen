<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Data kartu member milik user yang sedang login.
 * Tidak pernah dipakai untuk response ke petugas bank sampah.
 */
class MemberCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar
                ? asset('storage/'.$this->avatar)
                : null,
            'member_code' => $this->member_code,
            'points_balance' => $this->points_balance,
        ];
    }
}
