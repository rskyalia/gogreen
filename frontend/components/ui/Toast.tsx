'use client';

/**
 * Toast — notifikasi global ringan.
 *
 * Cara pakai:
 *   1. Pasang <ToastProvider> di layout (atau root layout).
 *   2. Di komponen manapun: const { toast } = useToast()
 *   3. toast('Berhasil disimpan.', 'success')
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id:       string;
  message:  string;
  variant:  ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

// ── Context ───────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Style maps ────────────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-forest        text-white',
  error:   'bg-danger        text-white',
  warning: 'bg-sun           text-sun-ink border border-sun',
  info:    'bg-ink           text-white',
};

const VARIANT_ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

// ── Provider ──────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems]     = useState<ToastItem[]>([]);
  const timersRef             = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev.slice(-4), { id, message, variant }]);
      const timer = setTimeout(() => remove(id), 4000);
      timersRef.current.set(id, timer);
    },
    [remove],
  );

  // bersihkan semua timer saat unmount
  useEffect(() => {
    const ref = timersRef.current;
    return () => ref.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2"
      >
        {items.map((item) => {
          const Icon = VARIANT_ICONS[item.variant];
          return (
            <div
              key={item.id}
              role="status"
              className={[
                'pointer-events-auto flex w-80 max-w-[90vw] items-start gap-3',
                'rounded-xl px-4 py-3 shadow-lg animate-slide-up',
                VARIANT_CLASSES[item.variant],
              ].join(' ')}
            >
              <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm leading-snug">{item.message}</p>
              <button
                onClick={() => remove(item.id)}
                aria-label="Tutup notifikasi"
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast harus digunakan di dalam <ToastProvider>.');
  }
  return ctx;
}
