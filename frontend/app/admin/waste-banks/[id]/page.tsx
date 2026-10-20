import { Suspense } from 'react';
import WasteBankDetailClient from './_client';

export default function WasteBankDetailPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-line" />}>
      <WasteBankDetailClient />
    </Suspense>
  );
}
