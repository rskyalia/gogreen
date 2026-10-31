'use client';

/**
 * QrScannerCamera
 *
 * Komponen kamera QR dengan fitur lengkap:
 *   - Overlay sudut (ScanLine frame)
 *   - Tombol ganti kamera (SwitchCamera) bila ada lebih dari 1 kamera
 *   - Tombol senter (Flashlight) bila didukung perangkat
 *   - Validasi payload: harus `gogreen://member/` + token 32 karakter
 *   - Debounce: abaikan decode yang sama dalam 2 detik
 *   - Hentikan kamera saat ada hasil valid
 *   - Bersihkan saat unmount dan saat tab tersembunyi
 *   - Umpan balik haptic: navigator.vibrate(100) bila tersedia
 *   - Tangani semua error: izin ditolak, tidak ada kamera, konteks tidak aman, browser tidak didukung
 *
 * Cara pakai:
 *   const QrScannerCamera = dynamic(() => import('@/components/QrScannerCamera'), { ssr: false });
 *   <QrScannerCamera onResult={(token) => ...} onError={(msg) => ...} />
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Flashlight, RefreshCw, ScanLine, SwitchCamera } from 'lucide-react';

export interface QrScannerCameraProps {
    /** Dipanggil dengan token 32-karakter yang valid (tanpa prefix). */
    onResult: (token: string) => void;
    /** Dipanggil dengan pesan error bila kamera gagal. */
    onError?: (message: string) => void;
}

const QR_PREFIX = 'gogreen://member/';
const TOKEN_RE  = /^[A-Za-z0-9]{32}$/;
const DEBOUNCE_MS = 2_000;

