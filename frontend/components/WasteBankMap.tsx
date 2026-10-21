'use client';

/**
 * WasteBankMap — peta Leaflet + OpenStreetMap menampilkan penanda bank sampah.
 * Di-render hanya di client (SSR: false) karena Leaflet butuh window/document.
 *
 * Props:
 *   banks     — daftar bank dengan lat/lng
 *   userLat   — latitude pengguna (untuk marker biru)
 *   userLng   — longitude pengguna
 *   selected  — id bank yang sedang dipilih (highlight)
 *   onSelect  — callback saat penanda diklik
 */

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';

// ── Types ─────────────────────────────────────────────────────────────────

export interface MapBank {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_open_now: boolean;
}

interface WasteBankMapProps {
  banks: MapBank[];
  userLat?: number | null;
  userLng?: number | null;
  selected?: number | null;
  onSelect?: (id: number) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function WasteBankMap({
  banks,
  userLat,
  userLng,
  selected,
  onSelect,
  className = 'h-72 w-full rounded-2xl',
}: WasteBankMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const markersRef   = useRef<Map<number, Marker>>(new Map());

  // ── Init peta satu kali ──────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      // Fix path ikon default Leaflet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Default center: Jakarta jika tidak ada koordinat user
      const defaultLat = userLat ?? -6.2;
      const defaultLng = userLng ?? 106.82;

      const map = L.map(containerRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Marker posisi user
      if (userLat && userLng) {
        const userIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:#1f8a5b;border:2px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(31,138,91,0.25)"></div>`,
          className: '',
          iconAnchor: [7, 7],
        });
        L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup('Lokasi Anda');
      }

      mapRef.current = map;

      // Render marker bank yang sudah ada
      renderMarkers(L, map, banks, selected ?? null, onSelect);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update marker saat banks berubah ─────────────────────────────────

  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      // Hapus marker lama
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      renderMarkers(L, mapRef.current!, banks, selected ?? null, onSelect);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banks, selected]);

  // ── Pan ke bank yang dipilih ──────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !selected) return;
    const bank = banks.find((b) => b.id === selected);
    if (bank) {
      mapRef.current.panTo([bank.latitude, bank.longitude], { animate: true });
    }
  }, [selected, banks]);

  // ── Helper ────────────────────────────────────────────────────────────

  function renderMarkers(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any,
    map: LeafletMap,
    bankList: MapBank[],
    selectedId: number | null,
    onClickCallback?: (id: number) => void,
  ) {
    bankList.forEach((bank) => {
      const isSelected = bank.id === selectedId;
      const color      = bank.is_open_now ? '#0b4d36' : '#6b8279';
      const size       = isSelected ? 14 : 10;

      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([bank.latitude, bank.longitude], { icon })
        .addTo(map)
        .bindPopup(`<strong>${bank.name}</strong><br/><small>${bank.address}</small>`);

      if (onClickCallback) {
        marker.on('click', () => onClickCallback(bank.id));
      }

      markersRef.current.set(bank.id, marker);
    });

    // Fit bounds jika ada bank
    if (bankList.length > 0 && !selectedId) {
      const latLngs = bankList.map((b) => [b.latitude, b.longitude] as [number, number]);
      map.fitBounds(L.latLngBounds(latLngs), { padding: [30, 30], maxZoom: 14 });
    }
  }

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        className={className}
        aria-label="Peta bank sampah"
        role="application"
      />
    </>
  );
}
