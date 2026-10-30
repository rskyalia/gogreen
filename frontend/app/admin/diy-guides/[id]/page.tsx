import { Suspense } from 'react';
import EditDiyGuideClient from './_client';

export const dynamic = 'force-dynamic';

export default async function EditDiyGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-line" />}>
      <EditDiyGuideClient id={id} />
    </Suspense>
  );
}
