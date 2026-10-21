/**
 * Dashboard menggunakan DashboardShell yang sudah punya layout sendiri
 * (sidebar, topbar, bottom nav). Layout (user) yang membungkus Topbar
 * dan UserBottomNav di-bypass di sini agar tidak double.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
