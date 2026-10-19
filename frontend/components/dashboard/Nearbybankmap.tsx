"use client";

import { useCallback, useEffect, useState } from "react";
import {
    AdvancedMarker,
    APIProvider,
    Map,
    Pin,
    useMap,
    useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { LocateFixed, MapPin } from "lucide-react";

type LatLng = { lat: number; lng: number };

type Bank = {
    id: string;
    name: string;
    address: string;
    position: LatLng;
    distanceKm: number;
    mapsUrl?: string;
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

const FALLBACK: LatLng = { lat: -6.2088, lng: 106.8456 };
const FALLBACK_LABEL = "Jakarta";

function distanceKm(a: LatLng, b: LatLng) {
    const R = 6371;
    const rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

const formatKm = (km: number) =>
    `${km.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;

function Finder() {
    const map = useMap();
    const placesLib = useMapsLibrary("places");

    const [origin, setOrigin] = useState<LatLng>(FALLBACK);
    const [located, setLocated] = useState(false);
    const [geoMessage, setGeoMessage] = useState<string | null>(null);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

    useEffect(() => {
        if (!placesLib) return;
        let cancelled = false;
        setStatus("loading");

        placesLib.Place.searchByText({
            textQuery: "bank sampah",
            fields: ["id", "displayName", "formattedAddress", "location", "googleMapsURI"],
            locationBias: origin,
            maxResultCount: 5,
            language: "id",
            region: "id",
        })
            .then(({ places }) => {
                if (cancelled) return;
                const list: Bank[] = places
                    .flatMap((p) => {
                        if (!p.id || !p.location) return [];
                        const position = { lat: p.location.lat(), lng: p.location.lng() };
                        return [
                            {
                                id: p.id,
                                name: p.displayName ?? "Bank sampah",
                                address: p.formattedAddress ?? "",
                                position,
                                distanceKm: distanceKm(origin, position),
                                mapsUrl: p.googleMapsURI ?? undefined,
                            },
                        ];
                    })
                    .sort((a, b) => a.distanceKm - b.distanceKm);
                setBanks(list);
                setActiveId(list[0]?.id ?? null);
                setStatus("ready");
            })
            .catch(() => {
                if (!cancelled) setStatus("error");
            });

        return () => {
            cancelled = true;
        };
    }, [placesLib, origin]);

    useEffect(() => {
        if (!map) return;
        if (banks.length === 0) {
            map.panTo(origin);
            return;
        }
        const bounds = new google.maps.LatLngBounds(origin);
        banks.forEach((b) => bounds.extend(b.position));
        map.fitBounds(bounds, 56);
    }, [map, banks, origin]);

    const select = useCallback(
        (bank: Bank) => {
            setActiveId(bank.id);
            map?.panTo(bank.position);
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
                setLocated(true);
                setGeoMessage(null);
            },
            () => setGeoMessage("Izin lokasi ditolak, jadi yang tampil masih area contoh."),
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
                            (located
                                ? "Diurutkan dari yang paling dekat dengan lokasimu."
                                : `Menampilkan area contoh (${FALLBACK_LABEL}). Aktifkan lokasi untuk hasil di dekatmu.`)}
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

            <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
                <ul className="space-y-2.5" aria-live="polite">
                    {status === "loading" && <li className="text-sm text-muted">Mencari bank sampah...</li>}
                    {status === "error" && (
                        <li className="text-sm text-muted">Data bank sampah gagal dimuat. Coba muat ulang halaman.</li>
                    )}
                    {status === "ready" && banks.length === 0 && (
                        <li className="text-sm text-muted">Belum ada bank sampah yang ditemukan di sekitar sini.</li>
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
                                        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink">{b.name}</span>
                                        <span className="shrink-0 text-sm font-medium text-forest">{formatKm(b.distanceKm)}</span>
                                    </button>
                                    {on && (
                                        <div className="px-4 pb-3 pl-12 text-xs leading-relaxed text-muted">
                                            {b.address}
                                            {b.mapsUrl && (
                                                <a
                                                    href={b.mapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1.5 block font-semibold text-forest underline underline-offset-4"
                                                >
                                                    Buka di Google Maps
                                                </a>
                                            )}
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
                        defaultZoom={12}
                        gestureHandling="cooperative"
                        streetViewControl={false}
                        mapTypeControl={false}
                        fullscreenControl={false}
                    >
                        {located && (
                            <AdvancedMarker position={origin} title="Lokasimu">
                                <span className="block size-4 rounded-full border-2 border-white bg-sun-ink ring-4 ring-sun" />
                            </AdvancedMarker>
                        )}
                        {banks.map((b) => {
                            const on = b.id === activeId;
                            return (
                                <AdvancedMarker
                                    key={b.id}
                                    position={b.position}
                                    title={b.name}
                                    zIndex={on ? 10 : 1}
                                    onClick={() => select(b)}
                                >
                                    <Pin
                                        background={on ? "#0b4d36" : "#1f8a5b"}
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