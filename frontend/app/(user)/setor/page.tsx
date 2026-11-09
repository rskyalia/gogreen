'use client';

import { useRouter } from 'next/navigation';
import SetoranBuatView from '@/components/dashboard/SetoranBuatView';

export default function SetoranPage() {
  const router = useRouter();

  return (
    <SetoranBuatView
      onGoHistory={() => router.push('/deposits')}
    />
  );
}
