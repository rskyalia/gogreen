import { Suspense } from 'react';
import DepositDetailClient from './_client';

export const instant = false;

export default async function DepositDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg space-y-4">
        <div className="h-7 w-32 animate-pulse rounded bg-line" />
        <div className="h-60 animate-pulse rounded-2xl bg-line" />
      </div>
    }>
      <DepositDetailClient id={id} />
    </Suspense>
  );
}
