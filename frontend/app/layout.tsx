import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Newsreader } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';


const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-jakarta',
});

const newsreader = Newsreader({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-newsreader',
});


export const metadata: Metadata = {
  title:       'GO GREEN',
  description: 'Platform AI untuk pemindaian dan pengelolaan sampah.',
};

/* ─── Root layout ────────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${newsreader.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
