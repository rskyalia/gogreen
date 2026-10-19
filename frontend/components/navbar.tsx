"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getDashboardPath } from "@/lib/auth";

const links = [
    { label: "Beranda", href: "#beranda" },
    { label: "Kategori", href: "#kategori" },
    { label: "Postingan", href: "#postingan" },
    { label: "Komunitas DIY", href: "#komunitas" },
    { label: "Bank Sampah", href: "#bank-sampah" },
    { label: "Gamifikasi", href: "#gamifikasi" },
    // { label: "Contact", href: "#contact" },
];

function LogoMark() {
    return (
        <span className="grid size-9 place-items-center rounded-full bg-forest text-mint">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                <path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Z" />
                <path
                    d="M5 19c3-4 6-7 10-9"
                    stroke="#0b4d36"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                />
            </svg>
        </span>
    );
}

function AuthActions({ mobile = false }: { mobile?: boolean }) {
    const { user, isLoading, logout } = useAuth();

    const outline = `rounded-full border border-forest/30 text-sm font-semibold text-forest transition-colors hover:bg-mist ${mobile ? "flex-1 py-2 text-center" : "px-4 py-2"
        }`;
    const filled = `rounded-full bg-forest text-sm font-semibold text-white transition-colors hover:bg-forest-deep ${mobile ? "flex-1 py-2 text-center" : "px-4 py-2"
        }`;

    if (isLoading) {
        return <div className={mobile ? "h-9 w-full" : "h-9 w-40"} aria-hidden />;
    }

    if (user) {
        return (
            <>
                <Link href={getDashboardPath(user.role)} className={filled}>
                    Dashboard
                </Link>
                <button type="button" onClick={logout} className={outline}>
                    Keluar
                </button>
            </>
        );
    }

    return (
        <>
            <Link href="/login" className={outline}>
                Masuk
            </Link>
            <Link href="/register" className={filled}>
                Daftar
            </Link>
        </>
    );
}

export default function Navbar() {
    return (
        <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
                <Link href="/" className="flex items-center justify-center gap-2.5">
                    <LogoMark />
                    <span className="font-serif text-lg font-semibold text-forest leading-5">
                        Go Green Innovation
                    </span>
                </Link>

                <nav className="hidden items-center gap-6 lg:flex" aria-label="Utama">
                    {links.map((l) => (
                        <a
                            key={l.href}
                            href={l.href}
                            className="text-sm font-medium text-ink/80 transition-colors hover:text-forest"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 lg:flex">
                    <AuthActions />
                </div>

                <details className="relative lg:hidden">
                    <summary
                        className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-line text-forest [&::-webkit-details-marker]:hidden"
                        aria-label="Buka menu"
                    >
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                            <path d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    </summary>
                    <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-line bg-white p-3">
                        {links.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-mist"
                            >
                                {l.label}
                            </a>
                        ))}
                        <div className="mt-2 flex gap-2 border-t border-line pt-3">
                            <AuthActions mobile />
                        </div>
                    </div>
                </details>
            </div>
        </header>
    );
}