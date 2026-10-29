'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Submission } from '@/lib/submissons';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface MyPostsProps {
    items: Submission[];
    onUpload?: () => void;
}

export default function MyPosts({ items, onUpload }: MyPostsProps) {
    const totalSubmissions = items.length;
    const approvedSubmissions = items.filter((item) => item.status === 'approved').length;
    const totalPoints = items.reduce((acc, item) => acc + (item.pointsAwarded || 0), 0);

    return (
        <section className="space-y-6">
            {/* Header & Statistik Ringkas */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-serif text-xl font-medium text-forest sm:text-2xl">
                        Karya yang kamu kirim
                    </h2>
                    <p className="text-sm text-muted">
                        Status validasi dan poin dari tiap karya.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-forest">
                        {totalSubmissions} karya
                    </span>
                    <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-forest">
                        {approvedSubmissions} disetujui
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        +{totalPoints} poin
                    </span>
                </div>
            </div>

            {/* Grid Kartu Karya */}
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-line bg-white p-10 text-center">
                    <div className="grid size-12 place-items-center rounded-2xl bg-mist text-forest">
                        <ImageIcon className="size-6" />
                    </div>
                    <h3 className="mt-4 font-serif text-lg font-medium text-forest">
                        Belum ada karya yang diunggah
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted">
                        Yuk kirimkan hasil kreasi daur ulang sampahmu dan dapatkan poin hadiahnya!
                    </p>
                    {onUpload && (
                        <button
                            type="button"
                            onClick={onUpload}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest/90"
                        >
                            <Upload className="size-4" />
                            Upload Karya
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="group flex flex-col overflow-hidden rounded-[24px] border border-line bg-white transition-all hover:border-forest/30 hover:shadow-sm"
                        >
                            {/* Gambar & Badge Status */}
                            <div className="relative aspect-video w-full overflow-hidden bg-mist">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt="" // Kosongkan alt agar teks gambar tidak rontok menimpa UI saat 404
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            // Sembunyikan elemen img jika URL gambar 404
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                ) : null}

                                {/* Status Badge di atas gambar */}
                                <div className="absolute left-3 top-3 z-10">
                                    <StatusBadge status={item.status} />
                                </div>
                            </div>

                            {/* Konten Kartu */}
                            <div className="flex flex-1 flex-col justify-between p-5">
                                <div>
                                    <h3 className="line-clamp-1 font-serif text-base font-semibold text-forest">
                                        {item.title}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted">
                                        {item.category} • Dibuat{' '}
                                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                    {item.notes && (
                                        <p className="mt-2 line-clamp-2 text-xs text-ink/70">
                                            "{item.notes}"
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 border-t border-line pt-3">
                                    {item.status === 'approved' ? (
                                        <span className="text-xs font-semibold text-forest">
                                            +{item.pointsAwarded || item.rewardPoints} poin didapatkan
                                        </span>
                                    ) : item.status === 'rejected' ? (
                                        <span className="text-xs font-medium text-rose-600">
                                            {item.reviewNote || 'Karya belum memenuhi kriteria.'}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium text-muted">
                                            +{item.rewardPoints} poin setelah disetujui
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}