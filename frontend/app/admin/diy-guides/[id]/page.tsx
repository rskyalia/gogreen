import { Suspense } from 'react';
import EditDiyGuideClient from './_client';

export default function EditDiyGuidePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-line" />}>
      <EditDiyGuideClient />
    </Suspense>
  );
}
