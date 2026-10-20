<?php

namespace App\Http\Requests\WasteBank;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_code' => ['required', 'string'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.waste_category_id' => ['required', 'integer', 'exists:waste_categories,id'],
            'items.*.weight_kg' => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Minimal satu item sampah harus diisi.',
            'items.min' => 'Minimal satu item sampah harus diisi.',
            'items.*.weight_kg.min' => 'Berat harus lebih dari 0.',
            'items.*.waste_category_id.exists' => 'Kategori tidak ditemukan.',
        ];
    }
}
