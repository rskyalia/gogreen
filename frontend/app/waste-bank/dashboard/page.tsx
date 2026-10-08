'use client';

import { useAuth } from '@/context/AuthContext';

export default function WasteBankDashboard() {
  const { user, logout } = useAuth();
  const wasteBank = user?.waste_bank;

  return (
    <main className="min-h-screen bg-emerald-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-emerald-800">Dashboard Bank Sampah 🏦</h1>
            <p className="text-gray-500 text-sm mt-1">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition"
          >
            Keluar
          </button>
        </div>

        {wasteBank ? (
          <div className="space-y-3 text-sm">
            <InfoRow label="Nama Bank" value={wasteBank.name} />
            <InfoRow label="Alamat" value={wasteBank.address} />
            <InfoRow label="Telepon" value={wasteBank.phone} />
            <InfoRow
              label="Status Verifikasi"
              value={wasteBank.is_verified ? '✅ Terverifikasi' : '⏳ Menunggu verifikasi admin'}
            />
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Data bank sampah belum tersedia.</p>
        )}
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
