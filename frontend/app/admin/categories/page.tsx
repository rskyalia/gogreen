'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  PageHeader, Card, Button, StatusBadge,
  DataTable, ConfirmModal, Input, Textarea, Select,
} from '@/components/ui';
import type { Column, PaginationMeta } from '@/components/ui';
import { api, firstError, flattenErrors } from '@/lib/api';
import { useToast } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface Category {
  id:            number;
  name:          string;
  slug:          string;
  description:   string | null;
  is_recyclable: boolean;
  is_upcyclable: boolean;
  points_per_kg: number;
  icon:          string | null;
  is_active:     boolean;
}

type FormData = Omit<Category, 'id' | 'slug'>;

const DEFAULT_FORM: FormData = {
  name: '', description: null, is_recyclable: true,
  is_upcyclable: true, points_per_kg: 0, icon: null, is_active: true,
};

// ── Modal form ─────────────────────────────────────────────────────────────

function CategoryModal({
  open, category, onClose, onSaved,
}: {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast }               = useToast();
  const [form, setForm]         = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (open) {
      setForm(category ? {
        name:          category.name,
        description:   category.description,
        is_recyclable: category.is_recyclable,
        is_upcyclable: category.is_upcyclable,
        points_per_kg: category.points_per_kg,
        icon:          category.icon,
        is_active:     category.is_active,
      } : DEFAULT_FORM);
      setErrors({});
    }
  }, [open, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (category) {
        await api.put(`/admin/categories/${category.id}`, form);
        toast('Kategori diperbarui.', 'success');
      } else {
        await api.post('/admin/categories', form);
        toast('Kategori dibuat.', 'success');
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
            {category ? 'Edit Kategori' : 'Tambah Kategori'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nama" required id="cat-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Textarea
            label="Deskripsi" id="cat-desc" rows={2}
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value || null })}
            error={errors.description}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Poin per kg" required id="cat-points" type="number" min={0}
              value={form.points_per_kg}
              onChange={(e) => setForm({ ...form, points_per_kg: Number(e.target.value) })}
              error={errors.points_per_kg}
            />
            <Input
              label="Icon (emoji/kode)" id="cat-icon"
              value={form.icon ?? ''}
              onChange={(e) => setForm({ ...form, icon: e.target.value || null })}
              error={errors.icon}
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_recyclable}
                onChange={(e) => setForm({ ...form, is_recyclable: e.target.checked })}
                className="rounded border-line"
              />
              Dapat didaur ulang
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_upcyclable}
                onChange={(e) => setForm({ ...form, is_upcyclable: e.target.checked })}
                className="rounded border-line"
              />
              Dapat di-upcycle
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-line"
              />
              Aktif
            </label>
          </div>
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

export default function AdminCategoriesPage() {
  const { toast }               = useToast();
  const [rows, setRows]         = useState<Category[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (search: string, page: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        ...(search ? { search } : {}),
        page: String(page),
      });
      const res = await api.get<{ data: Category[]; meta: PaginationMeta }>(`/admin/categories?${qs}`);
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
      await api.delete(`/admin/categories/${deleteTarget.id}`);
      toast('Kategori dihapus.', 'success');
      setDeleteTarget(null);
      load(search, page);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Kategori',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.icon && <span className="text-lg">{row.icon}</span>}
          <div>
            <p className="font-medium text-ink">{row.name}</p>
            <p className="text-xs text-muted">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'points_per_kg',
      header: 'Poin/kg',
      render: (row) => (
        <span className="font-semibold text-forest">{row.points_per_kg}</span>
      ),
      width: 'w-20',
    },
    {
      key: 'flags',
      header: 'Properti',
      render: (row) => (
        <div className="flex gap-1 flex-wrap">
          {row.is_recyclable && <StatusBadge status="success" label="Daur Ulang" />}
          {row.is_upcyclable && <StatusBadge status="pending" label="Upcycle" />}
        </div>
      ),
      width: 'w-40',
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
          <Button
            variant="ghost" size="sm" icon={Pencil}
            onClick={() => { setEditing(row); setModalOpen(true); }}
            aria-label="Edit"
          />
          <Button
            variant="ghost" size="sm" icon={Trash2}
            onClick={() => setDeleteTarget(row)}
            aria-label="Hapus"
            className="text-danger hover:text-danger"
          />
        </div>
      ),
      width: 'w-20',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori Sampah"
        description="Kelola kategori dan nilai poin per kg"
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Tambah Kategori
          </Button>
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
          searchPlaceholder="Cari kategori..."
          onPageChange={setPage}
          emptyTitle="Belum ada kategori"
          emptyDescription="Tambahkan kategori sampah pertama."
        />
      </Card>

      <CategoryModal
        open={modalOpen}
        category={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => load(search, page)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Kategori"
        description={`Hapus kategori "${deleteTarget?.name}"? Aksi ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
