<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representasi minimal seorang anggota (role=user).
 * Hanya berisi data yang aman untuk ditampilkan oleh petugas bank sampah.
 * Email dan nomor telepon TIDAK disertakan.
 */
class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'member_code' => $this->member_code,
            'avatar' => $this->avatar
                ? asset('storage/'.$this->avatar)
                : null,
        ];
    }
}
