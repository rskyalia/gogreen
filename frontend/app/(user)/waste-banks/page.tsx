'use client';

/**
 * /waste-banks  — pencarian & peta bank sampah
 *
 * Alur:
 *   1. Minta izin lokasi browser → jika ditolak → tampilkan input kota manual
 *   2. Tampilkan peta Leaflet + daftar bank dengan jarak
 *   3. Filter: chip kategori, toggle "buka sekarang"
 *   4. Klik baris/penanda → detail panel di bawah atau navigasi ke /waste-banks/{id}
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader, Card, Button, useToast } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import {
  MapPin, Navigation, Search, SlidersHorizontal,
  CircleOff, ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react';

// Leaflet map dimuat secara lazy (butuh window)
const WasteBankMap = dynamic(() => import('@/components/WasteBankMap'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-2xl bg-stone-100" aria-hidden="true" />
  ),
});

// ── Types ─────────────────────────────────────────────────────────────────

interface WasteBankItem {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_open: boolean;
  is_open_now: boolean;
  today_hours: string | null;
  distance_km: number | null;
  accepted_categories: Array<{ id: number; name: string; slug: string; icon: string | null }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function WasteBanksPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-line" />
        <div className="h-72 w-full animate-pulse rounded-2xl bg-line" />
      </div>
    }>
      <WasteBanksContent />
    </Suspense>
  );
}

function WasteBanksContent() {
  const { toast }      = useToast();
  const searchParams   = useSearchParams();
  const initialCatId   = searchParams.get('category_id');

  // Lokasi
  const [userLat, setUserLat]     = useState<number | null>(null);
  const [userLng, setUserLng]     = useState<number | null>(null);
  const [locDenied, setLocDenied] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [locLoading, setLocLoading] = useState(true);

  // Data
  const [banks, setBanks]         = useState<WasteBankItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(false);

  // Filter
  const [selectedCat, setSelectedCat] = useState<number | null>(
    initialCatId ? parseInt(initialCatId) : null,
  );
  const [openNow, setOpenNow]     = useState(false);
  const [selected, setSelected]   = useState<number | null>(null);

  // Geocoding (city → koordinat via Nominatim)
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Minta lokasi ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocDenied(true);
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocLoading(false);
      },
      () => {
        setLocDenied(true);
        setLocLoading(false);
      },
      { timeout: 8000 },
    );
  }, []);

  // ── Muat kategori untuk chip filter ──────────────────────────────────

  useEffect(() => {
    api.get<{ data: Category[] }>('/admin/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  // ── Fetch bank sampah ─────────────────────────────────────────────────

  const fetchBanks = useCallback(async (
    lat: number | null,
    lng: number | null,
    catId: number | null,
    filterOpen: boolean,
  ) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (lat !== null) params.set('lat', String(lat));
    if (lng !== null) params.set('lng', String(lng));
    if (catId)        params.set('category_id', String(catId));
    if (filterOpen)   params.set('open_now', '1');
    params.set('per_page', '50');

    try {
      const res = await api.get<{ data: WasteBankItem[] }>(`/user/waste-banks?${params}`);
      setBanks(res.data);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch ulang saat lokasi atau filter berubah
  useEffect(() => {
    if (locLoading) return;
    fetchBanks(userLat, userLng, selectedCat, openNow);
  }, [locLoading, userLat, userLng, selectedCat, openNow, fetchBanks]);

  // ── Geocoding kota via Nominatim ──────────────────────────────────────

  function handleCityChange(val: string) {
    setCityQuery(val);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (!val.trim()) return;

    geocodeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'id' } },
        );
        const data = await res.json();
        if (data[0]) {
          setUserLat(parseFloat(data[0].lat));
          setUserLng(parseFloat(data[0].lon));
        }
      } catch {
        // abaikan gagal geocoding
      }
    }, 700);
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        eyebrow="Temukan"
        title="Bank Sampah"
        description="Cari bank sampah terdekat yang menerima kategori pilihanmu."
      />

      {/* Input kota jika lokasi ditolak */}
      {locDenied && (
        <div className="flex items-center gap-2 rounded-xl border border-sun bg-sun/30 p-3">
          <Navigation size={16} className="shrink-0 text-sun-ink" aria-hidden="true" />
          <p className="flex-1 text-xs text-sun-ink">
            Izin lokasi ditolak. Masukkan nama kota untuk pencarian.
          </p>
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-2.5 text-muted" aria-hidden="true" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="Cari kota…"
              className="w-full rounded-lg border border-line bg-white py-2 pl-7 pr-3 text-xs
                         outline-none focus:border-leaf focus:ring-1 focus:ring-leaf"
            />
          </div>
        </div>
      )}

      {/* Peta */}
      <WasteBankMap
        banks={banks}
        userLat={userLat}
        userLng={userLng}
        selected={selected}
        onSelect={setSelected}
      />

      {/* Filter bar */}
      <div className="space-y-2">
        {/* Toggle buka sekarang */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenNow((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-line bg-white
                       px-3 py-1.5 text-xs font-medium text-muted
                       hover:border-leaf hover:text-forest transition-colors"
            aria-pressed={openNow}
          >
            {openNow
              ? <ToggleRight size={16} className="text-forest" aria-hidden="true" />
              : <ToggleLeft size={16} aria-hidden="true" />}
            Buka sekarang
          </button>

          {loading && (
            <span className="text-xs text-muted animate-pulse">Memuat…</span>
          )}
        </div>

        {/* Chip filter kategori */}
        {categories.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter kategori sampah"
          >
            <button
              type="button"
              onClick={() => setSelectedCat(null)}
              className={chipClass(selectedCat === null)}
              aria-pressed={selectedCat === null}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                className={chipClass(selectedCat === cat.id)}
                aria-pressed={selectedCat === cat.id}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Daftar bank */}
      <Card padded={false}>
        {loading && banks.length === 0 ? (
          <BankListSkeleton />
        ) : banks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14">
            <CircleOff size={28} className="text-line" aria-hidden="true" />
            <p className="text-sm text-muted">
              Tidak ada bank sampah yang sesuai filter.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line" role="list">
            {banks.map((bank) => (
              <li key={bank.id}>
                <Link
                  href={`/waste-banks/${bank.id}`}
                  onClick={() => setSelected(bank.id)}
                  className={[
                    'flex items-start gap-3 px-5 py-4 transition-colors',
                    selected === bank.id ? 'bg-mist' : 'hover:bg-mist/50',
                  ].join(' ')}
                >
                  {/* Indikator buka/tutup */}
                  <span
                    className={[
                      'mt-1 flex h-2 w-2 shrink-0 rounded-full',
                      bank.is_open_now ? 'bg-leaf' : 'bg-line',
                    ].join(' ')}
                    aria-label={bank.is_open_now ? 'Sedang buka' : 'Sedang tutup'}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{bank.name}</p>
                    <p className="mt-0.5 text-xs text-muted truncate">{bank.address}</p>
                    {bank.today_hours && (
                      <p className="mt-0.5 text-xs text-muted">
                        Hari ini: {bank.today_hours}
                      </p>
                    )}
                    {/* Chip kategori kecil */}
                    {bank.accepted_categories.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {bank.accepted_categories.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            className="rounded-full bg-mist px-2 py-0.5 text-[10px] text-forest"
                          >
                            {c.name}
                          </span>
                        ))}
                        {bank.accepted_categories.length > 3 && (
                          <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] text-muted">
                            +{bank.accepted_categories.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Jarak */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {bank.distance_km !== null && (
                      <span className="text-xs font-medium text-forest">
                        {bank.distance_km < 1
                          ? `${Math.round(bank.distance_km * 1000)} m`
                          : `${bank.distance_km.toFixed(1)} km`}
                      </span>
                    )}
                    <MapPin size={13} className="text-line" aria-hidden="true" />
                    <ChevronRight size={13} className="text-line" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function chipClass(active: boolean) {
  return [
    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
    active
      ? 'bg-forest text-white'
      : 'bg-white border border-line text-muted hover:bg-mist hover:text-forest',
  ].join(' ');
}

function BankListSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-label="Memuat…" role="list">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-5 py-4">
          <div className="mt-1.5 h-2 w-2 rounded-full bg-line" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-line" />
            <div className="h-3 w-36 animate-pulse rounded bg-line" />
          </div>
          <div className="h-3 w-10 animate-pulse rounded bg-line" />
        </li>
      ))}
    </ul>
  );
}
