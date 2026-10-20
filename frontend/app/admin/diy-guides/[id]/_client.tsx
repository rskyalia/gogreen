'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';
import { DiyGuideForm } from '../_components/DiyGuideForm';

export default function EditDiyGuideClient() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { toast } = useToast();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [guide, setGuide]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: unknown }>(`/admin/diy-guides/${id}`);
      setGuide(res.data);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-line" />
        <div className="h-96 animate-pulse rounded-2xl bg-line" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Panduan DIY" description={guide?.title ?? ''} />
      <DiyGuideForm
        guide={guide}
        onSaved={() => router.push('/admin/diy-guides')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
