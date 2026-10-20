<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepositResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'member' => new MemberResource($this->whenLoaded('depositor')),
            'recorded_by' => $this->whenLoaded('recorder', fn () => [
                'id' => $this->recorder->id,
                'name' => $this->recorder->name,
            ]),
            'notes' => $this->notes,
            'total_weight_kg' => (float) $this->total_weight_kg,
            'total_points' => $this->total_points,
            'items' => DepositItemResource::collection(
                $this->whenLoaded('items')
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
