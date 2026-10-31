"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ImpactView from "@/components/dashboard/impactview";
import { fetchMySubmissions, type Submission } from "@/lib/submissons";
import { Skeleton } from "@/components/ui/LoadingSkeleton";

export default function DampakSayaPage() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchMySubmissions();
            setSubmissions(data);
        } catch (err) {
            console.error("Gagal memuat data dampak saya:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
            <ImpactView
                submissions={submissions}
                onUpload={() => router.push("/upload-karya")}
            />
        </div>
    );
}