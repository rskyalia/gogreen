import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import DepositDetailClient from './_client';

export const dynamic = 'force-dynamic';

export default async function DepositDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      }
    >
      <DepositDetailClient id={id} />
    </Suspense>
  );
}
