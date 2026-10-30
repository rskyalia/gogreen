import { Suspense } from 'react';
import WasteBankDetailClient from './_client';

export const dynamic = 'force-dynamic';

export default async function WasteBankDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-line" />}>
      <WasteBankDetailClient id={id} />
    </Suspense>
  );
}
