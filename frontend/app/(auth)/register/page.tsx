'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, User, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { registerWasteBank, registerCommunity, getDashboardPath } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { Alert, Field, SubmitButton, TextArea } from '@/components/auth/fields';

type RegisterMode = 'user' | 'waste_bank' | 'community';

const MODE_CONFIG: Record<RegisterMode, { label: string; Icon: LucideIcon; note?: string }> = {
  user: { label: 'Warga', Icon: User },
  waste_bank: {
    label: 'Bank Sampah', Icon: Building2,
    note: 'Akun bank sampah perlu diverifikasi developer sebelum bisa login.'
  },
  community: { label: 'Komunitas', Icon: Users },
};

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<RegisterMode>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwdConf, setPwdConf] = useState('');

  // Waste bank fields
  const [wbName, setWbName] = useState('');
  const [wbAddr, setWbAddr] = useState('');
  const [wbPhone, setWbPhone] = useState('');
  const [wbLat, setWbLat] = useState('');
  const [wbLng, setWbLng] = useState('');
  const [wbDesc, setWbDesc] = useState('');

  // Community field
  const [commDesc, setCommDesc] = useState('');

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama wajib diisi.';
    if (!email.trim()) e.email = 'Email wajib diisi.';
    if (!pwd) e.password = 'Password wajib diisi.';
    else if (pwd.length < 8) e.password = 'Password minimal 8 karakter.';
    if (pwd !== pwdConf) e.password_confirmation = 'Konfirmasi password tidak cocok.';

    if (mode === 'waste_bank') {
      if (!wbName.trim()) e['waste_bank.name'] = 'Nama bank sampah wajib diisi.';
      if (!wbAddr.trim()) e['waste_bank.address'] = 'Alamat wajib diisi.';
      if (!wbPhone.trim()) e['waste_bank.phone'] = 'Telepon wajib diisi.';
      if (!wbLat || isNaN(+wbLat)) e['waste_bank.latitude'] = 'Latitude tidak valid.';
      if (!wbLng || isNaN(+wbLng)) e['waste_bank.longitude'] = 'Longitude tidak valid.';
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
    <div className="rounded-[28px] border border-line bg-white p-7 sm:p-9">
      <h1 className="font-serif text-3xl font-medium text-forest">Buat akun baru</h1>
      <p className="mt-2 text-sm text-muted">Pilih tipe akun yang ingin didaftarkan.</p>

      {/* Mode switcher */}
      <div role="group" aria-label="Tipe akun" className="mt-6 grid grid-cols-3 gap-1 rounded-xl border border-line bg-mist/60 p-1">
        {(Object.entries(MODE_CONFIG) as [RegisterMode, (typeof MODE_CONFIG)[RegisterMode]][]).map(([m, cfg]) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => { setMode(m); setErrors({}); setApiError(''); }}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors ${mode === m ? 'bg-forest text-white' : 'text-forest hover:bg-white'
              }`}
          >
            <cfg.Icon className="size-4" aria-hidden />
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3 empty:hidden">
        {apiError && <Alert tone="error">{apiError}</Alert>}
        {note && <Alert tone="warning">{note}</Alert>}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        {/* Common fields */}
        <Field id="name" label="Nama lengkap" type="text" value={name} onChange={setName}
          placeholder="Nama kamu" error={errors.name} autoComplete="name" />
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail}
          placeholder="kamu@email.com" error={errors.email} autoComplete="email" />
        <Field id="phone" label="Nomor HP (opsional)" type="tel" value={phone} onChange={setPhone}
          placeholder="08xxxxxxxxxx" autoComplete="tel" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="password" label="Password" type="password" value={pwd} onChange={setPwd}
            placeholder="Min. 8 karakter" error={errors.password} autoComplete="new-password" />
          <Field id="password_confirmation" label="Konfirmasi" type="password" value={pwdConf}
            onChange={setPwdConf} placeholder="Ulangi password"
            error={errors.password_confirmation} autoComplete="new-password" />
        </div>

        {/* Waste bank extra fields */}
        {mode === 'waste_bank' && (
          <section className="space-y-4 border-t border-line pt-5">
            <h2 className="text-sm font-semibold text-forest">Data bank sampah</h2>
            <Field id="wb_name" label="Nama bank sampah" type="text" value={wbName} onChange={setWbName}
              placeholder="Bank Sampah ..." error={errors['waste_bank.name']} />
            <TextArea id="wb_addr" label="Alamat" value={wbAddr} onChange={setWbAddr}
              placeholder="Jl. ..." error={errors['waste_bank.address']} rows={2} />
            <Field id="wb_phone" label="Telepon bank sampah" type="tel" value={wbPhone}
              onChange={setWbPhone} placeholder="021-xxxxxxx" error={errors['waste_bank.phone']} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="wb_lat" label="Latitude" type="text" value={wbLat} onChange={setWbLat}
                placeholder="-6.xxxxx" error={errors['waste_bank.latitude']} />
              <Field id="wb_lng" label="Longitude" type="text" value={wbLng} onChange={setWbLng}
                placeholder="106.xxxxx" error={errors['waste_bank.longitude']} />
            </div>
            <TextArea id="wb_desc" label="Deskripsi (opsional)" value={wbDesc} onChange={setWbDesc}
              placeholder="Deskripsi singkat..." rows={2} />
          </section>
        )}

        {mode === 'community' && (
          <section className="space-y-4 border-t border-line pt-5">
            <h2 className="text-sm font-semibold text-forest">Info komunitas</h2>
            <TextArea id="comm_desc" label="Deskripsi komunitas (opsional)" value={commDesc}
              onChange={setCommDesc} placeholder="Ceritakan tentang komunitas DIY kamu..." rows={2} />
          </section>
        )}

        <div className="pt-2">
          <SubmitButton loading={isLoading}>
            {isLoading ? 'Mendaftar...' : `Daftar sebagai ${MODE_CONFIG[mode].label}`}
          </SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-semibold text-forest underline underline-offset-4">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}