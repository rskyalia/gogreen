'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import {
  PageHeader, Card, Button, StatusBadge,
  DataTable, ConfirmModal, Textarea,
} from '@/components/ui';
import type { Column, PaginationMeta } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface WasteBankRow {
  id:                  number;
  name:                string;
  address:             string;
  phone:               string;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at:          string;
  owner?: { name: string; email: string } | null;
  verifier?: { name: string } | null;
}

const TABS = [
  { value: '',         label: 'Semua' },
  { value: 'pending',  label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
] as const;

// ── Client Component ──────────────────────────────────────────────────────

export default function AdminWasteBanksClient() {
  const searchParams  = useSearchParams();
  const { toast }     = useToast();

  const [rows, setRows]       = useState<WasteBankRow[]>([]);
  const [meta, setMeta]       = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<string>(searchParams.get('status') ?? '');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  const [modal, setModal]     = useState<{
    open: boolean;
    bank: WasteBankRow | null;
    action: 'verified' | 'rejected';
  }>({ open: false, bank: null, action: 'verified' });
  const [reason, setReason]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (tab: string, search: string, page: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        ...(tab    ? { status: tab } : {}),
        ...(search ? { search }      : {}),
        page: String(page),
      });
      const res = await api.get<{ data: WasteBankRow[]; meta: PaginationMeta }>(
        `/admin/waste-banks?${qs}`
      );
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(tab, search, page); }, [load, tab, search, page]);

  function openVerify(bank: WasteBankRow, action: 'verified' | 'rejected') {
    setModal({ open: true, bank, action });
    setReason('');
  }

  async function handleVerify() {
    if (!modal.bank) return;
    if (modal.action === 'rejected' && !reason.trim()) {
      toast('Alasan penolakan wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/admin/waste-banks/${modal.bank.id}/verify`, {
        status: modal.action,
        ...(modal.action === 'rejected' ? { reason } : {}),
      });
      toast(
        modal.action === 'verified' ? 'Bank sampah diverifikasi.' : 'Bank sampah ditolak.',
        'success',
      );
      setModal({ open: false, bank: null, action: 'verified' });
      load(tab, search, page);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<WasteBankRow>[] = [
    {
      key: 'name',
      header: 'Nama Bank Sampah',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.name}</p>
          <p className="text-xs text-muted">{row.owner?.email ?? '-'}</p>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Alamat',
      render: (row) => (
        <span className="text-xs text-muted line-clamp-2 max-w-48">{row.address}</span>
      ),
    },
    {
      key: 'verification_status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.verification_status} />,
      width: 'w-32',
    },
    {
      key: 'created_at',
      header: 'Daftar',
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
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/waste-banks/${row.id}`}>
            <Button variant="ghost" size="sm" icon={Eye} aria-label="Detail" />
          </Link>
          {row.verification_status === 'pending' && (
            <>
              <Button
                variant="secondary" size="sm" icon={CheckCircle}
                onClick={() => openVerify(row, 'verified')}
              >
                Verifikasi
              </Button>
              <Button
                variant="danger" size="sm" icon={XCircle}
                onClick={() => openVerify(row, 'rejected')}
              >
                Tolak
              </Button>
            </>
          )}
        </div>
      ),
      width: 'w-52',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi Mitra Bank Sampah"
        description="Kelola status verifikasi pendaftaran bank sampah"
      />

      <Card>
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
          onSearch={(q) => { setSearch(q); setPage(1); }}
          searchPlaceholder="Cari nama atau alamat..."
          onPageChange={setPage}
          emptyTitle="Tidak ada bank sampah"
          emptyDescription="Tidak ada bank sampah yang cocok dengan filter."
        />
      </Card>

      <ConfirmModal
        open={modal.open}
        title={modal.action === 'verified' ? 'Verifikasi Bank Sampah' : 'Tolak Pendaftaran'}
        description={
          modal.action === 'verified'
            ? `Setujui pendaftaran ${modal.bank?.name}?`
            : `Tolak pendaftaran ${modal.bank?.name}? Pemilik akan diberitahu.`
        }
        confirmLabel={modal.action === 'verified' ? 'Ya, Verifikasi' : 'Ya, Tolak'}
        confirmVariant={modal.action === 'verified' ? 'primary' : 'danger'}
        loading={submitting}
        onConfirm={handleVerify}
        onCancel={() => setModal({ open: false, bank: null, action: 'verified' })}
      >
        {modal.action === 'rejected' && (
          <Textarea
            label="Alasan penolakan"
            required
            placeholder="Jelaskan alasan penolakan..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        )}
      </ConfirmModal>
    </div>
  );
}
