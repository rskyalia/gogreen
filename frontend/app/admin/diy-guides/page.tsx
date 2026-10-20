'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Eye, BookOpen } from 'lucide-react';
import {
  PageHeader, Card, Button, StatusBadge,
  DataTable, ConfirmModal,
} from '@/components/ui';
import type { Column, PaginationMeta } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface Guide {
  id:             number;
  title:          string;
  difficulty:     string;
  reward_points:  number;
  is_published:   boolean;
  created_at:     string;
  waste_category: { id: number; name: string } | null;
  creator:        { id: number; name: string } | null;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Mudah', medium: 'Sedang', hard: 'Sulit',
};

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminDiyGuidesPage() {
  const { toast }               = useToast();
  const [rows, setRows]         = useState<Guide[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (search: string, page: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        ...(search ? { search } : {}),
        page: String(page),
      });
      const res = await api.get<{ data: Guide[]; meta: PaginationMeta }>(`/admin/diy-guides?${qs}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(search, page); }, [load, search, page]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/diy-guides/${deleteTarget.id}`);
      toast('Panduan dihapus.', 'success');
      setDeleteTarget(null);
      load(search, page);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Guide>[] = [
    {
      key: 'title',
      header: 'Panduan',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist text-leaf">
            <BookOpen size={15} />
          </div>
          <div>
            <p className="font-medium text-ink line-clamp-1">{row.title}</p>
            <p className="text-xs text-muted">{row.waste_category?.name ?? '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'difficulty',
      header: 'Kesulitan',
      render: (row) => (
        <span className="text-sm text-ink">
          {DIFFICULTY_LABELS[row.difficulty] ?? row.difficulty}
        </span>
      ),
      width: 'w-24',
    },
    {
      key: 'reward_points',
      header: 'Poin',
      render: (row) => (
        <span className="font-semibold text-forest">{row.reward_points}</span>
      ),
      width: 'w-16',
    },
    {
      key: 'is_published',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={row.is_published ? 'active' : 'neutral'}
          label={row.is_published ? 'Diterbitkan' : 'Draft'}
        />
      ),
      width: 'w-28',
    },
    {
      key: 'creator',
      header: 'Dibuat oleh',
      render: (row) => (
        <span className="text-xs text-muted">{row.creator?.name ?? '-'}</span>
      ),
      width: 'w-32',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/diy-guides/${row.id}`}>
            <Button variant="ghost" size="sm" icon={Pencil} aria-label="Edit" />
          </Link>
          <Button
            variant="ghost" size="sm" icon={Trash2}
            onClick={() => setDeleteTarget(row)}
            aria-label="Hapus" className="text-danger hover:text-danger"
          />
        </div>
      ),
      width: 'w-20',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panduan DIY"
        description="Kelola panduan daur ulang untuk komunitas"
        action={
          <Link href="/admin/diy-guides/new">
            <Button icon={Plus}>Tambah Panduan</Button>
          </Link>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(r) => r.id}
          meta={meta ?? undefined}
          loading={loading}
          onSearch={(q) => { setSearch(q); setPage(1); }}
          searchPlaceholder="Cari judul panduan..."
          onPageChange={setPage}
          emptyTitle="Belum ada panduan"
          emptyDescription="Tambahkan panduan DIY pertama."
        />
      </Card>

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Panduan"
        description={`Hapus panduan "${deleteTarget?.title}"?`}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
