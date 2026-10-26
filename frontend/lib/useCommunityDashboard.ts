"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchCommunityDashboard,
    type CommunityDashboard,
} from "./communityApi";

/**
 * Mengambil data dashboard dan memperbaruinya otomatis (polling).
 * - berhenti saat tab tidak terlihat, langsung refresh saat tab dibuka lagi
 * - tidak menumpuk request jika request sebelumnya belum selesai
 */
export function useCommunityDashboard(intervalMs = 5000) {
    const [data, setData] = useState<CommunityDashboard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const inFlight = useRef(false);

    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        try {
            const result = await fetchCommunityDashboard();
            setData(result);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal memuat data.");
        } finally {
            inFlight.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();

        const tick = () => {
            if (document.visibilityState === "visible") refresh();
        };
        const timer = setInterval(tick, intervalMs);
        document.addEventListener("visibilitychange", tick);

        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [refresh, intervalMs]);

    return { data, error, loading, refresh };
}