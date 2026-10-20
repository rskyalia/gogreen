<?php

namespace App\Http\Requests\WasteBank;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // akses sudah dijaga oleh middleware role:waste_bank
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'phone' => ['required', 'string', 'max:30'],
            'description' => ['nullable', 'string'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'opening_hours' => ['required', 'array'],
            'opening_hours.*' => ['string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'latitude.between' => 'Latitude harus antara -90 dan 90.',
            'longitude.between' => 'Longitude harus antara -180 dan 180.',
            'opening_hours.required' => 'Jam buka wajib diisi.',
        ];
    }
}
