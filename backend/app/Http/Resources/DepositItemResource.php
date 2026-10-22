<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepositItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'waste_category' => new WasteCategoryResource($this->whenLoaded('wasteCategory')),
            'weight_kg' => (float) $this->weight_kg,
            'points' => $this->points,
        ];
    }
}
