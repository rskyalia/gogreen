import { Suspense } from 'react';
import AdminDiySubmissionsClient from './_client';

export default function AdminDiySubmissionsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-line" />}>
      <AdminDiySubmissionsClient />
    </Suspense>
  );
}
