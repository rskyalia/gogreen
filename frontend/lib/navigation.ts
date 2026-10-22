/**
 * lib/navigation.ts
 * Konfigurasi menu sidebar per role dalam satu tempat.
 * Impor WASTE_BANK_NAV atau DEVELOPER_NAV di layout masing-masing.
 */

import {
  LayoutDashboard,
  ClipboardList,
  ArrowDownToLine,
  User,
  Package,
  CheckCircle,
  Users,
  Tag,
  BookOpen,
  Image,
  Gift,
  Activity,
  CreditCard,
  Coins,
  MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href:  string;
  icon:  LucideIcon;
}

export interface NavGroup {
  heading?: string;
  items:    NavItem[];
}

// ── Menu user (warga) ─────────────────────────────────────────────────────

export const USER_NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Kartu QR',       href: '/member-card',  icon: CreditCard      },
  { label: 'Bank Sampah',    href: '/waste-banks',  icon: MapPin          },
  { label: 'Riwayat Setor',  href: '/deposits',     icon: ArrowDownToLine },
  { label: 'Riwayat Poin',   href: '/points',       icon: Coins           },
];

// ── Menu bank sampah ──────────────────────────────────────────────────────
export const WASTE_BANK_NAV: NavItem[] = [
  { label: 'Ringkasan',      href: '/waste-bank/dashboard',         icon: LayoutDashboard },
  { label: 'Input Setoran',  href: '/waste-bank/deposits/new',      icon: ArrowDownToLine },
  { label: 'Rekapan',        href: '/waste-bank/deposits',          icon: ClipboardList   },
  { label: 'Profil',         href: '/waste-bank/profile',           icon: User            },
  { label: 'Request Bahan',  href: '/waste-bank/material-requests', icon: Package         },
];

// ── Menu developer ────────────────────────────────────────────────────────

export const DEVELOPER_NAV: NavItem[] = [
  { label: 'Ringkasan',        href: '/admin/dashboard',       icon: LayoutDashboard },
  { label: 'Verifikasi Mitra', href: '/admin/waste-banks',     icon: CheckCircle     },
  { label: 'Pengguna',         href: '/admin/users',           icon: Users           },
  { label: 'Kategori Sampah',  href: '/admin/categories',      icon: Tag             },
  { label: 'Panduan DIY',      href: '/admin/diy-guides',      icon: BookOpen        },
  { label: 'Validasi Karya',   href: '/admin/diy-submissions', icon: Image           },
  { label: 'Katalog Reward',   href: '/admin/rewards',         icon: Gift            },
  { label: 'Pantau API ML',    href: '/admin/ml-logs',         icon: Activity        },
];
