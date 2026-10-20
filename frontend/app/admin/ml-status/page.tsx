'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  AlertTriangle, Activity, CheckCircle, Clock, RefreshCw,
} from 'lucide-react';
import {
  PageHeader, Card, CardHeader, StatCard, SkeletonStatCard,
} from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface TimeSeriesPoint {
  period:        string;
  total_calls:   number;
  success_count: number;
  avg_ms:        number | null;
}

interface MlStatusData {
  range:            string;
  total_calls:      number;
  success_count:    number;
  success_rate:     number | null;
  avg_response_ms:  number | null;
  p95_response_ms:  number | null;
  recent_errors:    Array<{
    id:              number;
    model_name:      string;
    error_message:   string | null;
    response_time_ms: number | null;
    created_at:      string;
  }>;
  time_series: TimeSeriesPoint[];
}

type Range = '24h' | '7d' | '30d';

const RANGE_LABELS: Record<Range, string> = {
  '24h': '24 Jam',
  '7d':  '7 Hari',
  '30d': '30 Hari',
};

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminMlStatusPage() {
  const { toast }               = useToast();
  const [data, setData]         = useState<MlStatusData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState<Range>('24h');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (r: Range, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await api.get<{ data: MlStatusData }>(`/admin/ml-status?range=${r}`);
      setData(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      if (!quiet) toast(firstError(err), 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => { load(range); }, [load, range]);

  // Auto-refresh every 30s
  useEffect(() => {
    timerRef.current = setInterval(() => load(range, true), 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load, range]);

  const isAlert = data?.success_rate != null && data.success_rate < 90;

  // Format time series label
  function formatPeriod(period: string): string {
    if (range === '24h') {
      // "2026-10-20 14:00:00" → "14:00"
      return period.slice(11, 16);
    }
    // "2026-10-20" → "20 Okt"
    const d = new Date(period);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  const chartData = data?.time_series.map((p) => ({
    period:       formatPeriod(p.period),
    'Total Panggilan': p.total_calls,
    'Sukses':          p.success_count,
    'Avg ms':          p.avg_ms != null ? Math.round(p.avg_ms) : null,
  })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemantauan API ML"
        description="Status dan performa model AI klasifikasi sampah"
        action={
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <p className="text-xs text-muted">
                Diperbarui: {lastRefresh.toLocaleTimeString('id-ID')}
              </p>
            )}
            <button
              type="button"
              onClick={() => load(range)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-white
                         px-3 py-1.5 text-xs text-muted hover:bg-mist transition-colors"
              aria-label="Perbarui data"
            >
              <RefreshCw size={13} aria-hidden="true" />
              Refresh
            </button>
            <div className="flex gap-1">
              {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={[
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    range === r
                      ? 'bg-forest text-white'
                      : 'bg-mist text-muted hover:bg-mint',
                  ].join(' ')}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Alert banner */}
      {isAlert && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <p className="text-sm text-danger">
            <span className="font-semibold">Peringatan!</span>{' '}
            Success rate API ML berada di <strong>{data!.success_rate}%</strong> — di bawah ambang 90%.
            Segera periksa konfigurasi model.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          <><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></>
        ) : (
          <>
            <StatCard
              icon={CheckCircle}
              label="Success Rate"
              value={data?.success_rate != null ? `${data.success_rate}%` : '—'}
              iconClass={isAlert ? 'text-danger' : 'text-leaf'}
            />
            <StatCard
              icon={Clock}
              label="Avg Response"
              value={data?.avg_response_ms != null ? data.avg_response_ms : '—'}
              unit={data?.avg_response_ms != null ? 'ms' : ''}
              iconClass="text-forest"
            />
            <StatCard
              icon={Activity}
              label="Total Panggilan"
              value={data?.total_calls ?? 0}
              unit={`panggilan (${RANGE_LABELS[range]})`}
              iconClass="text-muted"
            />
          </>
        )}
      </div>

      {/* Time series chart */}
      <Card>
        <CardHeader
          title="Tren Panggilan"
          description={`Statistik per ${range === '24h' ? 'jam' : 'hari'} — ${RANGE_LABELS[range]} terakhir`}
        />
        {loading ? (
          <div className="h-56 animate-pulse rounded-xl bg-line" />
        ) : chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">Tidak ada data untuk periode ini.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d7e6dd" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#6b8279' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6b8279' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6b8279' }} tickLine={false} axisLine={false} unit=" ms" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="Total Panggilan" stroke="#0891b2" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="Sukses" stroke="#1f8a5b" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="Avg ms" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* P95 + recent errors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* P95 card */}
        <Card className="lg:col-span-1">
          <CardHeader title="Latency P95" />
          {loading ? (
            <div className="h-10 animate-pulse rounded bg-line" />
          ) : (
            <p className="font-serif text-4xl font-semibold text-ink">
              {data?.p95_response_ms != null ? data.p95_response_ms : '—'}
              {data?.p95_response_ms != null && (
                <span className="ml-1.5 text-base font-sans font-normal text-muted">ms</span>
              )}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">
            95% permintaan selesai di bawah waktu ini.
          </p>
        </Card>

        {/* Recent errors */}
        <Card className="lg:col-span-2">
          <CardHeader title="Error Terakhir" />
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-line" />
              ))}
            </div>
          ) : !data?.recent_errors.length ? (
            <p className="py-8 text-center text-sm text-muted">Tidak ada error dalam periode ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-line">
                  <tr>
                    <th className="pb-2 text-left text-xs font-semibold text-muted">Waktu</th>
                    <th className="pb-2 text-left text-xs font-semibold text-muted">Model</th>
                    <th className="pb-2 text-left text-xs font-semibold text-muted">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.recent_errors.map((err) => (
                    <tr key={err.id}>
                      <td className="py-2 text-xs text-muted whitespace-nowrap">
                        {new Date(err.created_at).toLocaleString('id-ID', {
                          dateStyle: 'short', timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-2 text-xs font-medium text-ink">{err.model_name}</td>
                      <td className="py-2 text-xs text-danger max-w-xs truncate" title={err.error_message ?? ''}>
                        {err.error_message ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
