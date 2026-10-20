"use client";

import "../globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  PackagePlus,
  LogOut,
  Bell,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  X,
} from "lucide-react";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State untuk mengontrol tampilnya modal pop-up konfirmasi
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Eksekusi logout saat user menekan tombol "Ya, Keluar" di modal pop-up
  const confirmLogout = async () => {
    setIsLoggingOut(true);

    try {
      const token = localStorage.getItem("token");

      if (token) {
        await fetch("http://localhost:8000/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Error saat logout API:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setIsLoggingOut(false);
      setShowLogoutModal(false);

      // Redirect ke Landing Page
      router.push("/");
    }
  };

  const menuItems = [
    { name: "Ringkasan", href: "/community/dashboard", icon: LayoutDashboard },
    { name: "Panduan DIY", href: "/community/guides", icon: BookOpen },
    { name: "Validasi Karya", href: "/community/submissions", icon: CheckSquare },
    { name: "Request Bahan", href: "/community/material-requests", icon: PackagePlus },
  ];

  return (
    <div className="min-h-screen bg-[#f5faf7] flex flex-col font-sans text-[#1d3b2f]">
      {/* Top Header Navbar */}
      <header className="bg-white border-b border-[#d7e6dd] sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[#0b4d36] font-bold text-xl tracking-tight">
            <Leaf className="w-6 h-6 fill-[#1f8a5b] text-[#0b4d36]" />
            <span className="font-serif text-2xl">Go Green</span>
            <span className="text-[10px] bg-[#e1f3e9] text-[#0b4d36] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full border border-[#d7e6dd]">
              INNOVATION
            </span>
          </div>
        </div>

        {/* Profile, Notifikasi & Tombol Keluar */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-[#6b8279] hover:bg-[#e1f3e9] hover:text-[#0b4d36] rounded-full transition-all relative cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 bg-[#1f8a5b] rounded-full absolute top-1.5 right-1.5 ring-2 ring-white"></span>
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-[#d7e6dd]">
            <div className="w-9 h-9 bg-[#cfeedd] text-[#0b4d36] font-bold text-xs rounded-full flex items-center justify-center border border-[#d7e6dd] shadow-2xs">
              DIY
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#1d3b2f] flex items-center gap-1">
                Komunitas DIY <ShieldCheck className="w-3.5 h-3.5 text-[#1f8a5b]" />
              </p>
              <p className="text-[10px] text-[#6b8279] font-medium">
                Kurator & Kreator Karya
              </p>
            </div>
          </div>

          {/* Tombol Membuka Modal Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Keluar Sesi"
            className="flex items-center gap-2 pl-3 border-l border-[#d7e6dd] text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-[#d7e6dd] p-5 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]">
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b8279] px-3 mb-3">
                Menu Komunitas
              </p>
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[#0b4d36] text-white shadow-sm"
                          : "text-[#1d3b2f] hover:bg-[#e1f3e9] hover:text-[#0b4d36]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#1f8a5b]"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          {children}
        </main>
      </div>

      {/* Pop-up Modal Konfirmasi Keluar */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#d7e6dd] max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#6b8279] hover:bg-[#f5faf7] rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1d3b2f]">
                  Konfirmasi Keluar Sesi
                </h3>
                <p className="text-xs text-[#6b8279] leading-relaxed">
                  Apakah Anda yakin ingin keluar? Anda perlu login kembali untuk mengakses modul komunitas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#d7e6dd] text-xs font-bold text-[#1d3b2f] hover:bg-[#f5faf7] transition-all cursor-pointer disabled:opacity-50"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoggingOut ? "Keluar..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}