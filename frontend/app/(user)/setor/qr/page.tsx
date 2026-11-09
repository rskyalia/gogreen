'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Building2 } from 'lucide-react';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

interface DraftStatus {
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  waste_bank_name: string;
  expires_at: string;
}

function QRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<DraftStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Poll status
  useEffect(() => {
    if (!token) {
      router.push('/setor');
      return;
    }

    let isSubscribed = true;

    const fetchStatus = async () => {
      try {
        const res = await api.get<{ data: DraftStatus }>(`/user/deposits/draft/status?token=${token}`);
        
        if (!isSubscribed) return;
        
        setStatus(res.data);
        
        // Redirect jika sudah approved
        if (res.data.status === 'approved') {
          setTimeout(() => {
            if (isSubscribed) {
              router.push('/deposits');
            }
          }, 2000);
        }
      } catch (err) {
        if (!isSubscribed) return;
        
        toast(firstError(err), 'error');
        router.push('/setor');
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll setiap 3 detik

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only depend on token to avoid infinite loops

  // Countdown timer
  useEffect(() => {
    if (!status?.expires_at) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(status.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Kedaluwarsa');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [status?.expires_at]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-line border-t-forest" />
          <p className="mt-4 text-sm text-muted">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // Status expired
  if (status.status === 'expired' || timeLeft === 'Kedaluwarsa') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
            QR Code Setoran
          </h1>
        </header>

        <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-white p-8 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-line text-muted">
            <Clock className="size-10" />
          </span>
          <div>
            <h2 className="font-serif text-2xl font-medium text-ink">
              QR Code Kedaluwarsa
            </h2>
            <p className="mt-2 text-sm text-muted">
              QR code ini sudah tidak berlaku. Silakan buat setoran baru.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/setor')}
            className="rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
          >
            Buat Setoran Baru
          </button>
        </div>
      </div>
    );
  }

  // Status rejected
  if (status.status === 'rejected') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
            QR Code Setoran
          </h1>
        </header>

        <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-white p-8 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-danger/10 text-danger">
            <XCircle className="size-10" />
          </span>
          <div>
            <h2 className="font-serif text-2xl font-medium text-ink">
              Setoran Ditolak
            </h2>
            <p className="mt-2 text-sm text-muted">
              Setoran ini ditolak oleh petugas bank sampah.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/setor')}
            className="rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
          >
            Buat Setoran Baru
          </button>
        </div>
      </div>
    );
  }

  // Status approved
  if (status.status === 'approved') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
            QR Code Setoran
          </h1>
        </header>

        <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-white p-8 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-mint text-forest">
            <CheckCircle2 className="size-10" />
          </span>
          <div>
            <h2 className="font-serif text-2xl font-medium text-forest">
              Setoran Disetujui!
            </h2>
            <p className="mt-2 text-sm text-muted">
              Poin sudah masuk ke akunmu. Mengalihkan ke riwayat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Status pending - show QR code
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
          QR Code Setoran
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Tunjukkan QR code ini kepada petugas bank sampah untuk diproses.
        </p>
      </header>

      <div className="space-y-4">
        {/* Bank info */}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
          <Building2 className="size-5 shrink-0 text-leaf" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Bank Sampah</p>
            <p className="text-sm font-semibold text-ink">{status.waste_bank_name}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white p-8">
          <div className="rounded-2xl bg-white p-4 shadow-md">
            {token && (
              <QRCodeSVG
                value={`gogreen://deposit/${token}`}
                size={300}
                level="H"
                includeMargin
                style={{ width: '300px', height: '300px' }}
              />
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 rounded-full bg-mist px-4 py-2">
            <Clock className="size-4 text-forest" />
            <span className="text-sm font-semibold text-forest">
              Berlaku {timeLeft}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2">
            <AlertCircle className="size-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">
              Menunggu pemindaian...
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-line bg-white p-4">
          <h3 className="text-sm font-semibold text-ink">Cara menggunakan:</h3>
          <ol className="mt-2 space-y-1.5 text-sm text-muted">
            <li className="flex gap-2">
              <span className="font-semibold text-forest">1.</span>
              Tunjukkan QR code ini kepada petugas bank sampah
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-forest">2.</span>
              Petugas akan memindai dan memverifikasi setoran
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-forest">3.</span>
              Poin akan otomatis masuk setelah disetujui
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/deposits')}
            className="flex-1 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mist"
          >
            Lihat Riwayat
          </button>
          <button
            type="button"
            onClick={() => router.push('/setor')}
            className="flex-1 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
          >
            Setor Lagi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QRPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-line border-t-forest" />
          <p className="mt-4 text-sm text-muted">Memuat...</p>
        </div>
      </div>
    }>
      <QRContent />
    </Suspense>
  );
}
