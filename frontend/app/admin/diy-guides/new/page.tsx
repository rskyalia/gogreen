'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { DiyGuideForm } from '../_components/DiyGuideForm';

export default function NewDiyGuidePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Panduan DIY" description="Buat panduan daur ulang baru" />
      <DiyGuideForm
        guide={null}
        onSaved={() => router.push('/admin/diy-guides')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
