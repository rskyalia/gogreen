'use client';

/**
 * MapPicker — Leaflet map untuk memilih koordinat.
 * Dimuat secara lazy (dynamic import) karena Leaflet membutuhkan `window`.
 *
 * Cara pakai:
 *   const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
 *   <MapPicker lat={lat} lng={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
 */

import { useEffect, useRef } from 'react';

interface MapPickerProps {
  lat:      number;
  lng:      number;
  onChange: (lat: number, lng: number) => void;
  height?:  string;
}

export default function MapPicker({
  lat,
  lng,
  onChange,
  height = 'h-52',
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Tandai bahwa efek ini masih aktif — cegah race condition async import
    let cancelled = false;

    // Jika container sudah punya instance Leaflet (Strict Mode double-invoke),
    // hapus dulu sebelum inisialisasi ulang
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((containerRef.current as any)._leaflet_id) {
      mapRef.current?.remove();
      mapRef.current    = null;
      markerRef.current = null;
    }

    // Import Leaflet di sini — safe karena komponen ini hanya dimuat di klien
    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;

      // Fix ikon default leaflet yang hilang saat bundling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const { lat: la, lng: lo } = marker.getLatLng();
        onChange(la, lo);
      });

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onChange(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current    = map;
      markerRef.current = marker;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current    = null;
      markerRef.current = null;
    };
    // Hanya inisialisasi sekali
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update posisi marker ketika lat/lng berubah dari luar (mis. input manual)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng]);
  }, [lat, lng]);

  return (
    <>
      {/* CSS Leaflet via CDN agar tidak perlu konfigurasi webpack */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        className={`w-full rounded-xl border border-line ${height}`}
        aria-label="Peta pilih lokasi — klik atau geser penanda untuk mengubah koordinat"
        role="application"
      />
    </>
  );
}
