"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin, Key, Save, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface EditProfileViewProps {
    onBack: () => void;
}

export default function EditProfileView({ onBack }: EditProfileViewProps) {
    const { user } = useAuth();

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMsg(false);

        setTimeout(() => {
            setIsSaving(false);
            setSuccessMsg(true);
            setTimeout(() => setSuccessMsg(false), 4000);
        }, 800);
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink hover:bg-mist transition-colors"
                    aria-label="Kembali"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-ink">Edit Profil</h1>
                    <p className="text-xs text-muted">Perbarui informasi data diri dan keamanan akun Anda</p>
                </div>
            </div>

            {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-forest/10 p-4 text-sm font-semibold text-forest border border-forest/20">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span>Profil berhasil diperbarui (Simulasi UI).</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card: Data Diri */}
                <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
                    <h2 className="text-sm font-bold text-ink border-b border-line pb-3">Informasi Pribadi</h2>

                    <div>
                        <label className="block text-xs font-semibold text-ink mb-1.5">Nama Lengkap</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-4 text-sm text-ink focus:border-forest focus:bg-white focus:outline-none transition-colors"
                                placeholder="Nama Anda"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-ink mb-1.5">Alamat Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-4 text-sm text-ink focus:border-forest focus:bg-white focus:outline-none transition-colors"
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-ink mb-1.5">No. Telepon / WhatsApp</label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-4 text-sm text-ink focus:border-forest focus:bg-white focus:outline-none transition-colors"
                                placeholder="081234567890"
                            />
                        </div>
                    </div>

                </div>

                <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
                    <h2 className="text-sm font-bold text-ink border-b border-line pb-3">Ubah Kata Sandi (Opsional)</h2>

                    <div>
                        <label className="block text-xs font-semibold text-ink mb-1.5">Kata Sandi Saat Ini</label>
                        <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-4 text-sm text-ink focus:border-forest focus:bg-white focus:outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-ink mb-1.5">Kata Sandi Baru</label>
                        <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-4 text-sm text-ink focus:border-forest focus:bg-white focus:outline-none transition-colors"
                                placeholder="Minimal 8 karakter"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mist transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest/90 disabled:opacity-50 transition-colors"
                    >
                        <Save className="size-4" />
                        {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </div>
    );
}