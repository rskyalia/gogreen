import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GO GREEN — Masuk / Daftar',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">GO GREEN</h1>
          <p className="text-sm text-gray-500 mt-1">Platform Pengelolaan Sampah Cerdas</p>
        </div>
        {children}
      </div>
    </div>
  );
}
