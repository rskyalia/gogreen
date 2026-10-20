'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Gift } from 'lucide-react';
import {
  PageHeader, Card, Button, StatusBadge,
  DataTable, ConfirmModal, Input, Textarea,
} from '@/components/ui';
import type { Column, PaginationMeta } from '@/components/ui';
import { api, firstError, flattenErrors } from '@/lib/api';
import { useToast } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface Reward {
  id:          number;
  name:        string;
  description: string | null;
  image:       string | null;
  points_cost: number;
  stock:       number | null;
  is_active:   boolean;
  created_at:  string;
}

type RewardForm = {
  name: string;
  description: string;
  image: string;
  points_cost: number;
  stock: string;
  is_active: boolean;
};

const DEFAULT_FORM: RewardForm = {
  name: '', description: '', image: '', points_cost: 100, stock: '', is_active: true,
};

// ── Modal ──────────────────────────────────────────────────────────────────

function RewardModal({
  open, reward, onClose, onSaved,
}: {
  open: boolean;
  reward: Reward | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast }           = useToast();
  const [form, setForm]     = useState<RewardForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(reward ? {
        name:        reward.name,
        description: reward.description ?? '',
        image:       reward.image ?? '',
        points_cost: reward.points_cost,
        stock:       reward.stock != null ? String(reward.stock) : '',
        is_active:   reward.is_active,
      } : DEFAULT_FORM);
      setErrors({});
    }
  }, [open, reward]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name:        form.name,
      description: form.description || null,
      image:       form.image || null,
      points_cost: form.points_cost,
      stock:       form.stock !== '' ? Number(form.stock) : null,
      is_active:   form.is_active,
    };
    try {
      if (reward) {
        await api.put(`/admin/rewards/${reward.id}`, payload);
        toast('Reward diperbarui.', 'success');
      } else {
        await api.post('/admin/rewards', payload);
        toast('Reward dibuat.', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      setErrors(flattenErrors(err));
      toast(firstError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-white shadow-xl">
        <div className="p-6 pb-0">
          <h2 className="font-serif text-lg font-semibold text-ink">
            {reward ? 'Edit Reward' : 'Tambah Reward'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Nama" required id="rew-name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Textarea label="Deskripsi" id="rew-desc" rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={errors.description}
          />
          <Input label="URL Gambar" id="rew-image" type="url"
            value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
            error={errors.image} hint="URL gambar atau path relatif"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Harga Poin" required id="rew-points" type="number" min={1}
              value={form.points_cost}
              onChange={(e) => setForm({ ...form, points_cost: Number(e.target.value) })}
              error={errors.points_cost}
            />
            <Input label="Stok (kosong = tak terbatas)" id="rew-stock" type="number" min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              error={errors.stock} placeholder="∞"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-line"
            />
            Aktif (tampil di katalog)
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-line">
            <Button variant="secondary" type="button" onClick={onClose}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminRewardsPage() {
  const { toast }               = useToast();
  const [rows, setRows]         = useState<Reward[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<Reward | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (search: string, page: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        ...(search ? { search } : {}),
        page: String(page),
      });
      const res = await api.get<{ data: Reward[]; meta: PaginationMeta }>(`/admin/rewards?${qs}`);
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
      await api.delete(`/admin/rewards/${deleteTarget.id}`);
      toast('Reward dihapus.', 'success');
      setDeleteTarget(null);
      load(search, page);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Reward>[] = [
    {
      key: 'name',
      header: 'Reward',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img src={row.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mist text-muted">
              <Gift size={18} />
            </div>
          )}
          <div>
            <p className="font-medium text-ink">{row.name}</p>
            <p className="text-xs text-muted line-clamp-1">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'points_cost',
      header: 'Harga Poin',
      render: (row) => (
        <span className="font-semibold text-forest">{row.points_cost.toLocaleString('id-ID')}</span>
      ),
      width: 'w-28',
    },
    {
      key: 'stock',
      header: 'Stok',
      render: (row) => (
        <span className={row.stock === 0 ? 'text-danger font-medium' : 'text-ink'}>
          {row.stock == null ? '∞' : row.stock}
        </span>
      ),
      width: 'w-16',
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.is_active ? 'active' : 'inactive'} label={row.is_active ? 'Aktif' : 'Nonaktif'} />
      ),
      width: 'w-24',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={Pencil}
            onClick={() => { setEditing(row); setModalOpen(true); }}
            aria-label="Edit"
          />
          <Button variant="ghost" size="sm" icon={Trash2}
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
        title="Katalog Reward"
        description="Kelola hadiah yang bisa ditukar dengan poin"
        action={
          <div className="flex gap-2">
            <Link href="/admin/rewards/redemptions">
              <Button variant="secondary">Kelola Penukaran</Button>
            </Link>
            <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
              Tambah Reward
            </Button>
          </div>
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
          searchPlaceholder="Cari reward..."
          onPageChange={setPage}
          emptyTitle="Belum ada reward"
          emptyDescription="Tambahkan reward pertama untuk ditukar pengguna."
        />
      </Card>

      <RewardModal
        open={modalOpen}
        reward={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => load(search, page)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Reward"
        description={`Hapus reward "${deleteTarget?.name}"?`}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
