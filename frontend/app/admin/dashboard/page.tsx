'use client';

import { useAuth } from '@/context/AuthContext';

export default function DeveloperDashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Developer Dashboard 🛡️</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang, {user?.name}</p>
          </div>
          <button onClick={logout}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition">
            Keluar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Verifikasi Bank Sampah', path: '/admin/waste-banks',  emoji: '🏦' },
            { label: 'Kelola Pengguna',        path: '/admin/users',        emoji: '👥' },
            { label: 'Monitor AI / ML Logs',   path: '/admin/ml-logs',      emoji: '🤖' },
            { label: 'Kelola Reward',          path: '/admin/rewards',      emoji: '🎁' },
          ].map((item) => (
            <a key={item.path} href={item.path}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100
                bg-slate-50 hover:bg-slate-100 transition">
              <span className="text-xl">{item.emoji}</span>
              <span className="font-medium text-slate-700">{item.label}</span>
            </a>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Panel admin GO GREEN — hanya dapat diakses oleh developer.
        </p>
      </div>
    </main>
  );
}
