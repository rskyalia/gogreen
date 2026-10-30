import { Suspense } from 'react';
import DepositDetailClient from './_client';

// Route dinamis — tidak di-prerender secara statis
export const dynamic = 'force-dynamic';

export default function DepositDetailPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg space-y-4">
        <div className="h-7 w-32 animate-pulse rounded bg-line" />
        <div className="h-60 animate-pulse rounded-2xl bg-line" />
      </div>
    }>
      <DepositDetailClient />
    </Suspense>
  );
}
