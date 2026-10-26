"use client";

import Image from "next/image";
import { Check, Clock, ImagePlus, X, type LucideIcon } from "lucide-react";
import type { Submission, SubmissionStatus } from "@/lib/submissons";

const STATUS: Record<SubmissionStatus, { label: string; cls: string; Icon: LucideIcon }> = {
    pending: { label: "Menunggu validasi", cls: "bg-sun text-sun-ink", Icon: Clock },
    approved: { label: "Disetujui", cls: "bg-mint text-forest", Icon: Check },
    rejected: { label: "Ditolak", cls: "bg-red-50 text-red-700", Icon: X },
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function MyPosts({
    items,
    onUpload,
}: {
    items: Submission[];
    onUpload?: () => void;
}) {
    const approved = items.filter((s) => s.status === "approved");
    const points = approved.reduce((sum, s) => sum + s.pointsAwarded, 0);

    return (
        <section className="rounded-xl border border-line bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-serif text-xl font-medium text-forest">Karya yang kamu kirim</h2>
                    <p className="mt-1 text-sm text-muted">Status validasi dan poin dari tiap karya.</p>
                </div>
                {items.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-mint px-3 py-1 text-forest">{items.length} karya</span>
                        <span className="rounded-full bg-mist px-3 py-1 text-leaf">{approved.length} disetujui</span>
                        <span className="rounded-full bg-sun px-3 py-1 text-sun-ink">+{points} poin</span>
                    </div>
                )}
            </div>

            {items.length === 0 ? (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-forest/30 px-6 py-12 text-center">
                    <ImagePlus className="size-8 text-leaf" aria-hidden />
                    <p className="text-sm text-muted">Belum ada karya yang kamu kirim.</p>
                    {onUpload && (
                        <button
                            type="button"
                            onClick={onUpload}
                            className="rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                        >
                            Upload karya pertamamu
                        </button>
                    )}
                </div>
            ) : (
                <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((s) => {
                        const st = STATUS[s.status];
                        return (
                            <li key={s.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                                <div className={`relative aspect-[4/3] overflow-hidden ${s.tone}`}>
                                    {s.image ? (
                                        <Image
                                            src={s.image}
                                            alt={s.title}
                                            fill
                                            unoptimized
                                            sizes="(min-width: 1024px) 320px, 50vw"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <>
                                            <span className="absolute -right-8 -top-8 size-32 rounded-full bg-white/25" />
                                            <span className="absolute -bottom-10 -left-6 size-28 rounded-full bg-white/20" />
                                            <s.Icon
                                                className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 opacity-70"
                                                strokeWidth={1.25}
                                                aria-hidden
                                            />
                                        </>
                                    )}
                                    <span className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>
                                        <st.Icon className="size-3.5" aria-hidden />
                                        {st.label}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-serif text-lg font-medium leading-snug text-forest">{s.title}</h3>
                                    <p className="mt-1 text-xs text-muted">
                                        {s.category} · Dikirim {formatDate(s.createdAt)}
                                    </p>
                                    <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
                                        {s.status === "approved" && (
                                            <span className="font-semibold text-leaf">+{s.pointsAwarded} poin diterima</span>
                                        )}
                                        {s.status === "pending" &&
                                            (s.rewardPoints > 0 ? `+${s.rewardPoints} poin setelah disetujui` : "Menunggu pengecekan")}
                                        {s.status === "rejected" && (
                                            <span className="text-red-700">Alasan: {s.reviewNote ?? "-"}</span>
                                        )}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}