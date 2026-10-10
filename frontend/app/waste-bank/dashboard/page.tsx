'use client';

import { useAuth } from '@/context/AuthContext';

export default function WasteBankDashboard() {
  const { user, logout } = useAuth();
  const wb = user?.waste_bank;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-lg p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Dashboard Bank Sampah</h1>
            <p className="text-sm text-gray-500">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Keluar
          </button>
        </div>

        {wb ? (
          <>
            {wb.verification_status !== 'verified' && (
              <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Bank sampah belum terverifikasi. Menunggu persetujuan developer.
              </p>
            )}

            <table className="w-full text-sm">
              <tbody>
                <Row label="Nama Bank"    value={wb.name} />
                <Row label="Alamat"       value={wb.address} />
                <Row label="Telepon"      value={wb.phone} />
                <Row label="Status"       value={
                  wb.verification_status === 'verified'
                    ? 'Terverifikasi'
                    : wb.verification_status === 'rejected'
                      ? 'Ditolak'
                      : 'Menunggu verifikasi'
                } />
                <Row label="Buka Hari Ini" value={wb.is_open ? 'Buka' : 'Tutup'} />
              </tbody>
            </table>
          </>
        ) : (
          <p className="text-sm text-gray-500">Data bank sampah tidak ditemukan.</p>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 pr-4 text-gray-500 w-36 align-top">{label}</td>
      <td className="py-2 text-gray-800">{value}</td>
    </tr>
  );
}
