"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import EditProfileView from "@/components/dashboard/EditProfileView";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace("/login");
            return;
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return (
            <div className="grid min-h-screen place-items-center bg-paper text-sm text-muted">
                Memuat...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <EditProfileView onBack={() => router.back()} />
        </div>
    );
}