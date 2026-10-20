import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar }  from '@/components/layout/Topbar';

export const instant = false;

export default function WasteBankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* variant adalah string plain — aman dilewat dari Server → Client Component */}
      <Sidebar variant="waste_bank" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
