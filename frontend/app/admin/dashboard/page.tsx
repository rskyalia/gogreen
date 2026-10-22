import { Suspense } from 'react';
import DeveloperDashboardClient from './_client';

export default function DeveloperDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-8">
          <div className="h-56 animate-pulse rounded-3xl bg-line" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-line" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-2xl bg-line" />
        </div>
      }
    >
      <DeveloperDashboardClient />
    </Suspense>
  );
}
