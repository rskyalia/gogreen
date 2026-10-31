'use client';

/**
 * QrScanner — Scan QR Code menggunakan kamera menggunakan html5-qrcode.
 * Dimuat secara lazy karena butuh DOM dan kamera.
 *
 * Cara pakai:
 *   const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });
 *   <QrScanner onResult={(text) => ...} onClose={() => ...} />
 */

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface QrScannerProps {
  onResult: (text: string) => void;
  onClose:  () => void;
}

export default function QrScanner({ onResult, onClose }: QrScannerProps) {
  const scanRegionId = useId().replace(/:/g, '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef  = useRef<any>(null);
  // Hanya true setelah scanner.start() resolve — mencegah stop() di scanner yang belum jalan
  const startedRef  = useRef(false);

  useEffect(() => {
    let unmounted = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (unmounted) return;

      const scanner = new Html5Qrcode(scanRegionId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            // Tandai sudah stop sebelum memanggil stop agar cleanup tidak stop lagi
            startedRef.current = false;
            scanner.stop()
              .catch(() => {/* abaikan */})
              .finally(() => {
                if (!unmounted) onResult(decodedText);
              });
          },
          undefined,
        )
        .then(() => {
          // start() berhasil — aman untuk di-stop nanti
          if (!unmounted) startedRef.current = true;
        })
        .catch(() => {
          // Kamera tidak bisa diakses — tutup scanner
          if (!unmounted) onClose();
        });
    });

    return () => {
      unmounted = true;
      if (startedRef.current && scannerRef.current) {
        startedRef.current = false;
        scannerRef.current.stop().catch(() => {/* abaikan error cleanup */});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scanner QR Code"
    >
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-semibold text-ink text-sm">Scan QR Card Member</p>
          <button
            type="button"
            onClick={() => {
              // Tutup manual: stop dulu jika sudah jalan
              if (startedRef.current && scannerRef.current) {
                startedRef.current = false;
                scannerRef.current.stop()
                  .catch(() => {/* abaikan */})
                  .finally(onClose);
              } else {
                onClose();
              }
            }}
            className="text-muted hover:text-ink transition-colors"
            aria-label="Tutup scanner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner region */}
        <div className="p-4">
          <div id={scanRegionId} className="w-full overflow-hidden rounded-xl" />
          <p className="mt-3 text-center text-xs text-muted">
            Arahkan kamera ke QR Code pada kartu member.
          </p>
        </div>
      </div>
    </div>
  );
}
