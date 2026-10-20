<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'waste_category' => new WasteCategoryResource($this->whenLoaded('wasteCategory')),
            'quantity_needed_kg' => (float) $this->quantity_needed_kg,
            'notes' => $this->notes,
            'status' => $this->status,
            'community' => $this->whenLoaded('community', fn () => [
                'id' => $this->community->id,
                'name' => $this->community->name,
            ]),
            'responses_count' => $this->when(
                isset($this->responses_count),
                $this->responses_count
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
