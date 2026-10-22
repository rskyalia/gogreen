<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WasteCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'is_recyclable' => $this->is_recyclable,
            'is_upcyclable' => $this->is_upcyclable,
            'points_per_kg' => $this->points_per_kg,
            'icon' => $this->icon,
        ];
    }
}
