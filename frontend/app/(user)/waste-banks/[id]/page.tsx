import { Suspense } from 'react';
import WasteBankDetailClient from './_client';

export const dynamic = 'force-dynamic';

export default function WasteBankDetailPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg space-y-4">
        <div className="h-7 w-36 animate-pulse rounded bg-line" />
        <div className="h-48 animate-pulse rounded-2xl bg-line" />
        <div className="h-32 animate-pulse rounded-2xl bg-line" />
      </div>
    }>
      <WasteBankDetailClient />
    </Suspense>
  );
}
