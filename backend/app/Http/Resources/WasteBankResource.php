<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WasteBankResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'address'         => $this->address,
            'latitude'        => (float) $this->latitude,
            'longitude'       => (float) $this->longitude,
            'phone'           => $this->phone,
            'operating_hours' => $this->operating_hours,
            'description'     => $this->description,
            'is_active'       => $this->is_active,
            'is_verified'     => $this->is_verified,
        ];
    }
}
