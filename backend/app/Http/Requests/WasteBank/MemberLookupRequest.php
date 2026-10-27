<?php

namespace App\Http\Requests\WasteBank;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validasi lookup member oleh petugas bank sampah.
 *
 * Mode token (QR) dan mode code (member_code manual) tidak boleh kosong
 * keduanya. Token wajib tepat 32 karakter.
 */
class MemberLookupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'token' => ['nullable', 'string', 'size:32'],
            'code' => ['nullable', 'string', 'regex:/^GG-[A-Z0-9]{6}$/i'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'token.size' => 'Token QR tidak valid.',
            'code.regex' => 'Format kode member tidak valid (contoh: GG-AB12CD).',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Token QR atau kode member tidak valid.',
            'code' => 'token_invalid',
            'errors' => $validator->errors(),
        ], 422));
    }

    /**
     * Pastikan salah satu parameter tersedia.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $token = $this->query('token');
            $code = $this->query('code');

            if (blank($token) && blank($code)) {
                $validator->errors()->add(
                    'token',
                    'Parameter token atau code wajib diisi.',
                );
            }
        });
    }
}
