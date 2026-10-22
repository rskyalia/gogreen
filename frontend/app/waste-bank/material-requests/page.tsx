'use client';

/**
 * /waste-bank/material-requests
 * Tab "Permintaan Terbuka" — lihat dan beri tawaran.
 * Tab "Tawaran Saya"       — status tawaran + tombol "Tandai Terkirim".
 */

import { useCallback, useEffect, useState } from 'react';
import {
  PageHeader, Card, Button, Input, Textarea,
  StatusBadge, ConfirmModal, EmptyState, useToast,
  Skeleton,
} from '@/components/ui';
import { api, firstError } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import { PackageCheck, Send, Truck, RefreshCw } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

interface MaterialRequest {
  id:                  number;
  quantity_needed_kg:  number;
  notes:               string | null;
  status:              string;
  created_at:          string;
  waste_category:      { id: number; name: string } | null;
  community:           { id: number; name: string } | null;
  responses_count:     number | null;
}

interface MyResponse {
  id:                   number;
  material_request_id:  number;
  quantity_offered_kg:  number;
  status:               string;
  notes:                string | null;
  created_at:           string;
  material_request: MaterialRequest | null;
}

interface ListMeta {
  current_page: number;
  last_page:    number;
  total:        number;
}

type ActiveTab = 'open' | 'mine';

// ── Page ──────────────────────────────────────────────────────────────────

