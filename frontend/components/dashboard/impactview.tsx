import MyPosts from "@/components/dashboard/MyPosts";
import type { Submission } from "@/lib/submissons";

const week = [
    { day: "Sen", kg: 1.2 },
    { day: "Sel", kg: 2.4 },
    { day: "Rab", kg: 0.6 },
    { day: "Kam", kg: 3.1 },
    { day: "Jum", kg: 1.8 },
    { day: "Sab", kg: 2.9 },
    { day: "Min", kg: 0.4 },
];
const max = Math.max(...week.map((w) => w.kg));

export default function ImpactView({
    submissions,
    onUpload,
}: {
    submissions: Submission[];
    onUpload?: () => void;
}) {
    return (
        <div className="space-y-5">
            <h1 className="font-serif text-2xl font-medium text-forest sm:text-3xl">Dampak saya</h1>
            <section className="rounded-[28px] border border-line bg-white p-5 sm:p-8">
                <p className="text-sm text-muted">Sampah dipilah minggu ini</p>
                <p className="mt-1 font-serif text-3xl font-medium text-forest">
                    {week.reduce((s, w) => s + w.kg, 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg
                </p>
                <div className="mt-6 overflow-x-auto">
                    <ul className="flex h-44 min-w-[280px] items-end gap-2 sm:gap-3" aria-label="Grafik harian">
                        {week.map((w) => (
                            <li key={w.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                                <span className="text-[10px] tabular-nums text-muted">{w.kg}</span>
                                <div className="w-full rounded-t-lg bg-leaf" style={{ height: `${(w.kg / max) * 100}%` }} />
                                <span className="text-[11px] text-ink">{w.day}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
            <MyPosts items={submissions} onUpload={onUpload} />
        </div>
    );
}