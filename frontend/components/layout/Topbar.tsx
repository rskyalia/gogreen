'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

interface TopbarProps {
  /** Judul halaman — diisi oleh masing-masing page jika diperlukan */
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-6">
      {/* Judul halaman (opsional) */}
      <div className="min-w-0">
        {title ? (
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
        ) : (
          /* placeholder agar tombol tetap di kanan */
          <span />
        )}
      </div>

      {/* User info + logout */}
      {user && (
        <div className="flex items-center gap-3">
          {/* Avatar inisial */}
          <div
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center
                       rounded-full bg-mist text-sm font-semibold text-forest"
          >
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium text-ink">{user.name}</span>
            <span className="text-xs text-muted capitalize">
              {user.role.replace('_', ' ')}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={logout}
            aria-label="Keluar dari akun"
          >
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      )}
    </header>
  );
}
