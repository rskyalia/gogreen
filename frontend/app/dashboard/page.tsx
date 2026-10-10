'use client';

import { useAuth } from '@/context/AuthContext';

export default function UserDashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Dashboard Warga 🌿</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang, {user?.name}!</p>
          </div>
          <button onClick={logout}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition">
            Keluar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Poin Saya"    value={String(user?.points_balance ?? 0)} emoji="⭐" color="green" />
          <StatCard label="Kode Member"  value={user?.member_code ?? '-'}          emoji="🪪"  color="emerald" />
        </div>

        <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-sm text-green-700">
          💡 Tunjukkan kode member kamu ke petugas bank sampah saat menyetor sampah.
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, emoji, color }: {
  label: string; value: string; emoji: string;
  color: 'green' | 'emerald';
}) {
  const cls = color === 'green'
    ? 'bg-green-50 border-green-100 text-green-800'
    : 'bg-emerald-50 border-emerald-100 text-emerald-800';
  return (
    <div className={`rounded-xl border p-5 ${cls}`}>
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
