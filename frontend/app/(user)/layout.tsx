import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar }  from '@/components/layout/Topbar';

// Nonaktifkan Partial Prerender untuk seluruh subtree (user) —
// sama dengan pola admin/layout.tsx — agar Client Component hooks
// (usePathname, useAuth) di Sidebar & Topbar tidak dieksekusi saat prerender.
export const instant = false;

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar desktop (fixed kiri, w-64, lg ke atas) +
          Hamburger button mobile (fixed, z-30, lg:hidden) +
          Mobile drawer — semua dirender dari komponen Sidebar */}
      <Sidebar variant="user" />

      {/* Area kanan sidebar */}
      <div className="flex min-h-screen flex-col lg:ml-64">
        <Topbar />
        <main
          id="main-content"
          className="flex-1 p-4 pb-8 sm:p-6 lg:pb-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
