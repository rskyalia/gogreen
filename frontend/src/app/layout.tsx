import './globals.css';

export const metadata = {
  title: 'Aplikasi Komunitas Daur Ulang',
  description: 'Modul kurasi dan validasi karya warga',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#f5faf7] text-[#1d3b2f] antialiased">
        {children}
      </body>
    </html>
  );
}