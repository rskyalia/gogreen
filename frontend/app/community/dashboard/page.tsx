'use client';

import { useAuth } from '@/context/AuthContext';

export default function CommunityDashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-teal-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-teal-800">Dashboard Komunitas 🌱</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang, {user?.name}!</p>
          </div>
          <button onClick={logout}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition">
            Keluar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Panduan DIY Saya',       path: '/community/diy-guides',        emoji: '✂️' },
            { label: 'Buat Panduan Baru',       path: '/community/diy-guides/new',    emoji: '✏️' },
            { label: 'Permintaan Material',     path: '/community/material-requests', emoji: '📦' },
            { label: 'Review Submission',       path: '/community/submissions',       emoji: '📋' },
          ].map((item) => (
            <a key={item.path} href={item.path}
              className="flex items-center gap-3 p-4 rounded-xl border border-teal-100
                bg-teal-50 hover:bg-teal-100 transition">
              <span className="text-xl">{item.emoji}</span>
              <span className="font-medium text-teal-700">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