export default function MaterialRequestsPage() {
  const { toast }        = useToast();
  const [tab, setTab]    = useState<ActiveTab>('open');

  // Tab 1 — open requests
  const [requests, setRequests]         = useState<MaterialRequest[]>([]);
  const [reqMeta, setReqMeta]           = useState<ListMeta>({ current_page: 1, last_page: 1, total: 0 });
  const [reqPage, setReqPage]           = useState(1);
  const [reqLoading, setReqLoading]     = useState(true);

  // Tab 2 — my responses
  const [myResps, setMyResps]           = useState<MyResponse[]>([]);
  const [myMeta, setMyMeta]             = useState<ListMeta>({ current_page: 1, last_page: 1, total: 0 });
  const [myPage, setMyPage]             = useState(1);
  const [myLoading, setMyLoading]       = useState(true);

  // Offer modal
  const [offerTarget, setOfferTarget]   = useState<MaterialRequest | null>(null);
  const [offerKg, setOfferKg]           = useState('');
  const [offerNotes, setOfferNotes]     = useState('');
  const [offerErr, setOfferErr]         = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Deliver confirm
  const [deliverTarget, setDeliverTarget] = useState<MyResponse | null>(null);
  const [delivering, setDelivering]       = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────

  const loadRequests = useCallback(async (page: number) => {
    setReqLoading(true);
    try {
      const res = await api.get<{ data: MaterialRequest[]; meta: ListMeta }>(
        `/waste-bank/material-requests?page=${page}`
      );
      setRequests(res.data);
      setReqMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setReqLoading(false);
    }
  }, [toast]);

  const loadMyResponses = useCallback(async (page: number) => {
    setMyLoading(true);
    try {
      const res = await api.get<{ data: MyResponse[]; meta: ListMeta }>(
        `/waste-bank/responses?page=${page}`
      );
      setMyResps(res.data);
      setMyMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setMyLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadRequests(reqPage); }, [reqPage, loadRequests]);
  useEffect(() => { loadMyResponses(myPage); }, [myPage, loadMyResponses]);

  // ── Submit offer ──────────────────────────────────────────────────────

  async function handleSubmitOffer() {
    if (!offerTarget) return;
    const kg = parseFloat(offerKg);
    if (!kg || kg <= 0) {
      setOfferErr('Masukkan jumlah yang valid (> 0).');
      return;
    }
    setSubmittingOffer(true);
    setOfferErr('');
    try {
      await api.post(
        `/waste-bank/material-requests/${offerTarget.id}/responses`,
        { quantity_offered_kg: kg, notes: offerNotes || undefined }
      );
      toast('Tawaran berhasil dikirimkan.', 'success');
      setOfferTarget(null);
      setOfferKg('');
      setOfferNotes('');
      loadRequests(reqPage);
      loadMyResponses(1);
      setMyPage(1);
    } catch (err) {
      setOfferErr(firstError(err));
    } finally {
      setSubmittingOffer(false);
    }
  }

  // ── Mark delivered ────────────────────────────────────────────────────

  async function handleDeliver() {
    if (!deliverTarget) return;
    setDelivering(true);
    try {
      await api.patch(`/waste-bank/responses/${deliverTarget.id}/delivered`, {});
      toast('Tawaran ditandai sebagai terkirim.', 'success');
      setDeliverTarget(null);
      loadMyResponses(myPage);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setDelivering(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <PageHeader
        title="Request Bahan"
        description="Permintaan bahan daur ulang dari komunitas"
        action={
          <Button
            variant="ghost" size="sm" icon={RefreshCw}
            onClick={() => {
              loadRequests(reqPage);
              loadMyResponses(myPage);
            }}
          >
            Muat Ulang
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-line">
        <TabButton
          label="Permintaan Terbuka"
          count={reqMeta.total}
          active={tab === 'open'}
          onClick={() => setTab('open')}
        />
        <TabButton
          label="Tawaran Saya"
          count={myMeta.total}
          active={tab === 'mine'}
          onClick={() => setTab('mine')}
        />
      </div>

      {/* ── Tab: Permintaan Terbuka ── */}
      {tab === 'open' && (
        <div className="space-y-3">
          {reqLoading ? (
            <RequestsSkeleton />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={PackageCheck}
              title="Tidak ada permintaan terbuka"
              description="Permintaan dari komunitas untuk kategori yang Anda terima akan muncul di sini."
            />
          ) : (
            requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onOffer={() => { setOfferTarget(req); setOfferKg(''); setOfferNotes(''); setOfferErr(''); }}
              />
            ))
          )}

          {reqMeta.last_page > 1 && (
            <Pager meta={reqMeta} page={reqPage} setPage={setReqPage} />
          )}
        </div>
      )}

      {/* ── Tab: Tawaran Saya ── */}
      {tab === 'mine' && (
        <div className="space-y-3">
          {myLoading ? (
            <RequestsSkeleton />
          ) : myResps.length === 0 ? (
            <EmptyState
              icon={Send}
              title="Belum ada tawaran"
              description="Tawaran yang Anda kirimkan akan muncul di sini."
            />
          ) : (
            myResps.map((resp) => (
              <MyResponseCard
                key={resp.id}
                response={resp}
                onDeliver={() => setDeliverTarget(resp)}
              />
            ))
          )}

          {myMeta.last_page > 1 && (
            <Pager meta={myMeta} page={myPage} setPage={setMyPage} />
          )}
        </div>
      )}

      {/* ── Modal: Kirim Tawaran ── */}
      <ConfirmModal
        open={!!offerTarget}
        title="Kirim Tawaran"
        confirmLabel="Kirim Tawaran"
        confirmVariant="primary"
        loading={submittingOffer}
        onConfirm={handleSubmitOffer}
        onCancel={() => setOfferTarget(null)}
      >
        {offerTarget && (
          <div className="space-y-3">
            <div className="text-sm text-muted space-y-0.5">
              <p>
                <span className="font-medium text-ink">{offerTarget.waste_category?.name}</span>
              </p>
              <p>
                Dibutuhkan:{' '}
                <span className="font-medium text-ink">
                  {Number(offerTarget.quantity_needed_kg).toFixed(1)} kg
                </span>
              </p>
              {offerTarget.community && (
                <p>Dari: {offerTarget.community.name}</p>
              )}
            </div>

            <Input
              label="Jumlah yang ditawarkan (kg)"
              type="number"
              step="0.1"
              min="0.1"
              value={offerKg}
              onChange={(e) => { setOfferKg(e.target.value); setOfferErr(''); }}
              placeholder="0.0"
              error={offerErr}
              required
              autoFocus
            />

            <Textarea
              label="Catatan (opsional)"
              value={offerNotes}
              onChange={(e) => setOfferNotes(e.target.value)}
              rows={2}
              placeholder="Kondisi, estimasi pengiriman, dll."
            />
          </div>
        )}
      </ConfirmModal>

      {/* ── Modal: Konfirmasi Terkirim ── */}
      <ConfirmModal
        open={!!deliverTarget}
        title="Tandai sebagai Terkirim?"
        description="Konfirmasi bahwa Anda sudah mengirimkan bahan ke komunitas. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, Sudah Terkirim"
        confirmVariant="primary"
        loading={delivering}
        onConfirm={handleDeliver}
        onCancel={() => setDeliverTarget(null)}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TabButton({
  label, count, active, onClick,
}: {
  label:   string;
  count:   number;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
        '-mb-px border-b-2',
        active
          ? 'border-forest text-forest'
          : 'border-transparent text-muted hover:text-ink',
      ].join(' ')}
    >
      {label}
      {count > 0 && (
        <span
          className={[
            'rounded-full px-1.5 py-0.5 text-xs font-semibold',
            active ? 'bg-forest text-white' : 'bg-mist text-muted',
          ].join(' ')}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function RequestCard({
  request, onOffer,
}: {
  request: MaterialRequest;
  onOffer: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">
              {request.waste_category?.name ?? 'Kategori tidak tersedia'}
            </span>
            <StatusBadge status={request.status} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              Dibutuhkan:{' '}
              <span className="font-medium text-ink">
                {Number(request.quantity_needed_kg).toFixed(1)} kg
              </span>
            </span>
            {request.community && (
              <span>Dari: {request.community.name}</span>
            )}
            {request.responses_count !== null && (
              <span>{request.responses_count} tawaran masuk</span>
            )}
            <span>
              {new Date(request.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>

          {request.notes && (
            <p className="mt-2 text-xs text-muted italic">"{request.notes}"</p>
          )}
        </div>

        <Button
          size="sm"
          icon={Send}
          onClick={onOffer}
          className="shrink-0"
        >
          Tawarkan
        </Button>
      </div>
    </Card>
  );
}

function MyResponseCard({
  response, onDeliver,
}: {
  response:  MyResponse;
  onDeliver: () => void;
}) {
  const req = response.material_request;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">
              {req?.waste_category?.name ?? `Permintaan #${response.material_request_id}`}
            </span>
            <StatusBadge status={response.status} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              Ditawarkan:{' '}
              <span className="font-medium text-ink">
                {Number(response.quantity_offered_kg).toFixed(1)} kg
              </span>
            </span>
            {req?.community && (
              <span>Untuk: {req.community.name}</span>
            )}
            <span>
              {new Date(response.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>

          {response.notes && (
            <p className="mt-2 text-xs text-muted italic">"{response.notes}"</p>
          )}
        </div>

        {/* Tombol terkirim hanya muncul jika status = accepted */}
        {response.status === 'accepted' && (
          <Button
            size="sm"
            icon={Truck}
            onClick={onDeliver}
            className="shrink-0"
          >
            Tandai Terkirim
          </Button>
        )}
      </div>
    </Card>
  );
}

function Pager({
  meta, page, setPage,
}: {
  meta:    ListMeta;
  page:    number;
  setPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-muted">
      <span>
        Halaman {meta.current_page} dari {meta.last_page}
        {' · '}
        {meta.total.toLocaleString('id-ID')} total
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="rounded-lg border border-line px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-mist transition-colors"
        >
          ← Sebelumnya
        </button>
        <button
          type="button"
          disabled={page >= meta.last_page}
          onClick={() => setPage(page + 1)}
          className="rounded-lg border border-line px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-mist transition-colors"
        >
          Berikutnya →
        </button>
      </div>
    </div>
  );
}

function RequestsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-line bg-white p-5 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}
