<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialRequestResponseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'material_request_id' => $this->material_request_id,
            'material_request' => new MaterialRequestResource(
                $this->whenLoaded('materialRequest')
            ),
            'quantity_offered_kg' => (float) $this->quantity_offered_kg,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
