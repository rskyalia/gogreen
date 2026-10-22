"use client";

import "../globals.css";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  PackagePlus,
  LogOut,
  Bell,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";

// Interface untuk tipe data Notifikasi Pengajuan
interface NotificationItem {
  id: string;
  authorName: string;
  title: string;
  time: string;
  isRead: boolean;
  status: "pending" | "approved" | "rejected";
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <CommunityLayoutContent>{children}</CommunityLayoutContent>
    </Suspense>
  );
}

function CommunityLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth(); // 👈 Panggil hook useAuth

  // State logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State Notifikasi
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dummy Data Notifikasi Pengajuan Karya dari Warga
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      authorName: "Budi Santoso",
      title: "Mengajukan karya: Pot Bunga dari Botol Plastik Bekas",
      time: "10 menit yang lalu",
      isRead: false,
      status: "pending",
    },
    {
      id: "2",
      authorName: "Siti Rahma",
      title: "Mengajukan karya: Lampu Hias dari Bambu Daur Ulang",
      time: "1 jam yang lalu",
      isRead: false,
      status: "pending",
    },
    {
      id: "3",
      authorName: "Ahmad Fauzi",
      title: "Mengajukan karya: Kompostor Sederhana Skala Rumah Tangga",
      time: "3 jam yang lalu",
      isRead: true,
      status: "approved",
    },
  ]);

  // Hitung berapa notifikasi yang belum dibaca
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  // Sembunyikan dropdown saat klik di luar area bel/dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handler untuk menandai semua notifikasi sudah dibaca
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true }))
    );
  };

  // Handler aksi validasi karya langsung dari notifikasi
  const handleAction = (id: string, action: "approved" | "rejected") => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: action, isRead: true } : item
      )
    );
  };

  // 🔴 PERBAIKAN LOGOUT MENGGUNAKAN AUTHCONTEXT
  const confirmLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error("Error saat proses logout:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      window.location.href = "/";
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
      <header className="bg-white border-b border-[#d7e6dd] sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-2xs">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0b4d36] text-white font-extrabold text-sm rounded-xl flex items-center justify-center tracking-tight shadow-xs">
            GG
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="font-sans font-bold text-base text-[#0b4d36] tracking-wide uppercase">
              GO GREEN
            </span>
            <span className="text-xs text-[#6b8279] font-normal mt-0.5">
              Komunitas
            </span>
          </div>
        </div>

        {/* Profile, Notifikasi & Tombol Keluar */}
        <div className="flex items-center gap-4">
          {/* Container Tombol & Pop-up Notifikasi */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              title="Notifikasi Pengajuan Karya"
              className="p-2 text-[#6b8279] hover:bg-[#e1f3e9] hover:text-[#0b4d36] rounded-full transition-all relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {/* Badge Jumlah Notifikasi Belum Dibaca */}
              {unreadCount > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full absolute -top-0.5 -right-0.5 flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Menu Pop-up Dropdown Notifikasi */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#d7e6dd] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-4 border-b border-[#d7e6dd] flex items-center justify-between bg-[#f5faf7]">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#1d3b2f] uppercase tracking-wider">
                      Pengajuan Karya Warga
                    </h4>
                    {unreadCount > 0 && (
                      <span className="bg-[#1f8a5b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[#1f8a5b] hover:underline font-semibold cursor-pointer"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#edf4f0]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#6b8279]">
                      Belum ada pengajuan karya dari warga.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 transition-all ${
                          !item.isRead ? "bg-[#e1f3e9]/40" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#cfeedd] text-[#0b4d36] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-[#0b4d36]" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-[#1d3b2f]">
                                {item.authorName}
                              </p>
                              <span className="text-[10px] text-[#6b8279]">
                                {item.time}
                              </span>
                            </div>
                            <p className="text-xs text-[#426355] leading-snug">
                              {item.title}
                            </p>

                            {/* Tombol Aksi Langsung atau Indicator Status */}
                            <div className="pt-1.5 flex items-center justify-between">
                              {item.status === "pending" ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAction(item.id, "approved")}
                                    className="px-2.5 py-1 bg-[#0b4d36] hover:bg-[#1f8a5b] text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Terima
                                  </button>
                                  <button
                                    onClick={() => handleAction(item.id, "rejected")}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-red-200"
                                  >
                                    <XCircle className="w-3 h-3" /> Tolak
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    item.status === "approved"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {item.status === "approved"
                                    ? "Disetujui"
                                    : "Ditolak"}
                                </span>
                              )}

                              <Link
                                href="/community/submissions"
                                onClick={() => setShowNotifications(false)}
                                className="text-[10px] text-[#1f8a5b] font-bold hover:underline"
                              >
                                Tinjau Detail →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 border-t border-[#d7e6dd] bg-[#f5faf7] text-center">
                  <Link
                    href="/community/submissions"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-[#0b4d36] hover:underline block py-1"
                  >
                    Lihat Semua Validasi Karya
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Badge */}
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