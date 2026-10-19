import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Bypassed sementara agar bisa membuka halaman dashboard langsung
  return NextResponse.next();
}

export const config = {
  matcher: ['/community/:path*'],
};