"use client";

import { useRouter } from "next/navigation";
import SetoranView from "@/components/dashboard/SetoranView";

export default function UploadKaryaPage() {
    const router = useRouter();

    return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
            <SetoranView
                onDone={() => router.push("/dampak-saya")}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}