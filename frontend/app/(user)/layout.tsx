import { Topbar } from '@/components/layout/Topbar';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Topbar />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto p-6"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
