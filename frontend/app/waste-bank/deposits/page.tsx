'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader, Button, DataTable, StatusBadge,
  useToast,
} from '@/components/ui';
import type { Column, PaginationMeta } from '@/components/ui';
import { api, firstError, downloadFile } from '@/lib/api';
import { Plus, Download, Calendar } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

interface DepositRow {
  id:              number;
  total_weight_kg: number;
  total_points:    number;
  notes:           string | null;
  created_at:      string;
  member: {
    id:          number;
    name:        string;
    member_code: string;
  } | null;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function DepositsPage() {
  const { toast }  = useToast();
  const router     = useRouter();

  const [rows, setRows]         = useState<DepositRow[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta>({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (from)   params.set('from', from);
      if (to)     params.set('to', to);

      const res = await api.get<{
        data: DepositRow[];
        meta: PaginationMeta;
      }>(`/waste-bank/deposits?${params}`);

      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, from, to, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (from)   params.set('from', from);
      if (to)     params.set('to', to);
      await downloadFile(
        `/waste-bank/deposits/export?${params}`,
        `setoran-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      toast('CSV berhasil diunduh.', 'success');
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setExporting(false);
    }
  }

  // ── Kolom tabel ──────────────────────────────────────────────────────

  const columns: Column<DepositRow>[] = [
    {
      key: 'created_at',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-xs text-muted">
          {new Date(row.created_at).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      ),
      width: 'w-40',
    },
    {
      key: 'member',
      header: 'Member',
      render: (row) => row.member ? (
        <div>
          <p className="text-sm font-medium text-ink">{row.member.name}</p>
          <p className="text-xs font-mono text-muted">{row.member.member_code}</p>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'total_weight_kg',
      header: 'Berat',
      render: (row) => (
        <span className="text-sm">{Number(row.total_weight_kg).toFixed(2)} kg</span>
      ),
      width: 'w-24',
    },
    {
      key: 'total_points',
      header: 'Poin',
      render: (row) => (
        <span className="text-sm font-medium text-forest">
          +{row.total_points.toLocaleString('id-ID')}
        </span>
      ),
      width: 'w-24',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          type="button"
          onClick={() => router.push(`/waste-bank/deposits/${row.id}`)}
          className="text-xs text-leaf hover:underline"
        >
          Detail
        </button>
      ),
      width: 'w-16',
    },
  ];

  // ── Filters slot ──────────────────────────────────────────────────────

  const filters = (
    <div className="flex items-center gap-2">
      <Calendar size={14} className="shrink-0 text-muted" aria-hidden="true" />
      <input
        type="date"
        value={from}
        onChange={(e) => { setFrom(e.target.value); setPage(1); }}
        className="field-base h-9 w-36 text-xs"
        aria-label="Dari tanggal"
      />
      <span className="text-xs text-muted">s/d</span>
      <input
        type="date"
        value={to}
        onChange={(e) => { setTo(e.target.value); setPage(1); }}
        className="field-base h-9 w-36 text-xs"
        aria-label="Sampai tanggal"
      />
    </div>
  );

  const actions = (
    <div className="flex gap-2">
      <Button
        variant="secondary" size="sm" icon={Download}
        loading={exporting}
        onClick={handleExport}
      >
        Export CSV
      </Button>
      <Button
        size="sm" icon={Plus}
        onClick={() => router.push('/waste-bank/deposits/new')}
      >
        Input Setoran
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rekapan Setoran"
        description="Semua setoran yang dicatat oleh bank sampah Anda"
      />

      <DataTable
        columns={columns}
        rows={rows}
        keyExtractor={(r) => r.id}
        meta={meta}
        loading={loading}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Cari nama member…"
        filters={filters}
        actions={actions}
        onPageChange={setPage}
        emptyTitle="Belum ada setoran"
        emptyDescription="Setoran yang dicatat akan muncul di sini."
      />
    </div>
  );
}
