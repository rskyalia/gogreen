import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export const instant = false;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* variant adalah string plain — aman dilewat dari Server → Client Component */}
      <Sidebar variant="developer" />

      <div className="min-w-0 lg:ml-64">
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1600px] p-5 pb-28 sm:p-8 lg:px-10 lg:py-8 lg:pb-10"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}