'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  PageHeader, Card, Button, StatusBadge,
  DataTable, ConfirmModal, Select,
} from '@/components/ui';
import type { Column, PaginationMeta } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface Redemption {
  id:           number;
  status:       'pending' | 'completed' | 'cancelled';
  points_spent: number;
  created_at:   string;
  user:  { id: number; name: string; email: string } | null;
  reward: { id: number; name: string; image: string | null } | null;
}

const TABS = [
  { value: '',           label: 'Semua' },
  { value: 'pending',    label: 'Pending' },
  { value: 'completed',  label: 'Selesai' },
  { value: 'cancelled',  label: 'Dibatalkan' },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminRedemptionsPage() {
  const { toast }               = useToast();
  const [rows, setRows]         = useState<Redemption[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('');
  const [page, setPage]         = useState(1);

  const [modal, setModal]       = useState<{
    open: boolean;
    item: Redemption | null;
    action: 'completed' | 'cancelled';
  }>({ open: false, item: null, action: 'completed' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (tab: string, page: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        ...(tab ? { status: tab } : {}),
        page: String(page),
      });
      const res = await api.get<{ data: Redemption[]; meta: PaginationMeta }>(
        `/admin/redemptions?${qs}`
      );
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(tab, page); }, [load, tab, page]);

  async function handleAction() {
    if (!modal.item) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/redemptions/${modal.item.id}`, { status: modal.action });
      toast(
        modal.action === 'completed' ? 'Penukaran diselesaikan.' : 'Penukaran dibatalkan, poin dikembalikan.',
        'success',
      );
      setModal({ open: false, item: null, action: 'completed' });
      load(tab, page);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<Redemption>[] = [
    {
      key: 'reward',
      header: 'Reward',
      render: (row) => (
        <p className="font-medium text-ink">{row.reward?.name ?? '-'}</p>
      ),
    },
    {
      key: 'user',
      header: 'Pengguna',
      render: (row) => (
        <div>
          <p className="text-sm text-ink">{row.user?.name ?? '-'}</p>
          <p className="text-xs text-muted">{row.user?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'points_spent',
      header: 'Poin Digunakan',
      render: (row) => (
        <span className="font-semibold text-forest">{row.points_spent.toLocaleString('id-ID')}</span>
      ),
      width: 'w-32',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
      width: 'w-28',
    },
    {
      key: 'created_at',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-xs text-muted">
          {new Date(row.created_at).toLocaleDateString('id-ID')}
        </span>
      ),
      width: 'w-24',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => row.status === 'pending' ? (
        <div className="flex items-center gap-1">
          <Button
            variant="secondary" size="sm" icon={CheckCircle}
            onClick={() => setModal({ open: true, item: row, action: 'completed' })}
          >
            Selesai
          </Button>
          <Button
            variant="danger" size="sm" icon={XCircle}
            onClick={() => setModal({ open: true, item: row, action: 'cancelled' })}
          >
            Batal
          </Button>
        </div>
      ) : null,
      width: 'w-44',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Penukaran Reward" description="Proses permintaan penukaran reward dari pengguna" />

      <Card>
        {/* Tab filter */}
        <div className="mb-5 flex gap-1 border-b border-line -mx-5 px-5">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setTab(t.value); setPage(1); }}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                tab === t.value
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:text-ink',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(r) => r.id}
          meta={meta ?? undefined}
          loading={loading}
          onPageChange={setPage}
          emptyTitle="Tidak ada penukaran"
          emptyDescription="Belum ada penukaran reward."
        />
      </Card>

      <ConfirmModal
        open={modal.open}
        title={modal.action === 'completed' ? 'Selesaikan Penukaran' : 'Batalkan Penukaran'}
        description={
          modal.action === 'completed'
            ? `Tandai penukaran "${modal.item?.reward?.name}" sebagai selesai?`
            : `Batalkan penukaran "${modal.item?.reward?.name}"? Poin akan dikembalikan ke pengguna.`
        }
        confirmLabel={modal.action === 'completed' ? 'Ya, Selesai' : 'Ya, Batalkan'}
        confirmVariant={modal.action === 'cancelled' ? 'danger' : 'primary'}
        loading={submitting}
        onConfirm={handleAction}
        onCancel={() => setModal({ open: false, item: null, action: 'completed' })}
      />
    </div>
  );
}
