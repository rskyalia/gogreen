'use client';

import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle, User } from 'lucide-react';
import {
  PageHeader, Card, Button, StatusBadge,
  DataTable, ConfirmModal, Select, Textarea,
} from '@/components/ui';
import type { Column, PaginationMeta } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────

interface UserRow {
  id:            number;
  name:          string;
  email:         string;
  role:          string;
  status:        'active' | 'banned';
  member_code:   string | null;
  points_balance: number;
  banned_reason: string | null;
  created_at:    string;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user: me }  = useAuth();
  const { toast }     = useToast();

  const [rows, setRows]         = useState<UserRow[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  // Modal
  const [modal, setModal]       = useState<{
    open: boolean;
    user: UserRow | null;
    action: 'banned' | 'active';
  }>({ open: false, user: null, action: 'banned' });
  const [banReason, setBanReason]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (role: string, status: string, search: string, page: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        ...(role   ? { role }           : {}),
        ...(status ? { status }         : {}),
        ...(search ? { search }         : {}),
        page: String(page),
      });
      const res = await api.get<{ data: UserRow[]; meta: PaginationMeta }>(`/admin/users?${qs}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load(roleFilter, statusFilter, search, page);
  }, [load, roleFilter, statusFilter, search, page]);

  function openBan(user: UserRow) {
    setModal({ open: true, user, action: 'banned' });
    setBanReason('');
  }

  function openUnban(user: UserRow) {
    setModal({ open: true, user, action: 'active' });
    setBanReason('');
  }

  async function handleStatusChange() {
    if (!modal.user) return;
    if (modal.action === 'banned' && !banReason.trim()) {
      toast('Alasan ban wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${modal.user.id}/status`, {
        status: modal.action,
        ...(modal.action === 'banned' ? { banned_reason: banReason } : {}),
      });
      toast(modal.action === 'banned' ? 'Akun diblokir.' : 'Akun diaktifkan kembali.', 'success');
      setModal({ open: false, user: null, action: 'banned' });
      load(roleFilter, statusFilter, search, page);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'Pengguna',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-leaf">
            <User size={14} aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-ink">{row.name}</p>
            <p className="text-xs text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <StatusBadge status={row.role} />,
      width: 'w-28',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.banned_reason && (
            <p className="text-xs text-muted mt-0.5 max-w-36 truncate" title={row.banned_reason}>
              {row.banned_reason}
            </p>
          )}
        </div>
      ),
      width: 'w-36',
    },
    {
      key: 'points_balance',
      header: 'Poin',
      render: (row) => (
        <span className="font-medium text-forest">
          {row.points_balance.toLocaleString('id-ID')}
        </span>
      ),
      width: 'w-20',
    },
    {
      key: 'created_at',
      header: 'Bergabung',
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
      render: (row) => {
        const isSelf    = me?.id === row.id;
        const isDev     = row.role === 'developer';
        const canBan    = !isSelf && !isDev && row.status === 'active';
        const canUnban  = row.status === 'banned';
        return (
          <div className="flex items-center gap-1">
            {canBan && (
              <Button
                variant="danger" size="sm" icon={Ban}
                onClick={() => openBan(row)}
              >
                Ban
              </Button>
            )}
            {canUnban && (
              <Button
                variant="secondary" size="sm" icon={CheckCircle}
                onClick={() => openUnban(row)}
              >
                Unban
              </Button>
            )}
          </div>
        );
      },
      width: 'w-28',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Pengguna" description="Kelola status akun seluruh pengguna platform" />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(r) => r.id}
          meta={meta ?? undefined}
          loading={loading}
          onSearch={(q) => { setSearch(q); setPage(1); }}
          searchPlaceholder="Cari nama, email, atau kode..."
          filters={
            <>
              <Select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                aria-label="Filter role"
                className="h-9 text-xs w-36"
              >
                <option value="">Semua Role</option>
                <option value="user">User</option>
                <option value="waste_bank">Waste Bank</option>
                <option value="community">Community</option>
                <option value="developer">Developer</option>
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                aria-label="Filter status"
                className="h-9 text-xs w-36"
              >
                <option value="">Semua Status</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </Select>
            </>
          }
          onPageChange={setPage}
          emptyTitle="Tidak ada pengguna"
          emptyDescription="Tidak ada pengguna yang cocok dengan filter."
        />
      </Card>

      {/* Ban/unban modal */}
      <ConfirmModal
        open={modal.open}
        title={modal.action === 'banned' ? 'Blokir Akun' : 'Aktifkan Kembali'}
        description={
          modal.action === 'banned'
            ? `Blokir akun ${modal.user?.name}? Semua sesi aktif akan dihapus.`
            : `Aktifkan kembali akun ${modal.user?.name}?`
        }
        confirmLabel={modal.action === 'banned' ? 'Ya, Blokir' : 'Ya, Aktifkan'}
        confirmVariant={modal.action === 'banned' ? 'danger' : 'primary'}
        loading={submitting}
        onConfirm={handleStatusChange}
        onCancel={() => setModal({ open: false, user: null, action: 'banned' })}
      >
        {modal.action === 'banned' && (
          <Textarea
            label="Alasan pemblokiran"
            required
            placeholder="Jelaskan alasan pemblokiran..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            rows={3}
          />
        )}
      </ConfirmModal>
    </div>
  );
}
