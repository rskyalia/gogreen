'use client';

/**
 * /scan/result
 * Halaman hasil scan sampah ML.
 *
 * Menerima query string dari proses scan:
 *   - recommended_path : "bank_sampah" | "diy" | "both"
 *   - category_id      : id kategori sampah dari ML (opsional)
 *   - category_name    : nama kategori untuk ditampilkan
 *   - object_name      : nama objek yang terdeteksi
 *   - confidence       : confidence score (0-1)
 *   - green_score      : skor hijau (0-100)
 *
 * Tindakan yang ditampilkan berdasarkan recommended_path:
 *   - bank_sampah → tombol "Cari bank sampah" → /waste-banks?category_id=…
 *   - diy         → tombol "Lihat panduan DIY"
 *   - both        → kedua tombol
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui';
import {
  CheckCircle, MapPin, BookOpen, ArrowLeft,
  Recycle, Leaf,
} from 'lucide-react';

export default function ScanResultPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg space-y-4">
        <div className="h-5 w-24 animate-pulse rounded bg-line" />
        <div className="h-48 animate-pulse rounded-2xl bg-line" />
      </div>
    }>
      <ScanResultContent />
    </Suspense>
  );
}

function ScanResultContent() {
  const params = useSearchParams();

  const recommendedPath = params.get('recommended_path') ?? '';
  const categoryId      = params.get('category_id');
  const categoryName    = params.get('category_name') ?? 'Sampah';
  const objectName      = params.get('object_name') ?? categoryName;
  const confidence      = parseFloat(params.get('confidence') ?? '0');
  const greenScore      = parseInt(params.get('green_score') ?? '0');

  const showBank = recommendedPath === 'bank_sampah' || recommendedPath === 'both';
  const showDiy  = recommendedPath === 'diy'        || recommendedPath === 'both';

  const bankUrl = categoryId
    ? `/waste-banks?category_id=${categoryId}`
    : '/waste-banks';

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Dashboard
      </Link>

      {/* Hasil identifikasi */}
      <Card>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mist">
            <Recycle size={28} className="text-forest" aria-hidden="true" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-leaf">
              Hasil Identifikasi
            </p>
            <h1 className="mt-1 font-serif text-2xl font-medium text-forest">
              {objectName}
            </h1>
            {categoryName && categoryName !== objectName && (
              <p className="mt-0.5 text-sm text-muted">Kategori: {categoryName}</p>
            )}
          </div>

          {/* Skor */}
          <div className="flex gap-6 text-center">
            {confidence > 0 && (
              <div>
                <p className="font-serif text-2xl font-semibold text-forest">
                  {Math.round(confidence * 100)}%
                </p>
                <p className="text-xs text-muted">Keyakinan</p>
              </div>
            )}
            {greenScore > 0 && (
              <div>
                <p className="font-serif text-2xl font-semibold text-leaf">
                  {greenScore}
                </p>
                <p className="text-xs text-muted">Skor Hijau</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Rekomendasi tindakan */}
      {(showBank || showDiy) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">Apa yang bisa kamu lakukan?</p>

          {/* Tombol cari bank sampah */}
          {showBank && (
            <Link
              href={bankUrl}
              className="flex items-center gap-4 rounded-2xl border border-line bg-white
                         p-4 hover:border-leaf hover:bg-mist transition-colors group"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest text-mint"
                aria-hidden="true"
              >
                <MapPin size={20} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Cari bank sampah</p>
                <p className="text-xs text-muted">
                  {categoryName
                    ? `Temukan bank sampah yang menerima ${categoryName}`
                    : 'Temukan bank sampah terdekat'}
                </p>
              </div>
              <CheckCircle
                size={16}
                className="ml-auto shrink-0 text-line group-hover:text-leaf transition-colors"
                aria-hidden="true"
              />
            </Link>
          )}

          {/* Tombol panduan DIY */}
          {showDiy && (
            <Link
              href="/dashboard"
              className="flex items-center gap-4 rounded-2xl border border-line bg-white
                         p-4 hover:border-leaf hover:bg-mist transition-colors group"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint text-forest"
                aria-hidden="true"
              >
                <BookOpen size={20} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Lihat panduan DIY</p>
                <p className="text-xs text-muted">
                  Ubah sampah jadi karya kreatif dengan panduan mudah
                </p>
              </div>
              <Leaf
                size={16}
                className="ml-auto shrink-0 text-line group-hover:text-leaf transition-colors"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
      )}

      {/* Tidak ada rekomendasi */}
      {!showBank && !showDiy && (
        <Card>
          <p className="py-4 text-center text-sm text-muted">
            Tidak ada rekomendasi tindakan untuk hasil scan ini.
          </p>
        </Card>
      )}
    </div>
  );
}
