<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'waste_bank_id' => ['required', 'integer', 'exists:waste_banks,id'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.waste_category_id' => ['required', 'integer', 'exists:waste_categories,id'],
            'items.*.weight_kg' => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public function messages(): array
    {
        return [
            'waste_bank_id.required' => 'Bank sampah harus dipilih.',
            'waste_bank_id.exists' => 'Bank sampah tidak ditemukan.',
            'items.required' => 'Minimal satu item sampah harus diisi.',
            'items.min' => 'Minimal satu item sampah harus diisi.',
            'items.*.weight_kg.min' => 'Berat harus lebih dari 0.',
            'items.*.waste_category_id.exists' => 'Kategori tidak ditemukan.',
        ];
    }
}
