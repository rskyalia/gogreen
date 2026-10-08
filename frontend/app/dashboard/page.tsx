'use client';

import { useAuth } from '@/context/AuthContext';

export default function CitizenDashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Dashboard Warga 🌿</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang, {user?.name}!</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition"
          >
            Keluar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Poin" value={String(user?.total_points ?? 0)} emoji="⭐" />
          <StatCard label="Role" value={user?.role ?? '-'} emoji="🙋" />
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-xl bg-green-50 border border-green-100 p-5">
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-xl font-bold text-green-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
