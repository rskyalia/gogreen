'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, MapPin, Phone, Clock } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, Button, StatusBadge,
  ConfirmModal, Textarea,
} from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

interface WasteBankDetail {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  description: string | null;
  opening_hours: Record<string, string>;
  is_open: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at: string | null;
  created_at: string;
  owner: { id: number; name: string; email: string; phone: string | null } | null;
  verifier: { id: number; name: string } | null;
  accepted_categories: Array<{ id: number; name: string }>;
}

export default function WasteBankDetailClient({ id }: { id: string }) {
  const router  = useRouter();
  const { toast } = useToast();

  const [bank, setBank]           = useState<WasteBankDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<{ open: boolean; action: 'verified' | 'rejected' }>({
    open: false, action: 'verified',
  });
  const [reason, setReason]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: WasteBankDetail }>(`/admin/waste-banks/${id}`);
      setBank(res.data);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleVerify() {
    if (!bank) return;
    if (modal.action === 'rejected' && !reason.trim()) {
      toast('Alasan penolakan wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/admin/waste-banks/${bank.id}/verify`, {
        status: modal.action,
        ...(modal.action === 'rejected' ? { reason } : {}),
      });
      toast(
        modal.action === 'verified' ? 'Bank sampah diverifikasi.' : 'Bank sampah ditolak.',
        'success',
      );
      setModal({ open: false, action: 'verified' });
      load();
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-line" />
        <div className="h-64 animate-pulse rounded-2xl bg-line" />
      </div>
    );
  }

  if (!bank) {
    return <p className="text-muted">Bank sampah tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={bank.name}
        description="Detail bank sampah"
        action={
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => router.back()}>
            Kembali
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Informasi Bank Sampah" />
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <InfoRow label="Status verifikasi">
                <StatusBadge status={bank.verification_status} />
              </InfoRow>
              <InfoRow label="Status operasional">
                <StatusBadge
                  status={bank.is_open ? 'open' : 'closed'}
                  label={bank.is_open ? 'Buka' : 'Tutup'}
                  variant={bank.is_open ? 'success' : 'neutral'}
                />
              </InfoRow>
              <InfoRow label="Alamat">
                <div className="flex items-start gap-1">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-muted" />
                  <span>{bank.address}</span>
                </div>
              </InfoRow>
              <InfoRow label="Telepon">
                <div className="flex items-center gap-1">
                  <Phone size={13} className="text-muted" />
                  <span>{bank.phone}</span>
                </div>
              </InfoRow>
              <InfoRow label="Koordinat">
                <a
                  href={`https://maps.google.com/?q=${bank.latitude},${bank.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-forest hover:underline"
                >
                  {bank.latitude}, {bank.longitude}
                </a>
              </InfoRow>
              <InfoRow label="Tanggal daftar">
                {new Date(bank.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </InfoRow>
              {bank.verified_at && (
                <InfoRow label="Diverifikasi pada">
                  {new Date(bank.verified_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  {bank.verifier && ` oleh ${bank.verifier.name}`}
                </InfoRow>
              )}
              {bank.description && (
                <InfoRow label="Deskripsi" className="sm:col-span-2">
                  {bank.description}
                </InfoRow>
              )}
            </dl>
          </Card>

          {bank.opening_hours && Object.keys(bank.opening_hours).length > 0 && (
            <Card>
              <CardHeader title="Jam Operasional" />
              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {Object.entries(bank.opening_hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-2">
                    <Clock size={13} className="text-muted shrink-0" />
                    <dt className="capitalize text-muted w-16 shrink-0">{day}</dt>
                    <dd className="font-medium text-ink">{hours}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {bank.accepted_categories && bank.accepted_categories.length > 0 && (
            <Card>
              <CardHeader title="Kategori Diterima" />
              <div className="flex flex-wrap gap-2">
                {bank.accepted_categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="rounded-full border border-mint bg-mist px-3 py-1 text-xs text-forest"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {bank.owner && (
            <Card>
              <CardHeader title="Pemilik Akun" />
              <dl className="space-y-2 text-sm">
                <InfoRow label="Nama">{bank.owner.name}</InfoRow>
                <InfoRow label="Email">{bank.owner.email}</InfoRow>
                {bank.owner.phone && <InfoRow label="Telepon">{bank.owner.phone}</InfoRow>}
              </dl>
            </Card>
          )}

          {bank.verification_status === 'pending' && (
            <Card>
              <CardHeader title="Tindakan Verifikasi" />
              <div className="space-y-2">
                <Button
                  className="w-full" icon={CheckCircle}
                  onClick={() => setModal({ open: true, action: 'verified' })}
                >
                  Verifikasi
                </Button>
                <Button
                  variant="danger" className="w-full" icon={XCircle}
                  onClick={() => setModal({ open: true, action: 'rejected' })}
                >
                  Tolak
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        open={modal.open}
        title={modal.action === 'verified' ? 'Verifikasi Bank Sampah' : 'Tolak Pendaftaran'}
        description={
          modal.action === 'verified'
            ? `Setujui pendaftaran ${bank.name}?`
            : `Tolak pendaftaran ${bank.name}?`
        }
        confirmLabel={modal.action === 'verified' ? 'Ya, Verifikasi' : 'Ya, Tolak'}
        confirmVariant={modal.action === 'verified' ? 'primary' : 'danger'}
        loading={submitting}
        onConfirm={handleVerify}
        onCancel={() => setModal({ open: false, action: 'verified' })}
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

function InfoRow({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={['flex flex-col gap-0.5', className].join(' ')}>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
