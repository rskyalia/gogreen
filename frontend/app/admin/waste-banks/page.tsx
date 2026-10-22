import { Suspense } from 'react';
import AdminWasteBanksClient from './_client';

export default function AdminWasteBanksPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-line" />}>
      <AdminWasteBanksClient />
    </Suspense>
  );
}
