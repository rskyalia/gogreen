'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Card, CardHeader, Button, Input, Textarea, Select,
} from '@/components/ui';
import { api, firstError, flattenErrors } from '@/lib/api';
import { useToast } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface GuideData {
  id?:               number;
  waste_category_id: number | '';
  title:             string;
  description:       string;
  difficulty:        string;
  estimated_minutes: number | '';
  estimated_cost:    number | '';
  materials:         string[];
  steps:             string[];
  cover_image:       string;
  video_url:         string;
  reward_points:     number;
  is_published:      boolean;
}

interface Category {
  id:   number;
  name: string;
}

const DEFAULT: GuideData = {
  waste_category_id: '',
  title:             '',
  description:       '',
  difficulty:        'easy',
  estimated_minutes: '',
  estimated_cost:    '',
  materials:         [''],
  steps:             [''],
  cover_image:       '',
  video_url:         '',
  reward_points:     0,
  is_published:      false,
};

// ── Sortable list item ─────────────────────────────────────────────────────

function SortableItem({
  value, index, total, label,
  onChange, onRemove, onMoveUp, onMoveDown,
  multiline = false,
}: {
  value:       string;
  index:       number;
  total:       number;
  label:       string;
  onChange:    (v: string) => void;
  onRemove:    () => void;
  onMoveUp:    () => void;
  onMoveDown:  () => void;
  multiline?:  boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col gap-0.5 pt-2">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-muted hover:text-ink disabled:opacity-30"
          aria-label={`Pindah ${label} ke atas`}
        >
          <ArrowUp size={13} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-muted hover:text-ink disabled:opacity-30"
          aria-label={`Pindah ${label} ke bawah`}
        >
          <ArrowDown size={13} />
        </button>
      </div>

      <div className="flex-1">
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${label} ${index + 1}`}
            rows={2}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${label} ${index + 1}`}
          />
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="mt-2 text-danger hover:opacity-80 transition-opacity"
        aria-label={`Hapus ${label}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────

export function DiyGuideForm({
  guide,
  onSaved,
  onCancel,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  guide:    any;
  onSaved:  () => void;
  onCancel: () => void;
}) {
  const { toast }               = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm]         = useState<GuideData>(DEFAULT);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);

  // Load categories
  useEffect(() => {
    api.get<{ data: Category[] }>('/admin/categories?per_page=100')
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (guide) {
      setForm({
        id:                guide.id,
        waste_category_id: guide.waste_category_id ?? '',
        title:             guide.title ?? '',
        description:       guide.description ?? '',
        difficulty:        guide.difficulty ?? 'easy',
        estimated_minutes: guide.estimated_minutes ?? '',
        estimated_cost:    guide.estimated_cost ?? '',
        materials:         Array.isArray(guide.materials) && guide.materials.length
          ? guide.materials : [''],
        steps:             Array.isArray(guide.steps) && guide.steps.length
          ? guide.steps.map((s: unknown) => typeof s === 'string' ? s : (s as { description?: string })?.description ?? '')
          : [''],
        cover_image:       guide.cover_image ?? '',
        video_url:         guide.video_url ?? '',
        reward_points:     guide.reward_points ?? 0,
        is_published:      guide.is_published ?? false,
      });
    }
  }, [guide]);

  function setField<K extends keyof GuideData>(key: K, value: GuideData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Material helpers ─────────────────────────────────────────────────────

  function updateMaterial(i: number, v: string) {
    const m = [...form.materials];
    m[i] = v;
    setField('materials', m);
  }

  function addMaterial() {
    setField('materials', [...form.materials, '']);
  }

  function removeMaterial(i: number) {
    setField('materials', form.materials.filter((_, idx) => idx !== i));
  }

  function moveMaterial(i: number, dir: -1 | 1) {
    const m = [...form.materials];
    const j = i + dir;
    [m[i], m[j]] = [m[j], m[i]];
    setField('materials', m);
  }

  // ── Step helpers ─────────────────────────────────────────────────────────

  function updateStep(i: number, v: string) {
    const s = [...form.steps];
    s[i] = v;
    setField('steps', s);
  }

  function addStep() {
    setField('steps', [...form.steps, '']);
  }

  function removeStep(i: number) {
    setField('steps', form.steps.filter((_, idx) => idx !== i));
  }

  function moveStep(i: number, dir: -1 | 1) {
    const s = [...form.steps];
    const j = i + dir;
    [s[i], s[j]] = [s[j], s[i]];
    setField('steps', s);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      waste_category_id:  form.waste_category_id || undefined,
      title:              form.title,
      description:        form.description || null,
      difficulty:         form.difficulty,
      estimated_minutes:  form.estimated_minutes !== '' ? Number(form.estimated_minutes) : null,
      estimated_cost:     form.estimated_cost !== '' ? Number(form.estimated_cost) : null,
      materials:          form.materials.filter(Boolean),
      steps:              form.steps.filter(Boolean),
      cover_image:        form.cover_image || null,
      video_url:          form.video_url || null,
      reward_points:      form.reward_points,
      is_published:       form.is_published,
    };

    try {
      if (form.id) {
        await api.put(`/admin/diy-guides/${form.id}`, payload);
        toast('Panduan diperbarui.', 'success');
      } else {
        await api.post('/admin/diy-guides', payload);
        toast('Panduan dibuat.', 'success');
      }
      onSaved();
    } catch (err) {
      setErrors(flattenErrors(err));
      toast(firstError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info dasar */}
      <Card>
        <CardHeader title="Informasi Dasar" />
        <div className="space-y-4">
          <Input
            label="Judul Panduan" required id="guide-title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            error={errors.title}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Kategori Sampah" required id="guide-cat"
              value={String(form.waste_category_id)}
              onChange={(e) => setField('waste_category_id', Number(e.target.value))}
              error={errors.waste_category_id}
            >
              <option value="">Pilih kategori...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select
              label="Tingkat Kesulitan" required id="guide-diff"
              value={form.difficulty}
              onChange={(e) => setField('difficulty', e.target.value)}
              error={errors.difficulty}
            >
              <option value="easy">Mudah</option>
              <option value="medium">Sedang</option>
              <option value="hard">Sulit</option>
            </Select>
          </div>
          <Textarea
            label="Deskripsi" id="guide-desc" rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            error={errors.description}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Estimasi waktu (menit)" id="guide-time" type="number" min={1}
              value={form.estimated_minutes}
              onChange={(e) => setField('estimated_minutes', e.target.value ? Number(e.target.value) : '')}
              error={errors.estimated_minutes}
            />
            <Input
              label="Estimasi biaya (Rp)" id="guide-cost" type="number" min={0}
              value={form.estimated_cost}
              onChange={(e) => setField('estimated_cost', e.target.value ? Number(e.target.value) : '')}
              error={errors.estimated_cost}
            />
            <Input
              label="Poin reward" required id="guide-points" type="number" min={0}
              value={form.reward_points}
              onChange={(e) => setField('reward_points', Number(e.target.value))}
              error={errors.reward_points}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="URL Cover Image" id="guide-cover" type="url"
              value={form.cover_image}
              onChange={(e) => setField('cover_image', e.target.value)}
              error={errors.cover_image}
            />
            <Input
              label="URL Video" id="guide-video" type="url"
              value={form.video_url}
              onChange={(e) => setField('video_url', e.target.value)}
              error={errors.video_url}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setField('is_published', e.target.checked)}
              className="rounded border-line"
            />
            Terbitkan (tampil di aplikasi)
          </label>
        </div>
      </Card>

      {/* Bahan */}
      <Card>
        <CardHeader
          title="Bahan yang Dibutuhkan"
          action={
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addMaterial}>
              Tambah Bahan
            </Button>
          }
        />
        <div className="space-y-2">
          {form.materials.map((mat, i) => (
            <SortableItem
              key={i}
              value={mat}
              index={i}
              total={form.materials.length}
              label="Bahan"
              onChange={(v) => updateMaterial(i, v)}
              onRemove={() => removeMaterial(i)}
              onMoveUp={() => moveMaterial(i, -1)}
              onMoveDown={() => moveMaterial(i, 1)}
            />
          ))}
          {form.materials.length === 0 && (
            <p className="text-sm text-muted">Belum ada bahan. Klik "Tambah Bahan".</p>
          )}
        </div>
      </Card>

      {/* Langkah */}
      <Card>
        <CardHeader
          title="Langkah-langkah"
          action={
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addStep}>
              Tambah Langkah
            </Button>
          }
        />
        <div className="space-y-2">
          {form.steps.map((step, i) => (
            <SortableItem
              key={i}
              value={step}
              index={i}
              total={form.steps.length}
              label={`Langkah ${i + 1}`}
              onChange={(v) => updateStep(i, v)}
              onRemove={() => removeStep(i)}
              onMoveUp={() => moveStep(i, -1)}
              onMoveDown={() => moveStep(i, 1)}
              multiline
            />
          ))}
          {form.steps.length === 0 && (
            <p className="text-sm text-muted">Belum ada langkah. Klik "Tambah Langkah".</p>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onCancel}>Batal</Button>
        <Button type="submit" loading={saving}>
          {form.id ? 'Simpan Perubahan' : 'Buat Panduan'}
        </Button>
      </div>
    </form>
  );
}
