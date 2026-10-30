'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ZoomIn } from 'lucide-react';
import {
  PageHeader, Card, Button, StatusBadge,
  DataTable, ConfirmModal, Textarea,
} from '@/components/ui';
import type { Column, PaginationMeta } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface Submission {
  id:            number;
  status:        'pending' | 'approved' | 'rejected';
  proof_image:   string;
  review_note:   string | null;
  points_awarded: number;
  title:         string | null;
  category:      string | null;
  created_at:    string;
  user:          { id: number; name: string; email: string } | null;
  diy_guide: {
    id:            number;
    title:         string;
    reward_points: number;
    waste_category?: { name: string } | null;
  } | null;
  reviewer: { id: number; name: string } | null;
}

// Judul tampil untuk karya: punya tutorial pakai judul tutorial,
// karya mandiri pakai judulnya sendiri.
const karyaTitle = (row: Submission) =>
  row.diy_guide?.title ?? row.title ?? 'Karya mandiri';

const TABS = [
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: '',         label: 'Semua' },
] as const;

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Bukti karya"
        className="max-h-[80vh] max-w-full rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function AdminDiySubmissionsClient() {
  const searchParams  = useSearchParams();
  const { toast }     = useToast();

  const [rows, setRows]         = useState<Submission[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState(searchParams.get('status') ?? 'pending');
  const [page, setPage]         = useState(1);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [modal, setModal]       = useState<{
    open: boolean;
    item: Submission | null;
    action: 'approved' | 'rejected';
  }>({ open: false, item: null, action: 'approved' });
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (tab: string, page: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        ...(tab ? { status: tab } : {}),
        page: String(page),
      });
      const res = await api.get<{ data: Submission[]; meta: PaginationMeta }>(
        `/admin/diy-submissions?${qs}`
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

  async function handleReview() {
    if (!modal.item) return;
    if (modal.action === 'rejected' && !reviewNote.trim()) {
      toast('Catatan penolakan wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/admin/diy-submissions/${modal.item.id}/review`, {
        status:      modal.action,
        review_note: modal.action === 'rejected' ? reviewNote : undefined,
      });
      toast(
        modal.action === 'approved' ? 'Karya disetujui, poin diberikan.' : 'Karya ditolak.',
        'success',
      );
      setModal({ open: false, item: null, action: 'approved' });
      load(tab, page);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<Submission>[] = [
    {
      key: 'proof_image',
      header: 'Bukti',
      render: (row) => (
        <button
          type="button"
          onClick={() => setPreviewSrc(row.proof_image)}
          className="group relative h-14 w-14 overflow-hidden rounded-lg border border-line"
          aria-label="Lihat foto bukti"
        >
          <img
            src={row.proof_image}
            alt="Bukti"
            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-ink/30">
            <ZoomIn size={16} className="text-white" />
          </div>
        </button>
      ),
      width: 'w-20',
    },
    {
      key: 'user',
      header: 'Pengguna',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.user?.name ?? '-'}</p>
          <p className="text-xs text-muted">{row.user?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'diy_guide',
      header: 'Panduan',
      render: (row) => (
        <div>
          <p className="text-sm text-ink line-clamp-1">{karyaTitle(row)}</p>
          <p className="text-xs text-muted">
            {row.diy_guide
              ? `${row.diy_guide.waste_category?.name ?? row.category ?? ''} • ${row.diy_guide.reward_points} poin`
              : `${row.category ?? 'Karya mandiri'} • 0 poin`}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.review_note && (
            <p className="text-xs text-muted mt-0.5 max-w-36 line-clamp-2" title={row.review_note}>
              {row.review_note}
            </p>
          )}
        </div>
      ),
      width: 'w-36',
    },
    {
      key: 'created_at',
      header: 'Dikirim',
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
            onClick={() => {
              setModal({ open: true, item: row, action: 'approved' });
              setReviewNote('');
            }}
          >
            Setuju
          </Button>
          <Button
            variant="danger" size="sm" icon={XCircle}
            onClick={() => {
              setModal({ open: true, item: row, action: 'rejected' });
              setReviewNote('');
            }}
          >
            Tolak
          </Button>
        </div>
      ) : (
        row.reviewer ? (
          <span className="text-xs text-muted">oleh {row.reviewer.name}</span>
        ) : null
      ),
      width: 'w-44',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validasi Karya DIY"
        description="Tinjau kiriman karya daur ulang dari pengguna"
      />

      <Card>
        <div className="mb-5 flex gap-1 border-b border-line -mx-5 px-5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setTab(t.value); setPage(1); }}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
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
          emptyTitle="Tidak ada karya"
          emptyDescription="Belum ada karya yang perlu ditinjau."
        />
      </Card>

      <ConfirmModal
        open={modal.open}
        title={modal.action === 'approved' ? 'Setujui Karya' : 'Tolak Karya'}
        description={
          modal.action === 'approved'
            ? `Setujui karya "${modal.item ? karyaTitle(modal.item) : ''}"? Pengguna akan mendapat ${modal.item?.diy_guide?.reward_points ?? 0} poin.`
            : `Tolak karya "${modal.item ? karyaTitle(modal.item) : ''}"?`
        }
        confirmLabel={modal.action === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak'}
        confirmVariant={modal.action === 'approved' ? 'primary' : 'danger'}
        loading={submitting}
        onConfirm={handleReview}
        onCancel={() => setModal({ open: false, item: null, action: 'approved' })}
      >
        {modal.action === 'rejected' && (
          <Textarea
            label="Catatan penolakan"
            required
            placeholder="Jelaskan alasan penolakan..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={3}
          />
        )}
      </ConfirmModal>

      {previewSrc && (
        <ImageModal src={previewSrc} onClose={() => setPreviewSrc(null)} />
      )}
    </div>
  );
}
