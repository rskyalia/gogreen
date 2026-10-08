'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { registerWasteBank } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import type { ApiError } from '@/lib/api';

type RegisterMode = 'citizen' | 'waste_bank';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [mode, setMode]   = useState<RegisterMode>('citizen');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError]   = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});

  // Common fields
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [password, setPassword]   = useState('');
  const [passwordConf, setPasswordConf] = useState('');

  // Waste bank fields
  const [wbName, setWbName]         = useState('');
  const [wbAddress, setWbAddress]   = useState('');
  const [wbPhone, setWbPhone]       = useState('');
  const [wbLat, setWbLat]           = useState('');
  const [wbLng, setWbLng]           = useState('');
  const [wbDesc, setWbDesc]         = useState('');

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama wajib diisi.';
    if (!email.trim()) e.email = 'Email wajib diisi.';
    if (!password) e.password = 'Password wajib diisi.';
    else if (password.length < 8) e.password = 'Password minimal 8 karakter.';
    if (password !== passwordConf) e.password_confirmation = 'Konfirmasi password tidak cocok.';

    if (mode === 'waste_bank') {
      if (!wbName.trim()) e['waste_bank.name'] = 'Nama bank sampah wajib diisi.';
      if (!wbAddress.trim()) e['waste_bank.address'] = 'Alamat wajib diisi.';
      if (!wbPhone.trim()) e['waste_bank.phone'] = 'Nomor telepon wajib diisi.';
      if (!wbLat || isNaN(Number(wbLat))) e['waste_bank.latitude'] = 'Latitude tidak valid.';
      if (!wbLng || isNaN(Number(wbLng))) e['waste_bank.longitude'] = 'Longitude tidak valid.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (mode === 'citizen') {
        await register({ name, email, password, password_confirmation: passwordConf, phone: phone || undefined });
      } else {
        await registerWasteBank({
          name,
          email,
          password,
          password_confirmation: passwordConf,
          phone: phone || undefined,
          waste_bank: {
            name: wbName,
            address: wbAddress,
            phone: wbPhone,
            latitude: Number(wbLat),
            longitude: Number(wbLng),
            description: wbDesc || undefined,
            operating_hours: {
              senin: '08:00-17:00',
              selasa: '08:00-17:00',
              rabu: '08:00-17:00',
              kamis: '08:00-17:00',
              jumat: '08:00-15:00',
              sabtu: '08:00-12:00',
              minggu: 'Tutup',
            },
          },
        });
        // waste_bank redirect ke /waste-bank/dashboard setelah AuthContext set user
        router.push('/waste-bank/dashboard');
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(apiErr.errors)) {
          mapped[key] = messages[0];
        }
        setErrors(mapped);
      } else {
        setApiError(apiErr.message ?? 'Registrasi gagal. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Buat Akun Baru</h2>
      <p className="text-sm text-gray-500 mb-5">Pilih tipe akun yang ingin didaftarkan.</p>

      {/* Mode switcher */}
      <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
        {(['citizen', 'waste_bank'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setErrors({}); setApiError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition
              ${mode === m
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {m === 'citizen' ? '🙋 Warga' : '🏦 Bank Sampah'}
          </button>
        ))}
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {apiError}
        </div>
      )}

      {mode === 'waste_bank' && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          ⚠️ Akun bank sampah perlu diverifikasi admin sebelum dapat digunakan.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* ── Data Pribadi ── */}
        <Field label="Nama Lengkap" id="name" type="text" value={name} onChange={setName}
          placeholder="Nama kamu" error={errors.name} autoComplete="name" />

        <Field label="Email" id="email" type="email" value={email} onChange={setEmail}
          placeholder="kamu@email.com" error={errors.email} autoComplete="email" />

        <Field label="Nomor HP (opsional)" id="phone" type="tel" value={phone} onChange={setPhone}
          placeholder="08xxxxxxxxxx" error={errors.phone} autoComplete="tel" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" id="password" type="password" value={password} onChange={setPassword}
            placeholder="Min. 8 karakter" error={errors.password} autoComplete="new-password" />
          <Field label="Konfirmasi Password" id="password_confirmation" type="password"
            value={passwordConf} onChange={setPasswordConf}
            placeholder="Ulangi password" error={errors.password_confirmation}
            autoComplete="new-password" />
        </div>

        {/* ── Data Bank Sampah ── */}
        {mode === 'waste_bank' && (
          <div className="pt-3 mt-1 border-t border-gray-100 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Data Bank Sampah
            </p>

            <Field label="Nama Bank Sampah" id="wb_name" type="text" value={wbName}
              onChange={setWbName} placeholder="Bank Sampah ..." error={errors['waste_bank.name']} />

            <div>
              <label htmlFor="wb_address" className="block text-sm font-medium text-gray-700 mb-1">
                Alamat
              </label>
              <textarea
                id="wb_address"
                value={wbAddress}
                onChange={(e) => setWbAddress(e.target.value)}
                rows={2}
                placeholder="Jl. ..."
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition resize-none
                  focus:ring-2 focus:ring-green-500 focus:border-transparent
                  ${errors['waste_bank.address'] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors['waste_bank.address'] && (
                <p className="mt-1 text-xs text-red-600">{errors['waste_bank.address']}</p>
              )}
            </div>

            <Field label="Telepon Bank Sampah" id="wb_phone" type="tel" value={wbPhone}
              onChange={setWbPhone} placeholder="021-xxxxxxx" error={errors['waste_bank.phone']} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" id="wb_lat" type="text" value={wbLat} onChange={setWbLat}
                placeholder="-6.xxxxx" error={errors['waste_bank.latitude']} />
              <Field label="Longitude" id="wb_lng" type="text" value={wbLng} onChange={setWbLng}
                placeholder="106.xxxxx" error={errors['waste_bank.longitude']} />
            </div>

            <div>
              <label htmlFor="wb_desc" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi (opsional)
              </label>
              <textarea
                id="wb_desc"
                value={wbDesc}
                onChange={(e) => setWbDesc(e.target.value)}
                rows={2}
                placeholder="Deskripsi singkat bank sampah..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none transition resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700
            disabled:bg-green-400 disabled:cursor-not-allowed
            text-white text-sm font-semibold transition mt-2"
        >
          {isLoading ? 'Mendaftar...' : mode === 'citizen' ? 'Daftar sebagai Warga' : 'Daftar Bank Sampah'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-green-600 hover:underline font-medium">
          Masuk di sini
        </Link>
      </p>
    </>
  );
}

// ── Reusable Field component (local) ──────────────────────────────────────

function Field({
  label, id, type, value, onChange, placeholder, error, autoComplete,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
          focus:ring-2 focus:ring-green-500 focus:border-transparent
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