export default function QrScannerCamera({ onResult, onError }: QrScannerCameraProps) {
    const regionId   = useId().replace(/:/g, '');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scannerRef = useRef<any>(null);
    const startedRef = useRef(false);
    const lastTokenRef  = useRef<string>('');
    const lastTokenTime = useRef<number>(0);

    const [cameras, setCameras]         = useState<Array<{ id: string; label: string }>>([]);
    const [currentCamIdx, setCurrentCamIdx] = useState(0);
    const [torchOn, setTorchOn]         = useState(false);
    const [torchSupported, setTorchSupported] = useState(false);
    const [scanning, setScanning]       = useState(true);

    // ── Helpers ───────────────────────────────────────────────────────────

    function reportError(msg: string) {
        onError?.(msg);
    }

    async function stopScanner() {
        if (startedRef.current && scannerRef.current) {
            startedRef.current = false;
            try {
                await scannerRef.current.stop();
            } catch { /* abaikan */ }
        }
    }

    async function startCamera(camIdOrFacing: string | { facingMode: string }) {
        const { Html5Qrcode } = await import('html5-qrcode');

        // Pastikan scanner sebelumnya sudah berhenti
        await stopScanner();

        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;

        try {
            await scanner.start(
                camIdOrFacing,
                {
                    fps: 10,
                    qrbox: { width: 220, height: 220 },
                    aspectRatio: 1.0,
                },
                (decoded: string) => {
                    handleDecoded(decoded);
                },
                undefined,
            );
            startedRef.current = true;

            // Cek dukungan senter lewat track constraints
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const state = (scanner as any).getRunningTrackSettings?.();
                if (state && 'torch' in state) {
                    setTorchSupported(true);
                }
            } catch { /* tidak tersedia */ }
        } catch (err) {
            startedRef.current = false;
            const msg = buildCameraErrorMsg(err);
            reportError(msg);
            setScanning(false);
        }
    }

    function handleDecoded(raw: string) {
        if (!raw.startsWith(QR_PREFIX)) return; // abaikan QR lain secara diam

        const token = raw.slice(QR_PREFIX.length);

        if (!TOKEN_RE.test(token)) {
            // QR berawalan gogreen:// tapi token salah — info singkat
            reportError('Format QR tidak dikenal. Pastikan kartu member GO GREEN yang dipakai.');
            return;
        }

        // Debounce: abaikan token yang sama dalam 2 detik
        const now = Date.now();
        if (token === lastTokenRef.current && now - lastTokenTime.current < DEBOUNCE_MS) {
            return;
        }
        lastTokenRef.current  = token;
        lastTokenTime.current = now;

        setScanning(false);
        stopScanner().finally(() => {
            if (navigator.vibrate) navigator.vibrate(100);
            onResult(token);
        });
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    useEffect(() => {
        let unmounted = false;

        async function init() {
            if (typeof window === 'undefined') return;

            // Cek HTTPS / konteks aman
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                reportError('Kamera hanya tersedia di HTTPS atau localhost. Gunakan kode manual sebagai cadangan.');
                setScanning(false);
                return;
            }

            // Cek ketersediaan browser API
            if (!navigator.mediaDevices?.getUserMedia) {
                reportError('Browser ini tidak mendukung akses kamera. Gunakan Chrome atau Firefox versi terbaru.');
                setScanning(false);
                return;
            }

            try {
                const { Html5Qrcode } = await import('html5-qrcode');
                const deviceList = await Html5Qrcode.getCameras();

                if (unmounted) return;

                if (!deviceList || deviceList.length === 0) {
                    reportError('Tidak ada kamera yang ditemukan di perangkat ini.');
                    setScanning(false);
                    return;
                }

                setCameras(deviceList);

                // Pilih kamera belakang secara default
                const backIdx = deviceList.findIndex(
                    (c) => /back|rear|environment/i.test(c.label),
                );
                const startIdx = backIdx >= 0 ? backIdx : 0;
                setCurrentCamIdx(startIdx);

                if (!unmounted) {
                    await startCamera(deviceList[startIdx].id);
                }
            } catch (err) {
                if (!unmounted) {
                    const msg = buildCameraErrorMsg(err);
                    reportError(msg);
                    setScanning(false);
                }
            }
        }

        init();

        // Hentikan saat tab tidak aktif; lanjutkan saat aktif kembali
        function onVisibility() {
            if (document.visibilityState === 'hidden') {
                stopScanner();
            }
            // Tidak auto-restart saat visible — biarkan user yang restart via tombol
        }
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            unmounted = true;
            document.removeEventListener('visibilitychange', onVisibility);
            stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Aksi ──────────────────────────────────────────────────────────────

    async function switchCamera() {
        if (cameras.length < 2) return;
        const next = (currentCamIdx + 1) % cameras.length;
        setCurrentCamIdx(next);
        setTorchOn(false);
        setTorchSupported(false);
        setScanning(true);
        await startCamera(cameras[next].id);
    }

    async function toggleTorch() {
        if (!torchSupported || !scannerRef.current) return;
        try {
            const next = !torchOn;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (scannerRef.current as any).applyVideoConstraints?.({ advanced: [{ torch: next }] });
            setTorchOn(next);
        } catch { /* senter tidak bisa diakses */ }
    }

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-ink">
            {/* Scanner region — html5-qrcode akan inject <video> di sini */}
            <div
                id={regionId}
                className="aspect-square w-full"
                aria-label="Viewfinder kamera QR"
            />

            {/* ── Corner overlay ── */}
            {scanning && (
                <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    aria-hidden
                >
                    {/* empat sudut dari ScanLine */}
                    <div className="relative size-56">
                        {[
                            'left-0 top-0 border-l-2 border-t-2',
                            'right-0 top-0 border-r-2 border-t-2',
                            'bottom-0 left-0 border-b-2 border-l-2',
                            'bottom-0 right-0 border-b-2 border-r-2',
                        ].map((cls, i) => (
                            <span
                                key={i}
                                className={`absolute size-8 rounded-sm border-white ${cls}`}
                            />
                        ))}
                        <ScanLine
                            className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-white/70"
                            size={224}
                            strokeWidth={0.8}
                        />
                    </div>
                </div>
            )}

            {/* ── Kontrol kamera ── */}
            {scanning && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                    {/* Ganti kamera */}
                    {cameras.length > 1 && (
                        <button
                            type="button"
                            onClick={switchCamera}
                            aria-label="Ganti kamera"
                            className="grid min-h-[44px] min-w-[44px] place-items-center
                                       rounded-full bg-white/20 text-white backdrop-blur
                                       transition-colors hover:bg-white/30
                                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            <SwitchCamera className="size-5" aria-hidden />
                        </button>
                    )}

                    {/* Senter */}
                    {torchSupported && (
                        <button
                            type="button"
                            onClick={toggleTorch}
                            aria-label={torchOn ? 'Matikan senter' : 'Nyalakan senter'}
                            className={[
                                'grid min-h-[44px] min-w-[44px] place-items-center',
                                'rounded-full backdrop-blur transition-colors',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                                torchOn
                                    ? 'bg-white/80 text-ink hover:bg-white'
                                    : 'bg-white/20 text-white hover:bg-white/30',
                            ].join(' ')}
                        >
                            <Flashlight className="size-5" aria-hidden />
                        </button>
                    )}
                </div>
            )}

            {/* ── Loading spinner saat belum mulai ── */}
            {scanning && (
                <div
                    className="pointer-events-none absolute left-3 top-3"
                    aria-label="Kamera memuat"
                    role="status"
                >
                    <RefreshCw className="size-4 animate-spin text-white/60" aria-hidden />
                </div>
            )}
        </div>
    );
}

// ── Error message builder ──────────────────────────────────────────────────

function buildCameraErrorMsg(err: unknown): string {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

    if (msg.includes('notallowederror') || msg.includes('permission denied') || msg.includes('denied')) {
        return 'Izin kamera ditolak. Buka Pengaturan Browser → Izin Situs → aktifkan Kamera untuk halaman ini, lalu muat ulang.';
    }
    if (msg.includes('notfounderror') || msg.includes('no cameras') || msg.includes('requested device not found')) {
        return 'Tidak ada kamera yang ditemukan. Gunakan kode manual sebagai cadangan.';
    }
    if (msg.includes('notreadableerror') || msg.includes('could not start video source')) {
        return 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut dan coba lagi.';
    }
    if (msg.includes('overconstrained') || msg.includes('constraint')) {
        return 'Kamera tidak mendukung resolusi yang diminta. Coba ganti kamera.';
    }
    return 'Tidak dapat mengakses kamera. Gunakan kode manual sebagai cadangan.';
}
