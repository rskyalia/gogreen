"use client";

import { useCallback, useEffect, useState } from "react";
import { AdvancedMarker, APIProvider, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { LocateFixed, MapPin } from "lucide-react";
import { api } from "@/lib/api";

declare const google: any;

type LatLng = { lat: number; lng: number };

type Bank = {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    is_open: boolean;
    is_open_now: boolean;
    today_hours: string | null;
    distance_km: number | null;
    accepted_categories: { id: number; name: string; slug: string; icon: string | null }[];
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

const FALLBACK: LatLng = { lat: -6.2088, lng: 106.8456 };
const RADIUS_KM = 20;

const formatKm = (km: number) =>
    `${km.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;

function Finder() {
    const map = useMap();

    const [origin, setOrigin] = useState<LatLng | null>(null);
    const [geoMessage, setGeoMessage] = useState<string | null>(null);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

    useEffect(() => {
        let cancelled = false;
        setStatus("loading");

        const params = new URLSearchParams({ per_page: "20" });
        if (origin) {
            params.set("lat", String(origin.lat));
            params.set("lng", String(origin.lng));
            params.set("radius_km", String(RADIUS_KM));
        }

        api
            .get<{ data: Bank[] }>(`/user/waste-banks?${params.toString()}`)
            .then(({ data }) => {
                if (cancelled) return;
                setBanks(data);
                setActiveId(data[0]?.id ?? null);
                setStatus("ready");
            })
            .catch(() => {
                if (!cancelled) setStatus("error");
            });

        return () => {
            cancelled = true;
        };
    }, [origin]);

    useEffect(() => {
        if (!map) return;
        if (banks.length === 0) {
            map.panTo(origin ?? FALLBACK);
            return;
        }
        const bounds = new google.maps.LatLngBounds();
        banks.forEach((b) => bounds.extend({ lat: b.latitude, lng: b.longitude }));
        if (origin) bounds.extend(origin);
        map.fitBounds(bounds, 56);
    }, [map, banks, origin]);

    const select = useCallback(
        (bank: Bank) => {
            setActiveId(bank.id);
            map?.panTo({ lat: bank.latitude, lng: bank.longitude });
        },
        [map],
    );

    const locate = () => {
        if (!navigator.geolocation) {
            setGeoMessage("Browser ini tidak mendukung lokasi.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoMessage(null);
            },
            () => setGeoMessage("Izin lokasi ditolak, jadi daftar belum diurutkan dari yang terdekat."),
            { timeout: 10000 },
        );
    };

    return (
        <section className="rounded-xl border border-line bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="font-serif text-xl font-medium text-forest">Bank sampah terdekat</h2>
                    <p className="mt-1 text-sm text-muted">
                        {geoMessage ??
                            (origin
                                ? `Bank sampah terverifikasi dalam radius ${RADIUS_KM} km, diurutkan dari yang paling dekat.`
                                : "Menampilkan bank sampah terverifikasi. Aktifkan lokasi untuk mengurutkan dari yang terdekat.")}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={locate}
                    className="flex items-center gap-2 rounded-xl border border-forest/30 px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                >
                    <LocateFixed className="size-4" aria-hidden />
                    Gunakan lokasiku
                </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
                <ul className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1" aria-live="polite">
                    {status === "loading" && <li className="text-sm text-muted">Mencari bank sampah...</li>}
                    {status === "error" && (
                        <li className="text-sm text-muted">Data bank sampah gagal dimuat. Coba muat ulang halaman.</li>
                    )}
                    {status === "ready" && banks.length === 0 && (
                        <li className="text-sm text-muted">
                            {origin
                                ? `Belum ada bank sampah terverifikasi dalam radius ${RADIUS_KM} km dari lokasimu.`
                                : "Belum ada bank sampah terverifikasi."}
                        </li>
                    )}
                    {status === "ready" &&
                        banks.map((b) => {
                            const on = b.id === activeId;
                            return (
                                <li
                                    key={b.id}
                                    className={`rounded-xl border transition-colors ${on ? "border-forest bg-mist" : "border-line bg-white hover:bg-mist/50"
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => select(b)}
                                        aria-pressed={on}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                                    >
                                        <MapPin className={`size-5 shrink-0 ${on ? "text-forest" : "text-leaf"}`} aria-hidden />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold leading-snug text-ink">{b.name}</span>
                                            <span
                                                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.is_open_now ? "bg-mint text-forest" : "bg-mist text-muted"
                                                    }`}
                                            >
                                                {b.is_open_now ? "Buka sekarang" : "Tutup"}
                                            </span>
                                        </span>
                                        {b.distance_km !== null && (
                                            <span className="shrink-0 text-sm font-medium text-forest">{formatKm(b.distance_km)}</span>
                                        )}
                                    </button>

                                    {on && (
                                        <div className="space-y-2 px-4 pb-3 pl-12 text-xs leading-relaxed text-muted">
                                            <p>{b.address}</p>
                                            <p>
                                                Hari ini:{" "}
                                                <span className="font-medium text-ink">{b.today_hours ?? "Jam belum diatur"}</span>
                                            </p>
                                            {b.accepted_categories.length > 0 && (
                                                <ul className="flex flex-wrap gap-1.5">
                                                    {b.accepted_categories.map((c) => (
                                                        <li key={c.id} className="rounded-full bg-white px-2.5 py-1 font-medium text-forest">
                                                            {c.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block font-semibold text-forest underline underline-offset-4"
                                            >
                                                Buka rute di Google Maps
                                            </a>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                </ul>

                <div className="h-[320px] overflow-hidden rounded-xl border border-line sm:h-[380px]">
                    <Map
                        mapId={MAP_ID}
                        defaultCenter={FALLBACK}
                        defaultZoom={11}
                        gestureHandling="cooperative"
                        streetViewControl={false}
                        mapTypeControl={false}
                        fullscreenControl={false}
                    >
                        {origin && (
                            <AdvancedMarker position={origin} title="Lokasimu">
                                <span className="block size-4 rounded-full border-2 border-white bg-sun-ink ring-4 ring-sun" />
                            </AdvancedMarker>
                        )}
                        {banks.map((b) => {
                            const on = b.id === activeId;
                            return (
                                <AdvancedMarker
                                    key={b.id}
                                    position={{ lat: b.latitude, lng: b.longitude }}
                                    title={b.name}
                                    zIndex={on ? 10 : 1}
                                    onClick={() => select(b)}
                                >
                                    <Pin
                                        background={on ? "#0b4d36" : b.is_open_now ? "#1f8a5b" : "#6b8279"}
                                        borderColor="#0a3f2d"
                                        glyphColor="#ffffff"
                                        scale={on ? 1.3 : 1}
                                    />
                                </AdvancedMarker>
                            );
                        })}
                    </Map>
                </div>
            </div>
        </section>
    );
}

export default function NearbyBankMap() {
    if (!API_KEY) {
        return (
            <section className="rounded-xl border border-dashed border-forest/30 bg-white p-6 text-sm leading-relaxed text-ink/80">
                Peta belum bisa ditampilkan. Isi{" "}
                <code className="rounded bg-mist px-1.5 py-0.5 text-forest">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> di{" "}
                <code className="rounded bg-mist px-1.5 py-0.5 text-forest">.env.local</code>, lalu restart dev server.
            </section>
        );
    }
    return (
        <APIProvider apiKey={API_KEY} language="id" region="ID">
            <Finder />
        </APIProvider>
    );
}