"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import OverviewView from "@/components/dashboard/overviewView";

export default function DashboardPage() {
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
    <OverviewView
      name={user.name.split(" ")[0]}
      onScan={() => router.push("/scan")}
    />
  );
}
