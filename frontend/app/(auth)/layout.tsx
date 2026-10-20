import type { Metadata } from 'next';
import Link from 'next/link';
import { Leaf, MapPin, ScanLine, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Go Green Innovation | Masuk / Daftar',
};

const points = [
  { text: 'Pilah sampah lewat foto', Icon: ScanLine },
  { text: 'Tutorial dari komunitas DIY', Icon: Users },
  { text: 'Temukan bank sampah terdekat', Icon: MapPin },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className={`grid size-9 place-items-center rounded-full ${light ? 'bg-white/15 text-mint' : 'bg-forest text-mint'
          }`}
      >
        <Leaf className="size-5" aria-hidden />
      </span>
      <span className={`font-serif text-lg font-semibold ${light ? 'text-white' : 'text-forest'}`}>
        Go Green Innovation
      </span>
    </Link>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-forest text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:p-12">
        <span className="absolute -right-24 -top-24 size-80 rounded-full bg-white/5" />
        <span className="absolute -bottom-32 -left-20 size-96 rounded-full bg-white/5" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-md">
          <p className="font-serif italic text-mint">Dream It. Build It. Change It.</p>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight">
            Foto sampahmu, lalu cari tahu bisa jadi apa
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map(({ text, Icon }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-mint">
                <span className="grid size-9 place-items-center rounded-full bg-white/10">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-mint/80">Platform pengelolaan sampah cerdas</p>
      </aside>

      <div className="flex min-h-screen flex-col lg:min-h-0">
        <header className="px-5 py-5 lg:hidden">
          <Logo />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-10 lg:py-12">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}