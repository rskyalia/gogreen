import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GO GREEN — Masuk / Daftar',
};

/**
 * Layout untuk halaman auth (/login, /register).
 * Tampilan terpusat dengan background hijau gradient.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-600 text-white text-2xl mb-3">
            🌿
          </div>
          <h1 className="text-2xl font-bold text-green-800 tracking-tight">GO GREEN</h1>
          <p className="text-sm text-green-600 mt-1">Platform Pengelolaan Sampah Cerdas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-green-100/60 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
