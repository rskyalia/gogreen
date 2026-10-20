<?php

namespace App\Http\Requests\WasteBank;

use Illuminate\Foundation\Http\FormRequest;

class SyncCategoriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_ids' => ['required', 'array'],
            'category_ids.*' => ['integer', 'exists:waste_categories,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_ids.required' => 'Pilih setidaknya satu kategori.',
        ];
    }
}
