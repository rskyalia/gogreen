"use client";

import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, MapPin, Key, Save, ArrowLeft, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, uploadForm, firstError } from "@/lib/api";

interface EditProfileViewProps {
    onBack: () => void;
}

export default function EditProfileView({ onBack }: EditProfileViewProps) {
    const { user, refreshUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [address, setAddress] = useState(user?.address || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // State Foto / Avatar
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(
        user?.avatar_url || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=15803d&color=fff&bold=true`
    );

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
            setPhone(user.phone || "");
            setAddress(user.address || "");
            if (user.avatar_url || user.avatar) {
                setAvatarPreview(user.avatar_url || user.avatar || "");
            }
        }
    }, [user]);

    // Handler Pilih Foto dari Perangkat
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setErrorMsg("Ukuran foto maksimal 2MB.");
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setErrorMsg(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMsg(false);
        setErrorMsg(null);

        try {
            const isWasteBank = user?.role === "waste_bank";
            const endpoint = isWasteBank ? "/waste-bank/profile" : "/me";

            // Jika ada upload foto file baru, gunakan multipart FormData
            if (avatarFile) {
                const formData = new FormData();
                formData.append("name", name);
                formData.append("email", email);
                formData.append("phone", phone);
                formData.append("address", address);
                formData.append("avatar", avatarFile);

                if (newPassword) {
                    formData.append("current_password", currentPassword);
                    formData.append("password", newPassword);
                    formData.append("password_confirmation", newPassword);
                }

                await uploadForm(endpoint, formData);
            } else {
                // Jika tidak ada upload file baru, gunakan payload JSON standar
                const payload: Record<string, any> = { name, email, phone, address };
                if (newPassword) {
                    payload.current_password = currentPassword;
                    payload.password = newPassword;
                    payload.password_confirmation = newPassword;
                }
                await api.put(endpoint, payload);
            }

            await refreshUser();
            setSuccessMsg(true);
            setCurrentPassword("");
            setNewPassword("");
            setTimeout(() => setSuccessMsg(false), 4000);
        } catch (err: any) {
            setErrorMsg(firstError(err, "Gagal memperbarui profil. Silakan periksa kembali data Anda."));
        } finally {
            setIsSaving(false);
        }
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
                    <p className="text-xs text-muted">Perbarui foto, data diri, dan keamanan akun Anda</p>
                </div>
            </div>

            {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-forest/10 p-4 text-sm font-semibold text-forest border border-forest/20">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span>Profil berhasil diperbarui.</span>
                </div>
            )}

            {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-600 border border-rose-200">
                    <AlertCircle className="size-5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card: Foto Profil */}
                <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
                    <h2 className="text-sm font-bold text-ink border-b border-line pb-3">Foto Profil</h2>

                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="relative flex h-20 w-20 shrink-0 overflow-hidden items-center justify-center rounded-full bg-forest text-2xl font-bold text-white shadow-md">
                                <img src={avatarPreview} alt={name} className="h-full w-full object-cover" />
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full bg-forest text-white border-2 border-white shadow hover:bg-forest/90 transition-colors"
                                aria-label="Ubah foto"
                            >
                                <Camera className="size-3.5" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink hover:bg-mist transition-colors"
                            >
                                Pilih Foto Baru
                            </button>
                            <p className="text-[11px] text-muted">JPG, PNG, atau WEBP. Maksimal 2MB.</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>

                {/* Card: Informasi Pribadi */}
                <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
                    <h2 className="text-sm font-bold text-ink border-b border-line pb-3">Informasi Pribadi</h2>

                    <div>
                        <label className="block text-xs font-semibold text-ink mb-1.5">Nama Lengkap / Instansi</label>
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

                    <div>
                        <label className="block text-xs font-semibold text-ink mb-1.5">Alamat Lengkap</label>
                        <div className="relative">
                            <MapPin className="absolute left-3.5 top-3 size-4 text-muted" />
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-4 text-sm text-ink focus:border-forest focus:bg-white focus:outline-none transition-colors"
                                placeholder="Alamat domisili / operasional Anda"
                            />
                        </div>
                    </div>
                </div>

                {/* Card: Keamanan */}
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

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mist transition-colors sm:w-auto"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest/90 disabled:opacity-50 transition-colors sm:w-auto"
                    >
                        <Save className="size-4" />
                        {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </div>
    );
}