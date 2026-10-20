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
            // Harus ada salah satu: member_code (GG-XXXXXX) atau member_token (32 kar)
            'member_code' => ['required_without:member_token', 'nullable', 'string'],
            'member_token' => ['required_without:member_code', 'nullable', 'string', 'size:32'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.waste_category_id' => ['required', 'integer', 'exists:waste_categories,id'],
            'items.*.weight_kg' => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public function messages(): array
    {
        return [
            'member_code.required_without' => 'Kode member atau token QR harus diisi.',
            'member_token.required_without' => 'Kode member atau token QR harus diisi.',
            'member_token.size' => 'Token QR tidak valid.',
            'items.required' => 'Minimal satu item sampah harus diisi.',
            'items.min' => 'Minimal satu item sampah harus diisi.',
            'items.*.weight_kg.min' => 'Berat harus lebih dari 0.',
            'items.*.waste_category_id.exists' => 'Kategori tidak ditemukan.',
        ];
    }
}
