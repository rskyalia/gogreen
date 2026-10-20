'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import type { ButtonVariant } from './Button';

interface ConfirmModalProps {
  open:           boolean;
  title:          string;
  description?:   string;
  confirmLabel?:  string;
  cancelLabel?:   string;
  /** Varian tombol konfirmasi — default 'danger' untuk aksi destruktif */
  confirmVariant?: ButtonVariant;
  loading?:       boolean;
  onConfirm:      () => void;
  onCancel:       () => void;
  /** Konten tambahan di dalam modal (mis. ringkasan detail) */
  children?:      React.ReactNode;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel  = 'Ya, lanjutkan',
  cancelLabel   = 'Batal',
  confirmVariant = 'danger',
  loading       = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Fokus ke tombol batal saat modal terbuka (aksesibilitas)
  useEffect(() => {
    if (open) cancelBtnRef.current?.focus();
  }, [open]);

  // Tutup dengan Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <h2
            id="confirm-modal-title"
            className="font-serif text-lg font-semibold text-ink"
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            aria-label="Tutup modal"
            className="shrink-0 text-muted hover:text-ink transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-3 pb-6 space-y-4">
          {description && (
            <p className="text-sm text-muted leading-relaxed">{description}</p>
          )}
          {children && (
            <div className="rounded-xl border border-line bg-paper p-4 text-sm text-ink">
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              ref={cancelBtnRef}
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              size="sm"
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
