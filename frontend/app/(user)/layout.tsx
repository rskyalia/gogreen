import { Suspense } from 'react';
import { UserBottomNav } from '@/components/layout/UserBottomNav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <main
        id="main-content"
        className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 sm:pb-6"
        tabIndex={-1}
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <UserBottomNav />
      </Suspense>
    </div>
  );
}