<?php

namespace App\Http\Requests\WasteBank;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Salah satu token QR atau member_code wajib ada
            'token' => ['required_without:member_code', 'nullable', 'string', 'size:32', 'regex:/^[A-Za-z0-9]{32}$/'],
            'member_code' => ['required_without:token', 'nullable', 'string', 'regex:/^GG-[A-Z0-9]{6}$/i'],

            'notes' => ['nullable', 'string', 'max:500'],
            'client_request_id' => ['required', 'uuid'],

            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.waste_category_id' => ['required', 'integer', 'exists:waste_categories,id', 'distinct'],
            'items.*.weight_kg' => ['required', 'numeric', 'min:0.01', 'max:500', 'decimal:0,2'],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required_without' => 'Token QR atau kode member harus diisi.',
            'member_code.required_without' => 'Token QR atau kode member harus diisi.',
            'token.size' => 'Token QR tidak valid.',
            'token.regex' => 'Token QR tidak valid.',
            'member_code.regex' => 'Format kode member tidak valid (contoh: GG-AB12CD).',
            'client_request_id.required' => 'client_request_id wajib diisi.',
            'client_request_id.uuid' => 'client_request_id harus berformat UUID.',
            'items.required' => 'Minimal satu item sampah harus diisi.',
            'items.min' => 'Minimal satu item sampah harus diisi.',
            'items.max' => 'Maksimal 20 item per setoran.',
            'items.*.weight_kg.min' => 'Berat harus lebih dari 0.',
            'items.*.weight_kg.max' => 'Berat per item maksimal 500 kg.',
            'items.*.weight_kg.decimal' => 'Berat maksimal 2 desimal.',
            'items.*.waste_category_id.exists' => 'Kategori tidak ditemukan.',
            'items.*.waste_category_id.distinct' => 'Tidak boleh ada kategori yang sama dalam satu setoran. Gabungkan berat kategori yang sama.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        $errors = $validator->errors();
        $isTokenError = $errors->has('token');

        throw new HttpResponseException(response()->json([
            'message' => $isTokenError
                ? 'Token QR tidak valid.'
                : 'Data setoran tidak valid.',
            'code' => $isTokenError ? 'token_invalid' : 'validation_error',
            'errors' => $errors,
        ], 422));
    }
}
