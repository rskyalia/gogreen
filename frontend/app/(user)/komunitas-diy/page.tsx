"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DiyView from "@/components/dashboard/DIYview";

function KomunitasDiyContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("guide");
  return <DiyView initialId={initialId} />;
}

export default function KomunitasDiyPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "user") { router.replace("/"); return; }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== "user") {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-sm text-muted">
        Memuat…
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-3xl border border-line bg-mist" />
        ))}
      </div>
    }>
      <KomunitasDiyContent />
    </Suspense>
  );
}
