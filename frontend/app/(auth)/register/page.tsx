'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerWasteBank, registerCommunity, getDashboardPath } from '@/lib/auth';
import type { ApiError } from '@/lib/api';

type RegisterMode = 'user' | 'waste_bank' | 'community';

const MODE_CONFIG: Record<RegisterMode, { label: string; emoji: string; note?: string }> = {
  user:       { label: 'Warga',       emoji: '🙋' },
  waste_bank: { label: 'Bank Sampah', emoji: '🏦',
    note: '⚠️ Akun bank sampah perlu diverifikasi developer sebelum bisa login.' },
  community:  { label: 'Komunitas',   emoji: '🌱' },
};

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [mode, setMode]           = useState<RegisterMode>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError]   = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});

  // Common fields
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [pwd, setPwd]           = useState('');
  const [pwdConf, setPwdConf]   = useState('');

  // Waste bank fields
  const [wbName, setWbName]     = useState('');
  const [wbAddr, setWbAddr]     = useState('');
  const [wbPhone, setWbPhone]   = useState('');
  const [wbLat, setWbLat]       = useState('');
  const [wbLng, setWbLng]       = useState('');
  const [wbDesc, setWbDesc]     = useState('');

  // Community field
  const [commDesc, setCommDesc] = useState('');

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim())  e.name     = 'Nama wajib diisi.';
    if (!email.trim()) e.email    = 'Email wajib diisi.';
    if (!pwd)          e.password = 'Password wajib diisi.';
    else if (pwd.length < 8) e.password = 'Password minimal 8 karakter.';
    if (pwd !== pwdConf) e.password_confirmation = 'Konfirmasi password tidak cocok.';

    if (mode === 'waste_bank') {
      if (!wbName.trim())             e['waste_bank.name']    = 'Nama bank sampah wajib diisi.';
      if (!wbAddr.trim())             e['waste_bank.address'] = 'Alamat wajib diisi.';
      if (!wbPhone.trim())            e['waste_bank.phone']   = 'Telepon wajib diisi.';
      if (!wbLat || isNaN(+wbLat))   e['waste_bank.latitude']  = 'Latitude tidak valid.';
      if (!wbLng || isNaN(+wbLng))   e['waste_bank.longitude'] = 'Longitude tidak valid.';
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
      let user;
      const base = { name, email, password: pwd, password_confirmation: pwdConf, phone: phone || undefined };

      if (mode === 'user') {
        await register(base);   // AuthContext handle redirect
        return;
      }

      if (mode === 'waste_bank') {
        user = await registerWasteBank({
          ...base,
          waste_bank: {
            name: wbName, address: wbAddr, phone: wbPhone,
            latitude: +wbLat, longitude: +wbLng,
            description: wbDesc || undefined,
            opening_hours: {
              senin: '08:00-17:00', selasa: '08:00-17:00', rabu: '08:00-17:00',
              kamis: '08:00-17:00', jumat: '08:00-15:00', sabtu: '08:00-12:00',
              minggu: 'Tutup',
            },
          },
        });
      } else {
        user = await registerCommunity({
          ...base,
          community: { description: commDesc || undefined },
        });
      }

      router.push(getDashboardPath(user.role));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        const mapped: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(apiErr.errors)) mapped[k] = msgs[0];
        setErrors(mapped);
      } else {
        setApiError(apiErr.message ?? 'Registrasi gagal. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const note = MODE_CONFIG[mode].note;

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Buat Akun Baru</h2>
      <p className="text-sm text-gray-500 mb-5">Pilih tipe akun yang ingin didaftarkan.</p>

      {/* Mode switcher */}
      <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
        {(Object.entries(MODE_CONFIG) as [RegisterMode, typeof MODE_CONFIG[RegisterMode]][]).map(([m, cfg]) => (
          <button
            key={m} type="button"
            onClick={() => { setMode(m); setErrors({}); setApiError(''); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition
              ${mode === m ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {apiError}
        </div>
      )}

      {note && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          {note}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Common fields */}
        <Field id="name"  label="Nama Lengkap"     type="text"  value={name}  onChange={setName}
          placeholder="Nama kamu" error={errors.name} autoComplete="name" />
        <Field id="email" label="Email"             type="email" value={email} onChange={setEmail}
          placeholder="kamu@email.com" error={errors.email} autoComplete="email" />
        <Field id="phone" label="Nomor HP (opsional)" type="tel" value={phone} onChange={setPhone}
          placeholder="08xxxxxxxxxx" autoComplete="tel" />
        <div className="grid grid-cols-2 gap-3">
          <Field id="password" label="Password" type="password" value={pwd} onChange={setPwd}
            placeholder="Min. 8 karakter" error={errors.password} autoComplete="new-password" />
          <Field id="password_confirmation" label="Konfirmasi" type="password" value={pwdConf}
            onChange={setPwdConf} placeholder="Ulangi password"
            error={errors.password_confirmation} autoComplete="new-password" />
        </div>

        {/* Waste bank extra fields */}
        {mode === 'waste_bank' && (
          <section className="pt-3 border-t border-gray-100 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data Bank Sampah</p>
            <Field id="wb_name"  label="Nama Bank Sampah" type="text" value={wbName} onChange={setWbName}
              placeholder="Bank Sampah ..." error={errors['waste_bank.name']} />
            <div>
              <label htmlFor="wb_addr" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea id="wb_addr" rows={2} value={wbAddr} onChange={(e) => setWbAddr(e.target.value)}
                placeholder="Jl. ..."
                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition
                  focus:ring-2 focus:ring-green-500 focus:border-transparent
                  ${errors['waste_bank.address'] ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
              />
              {errors['waste_bank.address'] && (
                <p className="mt-1 text-xs text-red-600">{errors['waste_bank.address']}</p>
              )}
            </div>
            <Field id="wb_phone" label="Telepon Bank Sampah" type="tel" value={wbPhone}
              onChange={setWbPhone} placeholder="021-xxxxxxx" error={errors['waste_bank.phone']} />
            <div className="grid grid-cols-2 gap-3">
              <Field id="wb_lat" label="Latitude"  type="text" value={wbLat} onChange={setWbLat}
                placeholder="-6.xxxxx" error={errors['waste_bank.latitude']} />
              <Field id="wb_lng" label="Longitude" type="text" value={wbLng} onChange={setWbLng}
                placeholder="106.xxxxx" error={errors['waste_bank.longitude']} />
            </div>
            <div>
              <label htmlFor="wb_desc" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi (opsional)
              </label>
              <textarea id="wb_desc" rows={2} value={wbDesc} onChange={(e) => setWbDesc(e.target.value)}
                placeholder="Deskripsi singkat..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </section>
        )}

        {/* Community extra field */}
        {mode === 'community' && (
          <section className="pt-3 border-t border-gray-100 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Info Komunitas</p>
            <div>
              <label htmlFor="comm_desc" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi Komunitas (opsional)
              </label>
              <textarea id="comm_desc" rows={2} value={commDesc} onChange={(e) => setCommDesc(e.target.value)}
                placeholder="Ceritakan tentang komunitas DIY kamu..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </section>
        )}

        <button
          type="submit" disabled={isLoading}
          className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700
            disabled:bg-green-400 disabled:cursor-not-allowed
            text-white text-sm font-semibold transition mt-1"
        >
          {isLoading ? 'Mendaftar...' : `Daftar sebagai ${MODE_CONFIG[mode].label}`}
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

function Field({
  id, label, type, value, onChange, placeholder, error, autoComplete,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  error?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={id} type={type} value={value} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 outline-none transition
          focus:ring-2 focus:ring-green-500 focus:border-transparent
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
