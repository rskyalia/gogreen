import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { UserBottomNav } from '@/components/layout/UserBottomNav';

// Nonaktifkan Partial Prerender untuk seluruh subtree (user) —
// sama dengan pola admin/layout.tsx — agar Client Component hooks
// (usePathname, useAuth) di Sidebar & Topbar tidak dieksekusi saat prerender.
export const instant = false;

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar desktop — fixed kiri, w-64, hanya muncul lg ke atas */}
      <Sidebar variant="user" />

      {/* Area kanan sidebar */}
      <div className="flex min-h-screen flex-col lg:ml-64">
        <Topbar />
        <main
          id="main-content"
          className="flex-1 p-4 pb-24 sm:p-6 lg:pb-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <Suspense fallback={null}>
        <UserBottomNav />
      </Suspense>
    </div>
  );
}
