'use client';

import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard 🛡️</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang, {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition"
          >
            Keluar
          </button>
        </div>

        <p className="text-gray-400 text-sm">
          Panel admin GO GREEN. Kelola pengguna, verifikasi bank sampah, dan monitor performa AI dari sini.
        </p>
      </div>
    </main>
  );
}
