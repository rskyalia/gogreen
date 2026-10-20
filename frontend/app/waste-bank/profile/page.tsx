'use client';

/**
 * /waste-bank/profile
 * Form profil bank sampah: data umum, map picker koordinat,
 * editor jam buka, checklist kategori, toggle buka/tutup, banner verifikasi.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  PageHeader, Card, CardDivider, Button,
  Input, Textarea, Select,
  ConfirmModal, StatusBadge,
  useToast,
} from '@/components/ui';
import { api, firstError } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Save, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle, XCircle,
} from 'lucide-react';

// ── Leaflet dimuat lazily (butuh window) ──────────────────────────────────

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-52 w-full animate-pulse rounded-xl bg-mist" aria-hidden="true" />
  ),
});

// ── Types ─────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  slug: string;
  is_recyclable: boolean;
}

interface ProfileData {
  id: number;
  name: string;
  address: string;
  phone: string;
  description: string | null;
  latitude: number;
  longitude: number;
  opening_hours: Record<string, string>;
  is_open: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  accepted_categories: Category[];
}

const DAYS = [
  { key: 'senin',   label: 'Senin'   },
  { key: 'selasa',  label: 'Selasa'  },
  { key: 'rabu',    label: 'Rabu'    },
  { key: 'kamis',   label: 'Kamis'   },
  { key: 'jumat',   label: 'Jumat'   },
  { key: 'sabtu',   label: 'Sabtu'   },
  { key: 'minggu',  label: 'Minggu'  },
];

const CLOSED_VALUE = 'Tutup';

// ── Page ──────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const { toast }       = useToast();

  const [profile, setProfile]             = useState<ProfileData | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading]         = useState(true);

  // Form state
  const [name, setName]               = useState('');
  const [address, setAddress]         = useState('');
  const [phone, setPhone]             = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat]                 = useState(-6.2);
  const [lng, setLng]                 = useState(106.8);
  const [hours, setHours]             = useState<Record<string, string>>({});
  const [selectedCats, setSelectedCats] = useState<Set<number>>(new Set());

  // UI state
  const [saving, setSaving]           = useState(false);
  const [savingCats, setSavingCats]   = useState(false);
  const [showToggle, setShowToggle]   = useState(false);
  const [toggling, setToggling]       = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data: p }, { data: cats }] = await Promise.all([
        api.get<{ data: ProfileData }>('/waste-bank/profile'),
        api.get<{ data: Category[] }>('/waste-bank/categories/available'),
      ]);
      setProfile(p);
      setAllCategories(cats);
      setName(p.name);
      setAddress(p.address);
      setPhone(p.phone);
      setDescription(p.description ?? '');
      setLat(p.latitude);
      setLng(p.longitude);
      setHours(p.opening_hours ?? {});
      setSelectedCats(new Set(p.accepted_categories.map((c) => c.id)));
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // ── Save profile ──────────────────────────────────────────────────────

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSaving(true);
    try {
      const { data: updated } = await api.put<{ data: ProfileData; message: string }>(
        '/waste-bank/profile',
        { name, address, phone, description: description || null, latitude: lat, longitude: lng, opening_hours: hours },
      );
      setProfile(updated);
      toast('Profil berhasil disimpan.', 'success');
    } catch (err) {
      const e = err as ApiError;
      if (e.errors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(e.errors)) flat[k] = v[0];
        setFieldErrors(flat);
      }
      toast(firstError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle is_open ────────────────────────────────────────────────────

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await api.patch<{ is_open: boolean; message: string }>(
        '/waste-bank/status', {}
      );
      setProfile((prev) => prev ? { ...prev, is_open: res.is_open } : prev);
      await refreshUser();
      toast(res.message, 'success');
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setToggling(false);
      setShowToggle(false);
    }
  }

  // ── Sync categories ───────────────────────────────────────────────────

  async function handleSaveCategories() {
    setSavingCats(true);
    try {
      await api.put('/waste-bank/categories', {
        category_ids: Array.from(selectedCats),
      });
      toast('Kategori berhasil diperbarui.', 'success');
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setSavingCats(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profil Bank Sampah" />

      {/* Banner verifikasi */}
      {profile && <VerificationBanner profile={profile} />}

      {/* Form profil */}
      <Card>
        <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
          <h2 className="font-serif text-base font-semibold text-ink">Informasi Umum</h2>

          <Input
            label="Nama Bank Sampah" required
            value={name} onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <Textarea
            label="Alamat" required rows={2}
            value={address} onChange={(e) => setAddress(e.target.value)}
            error={fieldErrors.address}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nomor Telepon" required
              value={phone} onChange={(e) => setPhone(e.target.value)}
              error={fieldErrors.phone}
            />
            <Input
              label="Deskripsi" placeholder="Opsional"
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <CardDivider />

          {/* Koordinat + map */}
          <h2 className="font-serif text-base font-semibold text-ink">Lokasi</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude" type="number" step="0.0000001" required
              value={lat} onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              error={fieldErrors.latitude}
            />
            <Input
              label="Longitude" type="number" step="0.0000001" required
              value={lng} onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
              error={fieldErrors.longitude}
            />
          </div>
          <MapPicker
            lat={lat} lng={lng}
            onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
          />

          <CardDivider />

          {/* Jam buka */}
          <h2 className="font-serif text-base font-semibold text-ink">Jam Buka</h2>
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const val    = hours[key] ?? '';
              const closed = val === CLOSED_VALUE || val === '';
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-muted">{label}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="checkbox"
                      id={`closed-${key}`}
                      checked={closed}
                      onChange={(e) =>
                        setHours((prev) => ({
                          ...prev,
                          [key]: e.target.checked ? CLOSED_VALUE : '08:00-17:00',
                        }))
                      }
                      className="h-4 w-4 rounded border-line accent-forest"
                    />
                    <label htmlFor={`closed-${key}`} className="text-xs text-muted">
                      Tutup
                    </label>
                    {!closed && (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) =>
                          setHours((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder="08:00-17:00"
                        className="field-base h-8 flex-1 text-xs"
                        aria-label={`Jam buka ${label}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button type="submit" icon={Save} loading={saving} size="sm">
              Simpan Profil
            </Button>
          </div>
        </form>
      </Card>

      {/* Status buka/tutup */}
      {profile?.verification_status === 'verified' && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Status Operasional</p>
              <p className="mt-0.5 text-xs text-muted">
                {profile.is_open
                  ? 'Bank sampah saat ini ditandai Buka.'
                  : 'Bank sampah saat ini ditandai Tutup.'}
              </p>
            </div>
            <Button
              variant={profile.is_open ? 'danger' : 'primary'}
              size="sm"
              icon={profile.is_open ? ToggleRight : ToggleLeft}
              onClick={() => setShowToggle(true)}
            >
              {profile.is_open ? 'Tutup Sekarang' : 'Buka Sekarang'}
            </Button>
          </div>
        </Card>
      )}

      {/* Kategori */}
      <Card>
        <h2 className="font-serif text-base font-semibold text-ink mb-3">
          Kategori yang Diterima
        </h2>
        <p className="mb-4 text-xs text-muted">
          Hanya kategori daur ulang yang ditampilkan. Pilih semua yang diterima bank Anda.
        </p>

        {allCategories.length === 0 ? (
          <p className="text-sm text-muted">Belum ada kategori tersedia.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {allCategories.map((cat) => {
              const checked = selectedCats.has(cat.id);
              return (
                <label
                  key={cat.id}
                  className={[
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                    'transition-colors',
                    checked
                      ? 'border-leaf bg-mist text-forest'
                      : 'border-line bg-white text-muted hover:bg-paper',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedCats((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat.id)) next.delete(cat.id);
                        else next.add(cat.id);
                        return next;
                      });
                    }}
                    className="sr-only"
                  />
                  <span
                    className={[
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked ? 'border-leaf bg-leaf text-white' : 'border-line',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {cat.name}
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary" size="sm" icon={Save}
            loading={savingCats}
            onClick={handleSaveCategories}
          >
            Simpan Kategori
          </Button>
        </div>
      </Card>

      {/* Modal konfirmasi toggle */}
      <ConfirmModal
        open={showToggle}
        title={profile?.is_open ? 'Tutup Bank Sampah?' : 'Buka Bank Sampah?'}
        description={
          profile?.is_open
            ? 'Status akan berubah menjadi Tutup. Pengguna tidak akan dapat menemukan bank sampah Anda di peta.'
            : 'Status akan berubah menjadi Buka.'
        }
        confirmLabel={profile?.is_open ? 'Ya, Tutup' : 'Ya, Buka'}
        confirmVariant={profile?.is_open ? 'danger' : 'primary'}
        loading={toggling}
        onConfirm={handleToggle}
        onCancel={() => setShowToggle(false)}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function VerificationBanner({ profile }: { profile: ProfileData }) {
  const { verification_status: status, rejection_reason } = profile;

  const config = {
    verified: {
      Icon: CheckCircle,
      color: 'border-mint bg-mist text-forest',
      text: 'Akun Anda sudah diverifikasi.',
    },
    pending: {
      Icon: AlertCircle,
      color: 'border-sun bg-sun text-sun-ink',
      text: 'Akun menunggu verifikasi dari developer.',
    },
    rejected: {
      Icon: XCircle,
      color: 'border-danger-soft bg-danger-soft text-danger',
      text: rejection_reason
        ? `Pendaftaran ditolak: ${rejection_reason}`
        : 'Pendaftaran Anda ditolak. Hubungi administrator.',
    },
  } as const;

  const { Icon, color, text } = config[status];

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${color}`}>
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="text-sm">
        <span className="font-semibold">Status: </span>
        <StatusBadge status={status} className="mr-1" />
        {text}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-hidden="true">
      <div className="h-7 w-48 animate-pulse rounded-md bg-line" />
      <div className="h-10 w-full animate-pulse rounded-xl bg-line" />
      <div className="h-64 w-full animate-pulse rounded-2xl bg-line" />
    </div>
  );
}
