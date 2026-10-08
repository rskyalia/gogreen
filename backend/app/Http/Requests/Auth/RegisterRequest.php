<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // User fields
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone'    => ['nullable', 'string', 'max:20'],

            // Waste bank registration (role auto = waste_bank jika diisi)
            'waste_bank'                       => ['sometimes', 'array'],
            'waste_bank.name'                  => ['required_with:waste_bank', 'string', 'max:255'],
            'waste_bank.address'               => ['required_with:waste_bank', 'string'],
            'waste_bank.latitude'              => ['required_with:waste_bank', 'numeric', 'between:-90,90'],
            'waste_bank.longitude'             => ['required_with:waste_bank', 'numeric', 'between:-180,180'],
            'waste_bank.phone'                 => ['required_with:waste_bank', 'string', 'max:20'],
            'waste_bank.operating_hours'       => ['required_with:waste_bank', 'array'],
            'waste_bank.description'           => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'                        => 'Email sudah terdaftar.',
            'password.confirmed'                  => 'Konfirmasi password tidak cocok.',
            'waste_bank.name.required_with'       => 'Nama bank sampah wajib diisi.',
            'waste_bank.address.required_with'    => 'Alamat bank sampah wajib diisi.',
            'waste_bank.latitude.required_with'   => 'Koordinat latitude wajib diisi.',
            'waste_bank.longitude.required_with'  => 'Koordinat longitude wajib diisi.',
            'waste_bank.phone.required_with'      => 'Nomor telepon bank sampah wajib diisi.',
            'waste_bank.operating_hours.required_with' => 'Jam operasional bank sampah wajib diisi.',
        ];
    }
}
