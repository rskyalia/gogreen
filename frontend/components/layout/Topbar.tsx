'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';

// ── Tipe notifikasi ───────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  type: string;
  data: {
    deposit_id?: number;
    waste_bank_name?: string;
    total_kg?: number;
    total_points?: number;
  };
  read_at: string | null;
  created_at: string;
}

interface NotifResponse {
  data: NotificationItem[];
  unread_count: number;
}

interface TopbarProps {
  /** Judul halaman — diisi oleh masing-masing page jika diperlukan */
  title?: string;
}

const POLL_INTERVAL_MS = 15_000;

export function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth();

  const [notifs, setNotifs]       = useState<NotificationItem[]>([]);
  const [unread, setUnread]       = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panelRef    = useRef<HTMLDivElement>(null);

  const isUserRole = user?.role === 'user';

  // ── Fetch notifikasi ──────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!isUserRole) return;
    try {
      const res = await api.get<NotifResponse>('/user/notifications');
      setNotifs(res.data);
      setUnread(res.unread_count);
    } catch {
      // gagal poll — biarkan badge tetap seperti sebelumnya
    }
  }, [isUserRole]);

  // Polling tiap 15 detik
  useEffect(() => {
    if (!isUserRole) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isUserRole, fetchNotifications]);

  // Tutup panel jika klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Tandai baca ───────────────────────────────────────────────────────

  async function handleMarkAllRead() {
    try {
      await api.patch('/user/notifications/read-all', {});
      setUnread(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {
      // abaikan
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await api.patch(`/user/notifications/${id}/read`, {});
      setNotifs((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      // abaikan
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-6">
      {/* Judul halaman (opsional) */}
      <div className="min-w-0">
        {title ? (
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
        ) : (
          <span />
        )}
      </div>

      {/* Kanan: lonceng + user info + logout */}
      {user && (
        <div className="flex items-center gap-3">
          {/* ── Notifikasi (hanya role user) ── */}
          {isUserRole && (
            <div className="relative" ref={panelRef}>
              <button
                type="button"
                onClick={() => {
                  setPanelOpen((o) => !o);
                  if (!panelOpen && unread > 0) handleMarkAllRead();
                }}
                className="relative flex items-center justify-center rounded-lg p-1.5
                           text-muted hover:bg-mist hover:text-forest transition-colors"
                aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ''}`}
              >
                <Bell size={18} aria-hidden="true" />
                {unread > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center
                               justify-center rounded-full bg-danger text-[10px] font-bold text-white"
                    aria-hidden="true"
                  >
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* Panel notifikasi */}
              {panelOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border
                             border-line bg-white shadow-xl"
                  role="dialog"
                  aria-label="Daftar notifikasi"
                >
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <p className="text-sm font-semibold text-ink">Notifikasi</p>
                    {unread > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-leaf hover:underline"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  <ul className="max-h-80 overflow-y-auto divide-y divide-line" role="list">
                    {notifs.length === 0 ? (
                      <li className="py-8 text-center text-sm text-muted">
                        Belum ada notifikasi
                      </li>
                    ) : (
                      notifs.map((n) => (
                        <NotifItem
                          key={n.id}
                          notif={n}
                          onRead={handleMarkRead}
                        />
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

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

// ── Sub-component: satu baris notifikasi ──────────────────────────────────

function NotifItem({
  notif,
  onRead,
}: {
  notif: NotificationItem;
  onRead: (id: string) => void;
}) {
  const d = notif.data;
  const isUnread = !notif.read_at;

  return (
    <li
      className={[
        'flex items-start gap-3 px-4 py-3 transition-colors',
        isUnread ? 'bg-mist/50' : '',
      ].join(' ')}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest/10">
        <Bell size={13} className="text-forest" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink">Setoran berhasil dicatat</p>
        {d.waste_bank_name && (
          <p className="mt-0.5 text-xs text-muted">
            {d.waste_bank_name} · {d.total_kg?.toFixed(2)} kg · +{d.total_points?.toLocaleString('id-ID')} poin
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted">
          {notif.created_at
            ? new Date(notif.created_at).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })
            : ''}
        </p>
      </div>
      {isUnread && (
        <button
          type="button"
          onClick={() => onRead(notif.id)}
          className="mt-0.5 shrink-0 text-[10px] text-leaf hover:underline"
          aria-label="Tandai dibaca"
        >
          Baca
        </button>
      )}
    </li>
  );
}
