"use client";

/**
 * TrackingMap (v5 Fase 3) — peta Leaflet + tile OpenStreetMap untuk
 * posisi rombongan. KOMPONEN CLIENT MURNI — dimuat via next/dynamic
 * ssr:false dari tracking-view.tsx (Leaflet membutuhkan window).
 *
 * - Marker divIcon (tanpa aset gambar → aman di bundler).
 * - Popup detail rombongan (label i18n dikirim dari induk).
 * - Polyline jejak perjalanan (riwayat ping).
 * - Diff-update marker saat polling live (tidak me-rebuild peta).
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type GpsDevice = {
  code: string;
  groupName: string;
  leader: string;
  pax: number;
  site: string;
  lat: number;
  lng: number;
  speedKph: number;
  battery: number;
  status: string; // ONLINE | IDLE | OFFLINE
  lastPingAt: string;
};

export type GpsTrail = { code: string; points: { lat: number; lng: number }[] };

export type GpsLabels = {
  group: string;
  leader: string;
  pax: string;
  site: string;
  speed: string;
  battery: string;
  updated: string;
  kmh: string;
  trail: string;
  sites: Record<string, string>;
  status: Record<string, string>;
  fmt: (iso: string) => string;
};

const STATUS_CLASS: Record<string, string> = { ONLINE: "gps-online", IDLE: "gps-idle", OFFLINE: "gps-offline" };

/** CSS marker & pulse — kelas unik agar tidak bentrok dengan Leaflet bawaan. */
const MARKER_CSS = `
.gps-dot{display:block;width:15px;height:15px;border-radius:9999px;border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5);position:relative}
.gps-online{background:#d4af37}
.gps-idle{background:#059669}
.gps-offline{background:#6b7280}
.gps-online::after{content:"";position:absolute;inset:-7px;border-radius:9999px;border:2px solid rgba(212,175,55,.6);animation:gpsPulse 1.8s ease-out infinite}
@keyframes gpsPulse{0%{transform:scale(.55);opacity:1}100%{transform:scale(1.45);opacity:0}}
.gps-popup .leaflet-popup-content-wrapper{border-radius:14px}
.gps-popup .leaflet-popup-content{margin:12px 14px}
`;

function markerIcon(status: string): L.DivIcon {
  return L.divIcon({
    className: "gps-marker",
    html: `<span class="gps-dot ${STATUS_CLASS[status] || "gps-offline"}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

function popupHtml(d: GpsDevice, lb: GpsLabels): string {
  const row = (k: string, v: string) =>
    `<div class="flex items-center justify-between gap-4"><span class="text-muted-foreground">${k}</span><span class="font-semibold">${v}</span></div>`;
  return `
  <div class="min-w-[210px] text-[13px] leading-relaxed">
    <p class="mb-1 flex items-center gap-1.5 font-extrabold text-primary">
      <span class="gps-dot ${STATUS_CLASS[d.status] || "gps-offline"}" style="display:inline-block;width:9px;height:9px;border-width:2px"></span>
      ${d.groupName}
    </p>
    ${row(lb.leader, d.leader)}
    ${row(lb.pax, `${d.pax}`)}
    ${row(lb.site, lb.sites[d.site] || d.site)}
    ${row(lb.speed, `${Math.round(d.speedKph)} ${lb.kmh}`)}
    ${row(lb.battery, `${d.battery}%`)}
    ${row(lb.updated, lb.fmt(d.lastPingAt))}
  </div>`;
}

export default function TrackingMap({
  devices,
  trails,
  focusCode,
  labels,
  height = 560,
}: {
  devices: GpsDevice[];
  trails: GpsTrail[];
  focusCode: string | null;
  labels: GpsLabels;
  height?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const trailLayerRef = useRef<L.LayerGroup | null>(null);
  const labelsRef = useRef(labels);
  useEffect(() => {
    labelsRef.current = labels;
  }, [labels]);
  const didFitRef = useRef(false);

  // Init peta sekali.
  useEffect(() => {
    if (!boxRef.current || mapRef.current) return;
    const map = L.map(boxRef.current, {
      center: [21.4225, 39.8262],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    trailLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(boxRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Sinkron marker (diff).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();

    for (const d of devices) {
      seen.add(d.code);
      const pos = L.latLng(d.lat, d.lng);
      const existing = markersRef.current.get(d.code);
      if (existing) {
        existing.setLatLng(pos);
        existing.setIcon(markerIcon(d.status));
        existing.setPopupContent(popupHtml(d, labelsRef.current));
      } else {
        const m = L.marker(pos, { icon: markerIcon(d.status), title: d.groupName })
          .bindPopup(popupHtml(d, labelsRef.current), { className: "gps-popup" })
          .addTo(map);
        markersRef.current.set(d.code, m);
      }
    }
    for (const [code, m] of markersRef.current) {
      if (!seen.has(code)) {
        m.remove();
        markersRef.current.delete(code);
      }
    }

    // Fit bounds sekali saat data pertama masuk.
    if (!didFitRef.current && devices.length) {
      didFitRef.current = true;
      map.fitBounds(L.latLngBounds(devices.map((d) => [d.lat, d.lng] as [number, number])), {
        padding: [42, 42],
        maxZoom: 13,
      });
    }
  }, [devices]);

  // Jejak polyline.
  useEffect(() => {
    const map = mapRef.current;
    const layer = trailLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    for (const tr of trails) {
      if (tr.points.length < 2) continue;
      L.polyline(
        tr.points.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#d4af37", weight: 2.5, opacity: 0.55, dashArray: "5 7" }
      )
        .bindTooltip(`${labelsRef.current.trail} · ${tr.code}`, { sticky: true })
        .addTo(layer);
    }
  }, [trails]);

  // Fokus dari sidebar.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusCode) return;
    const d = devices.find((x) => x.code === focusCode);
    if (!d) return;
    map.flyTo([d.lat, d.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
    const m = markersRef.current.get(focusCode);
    if (m) m.openPopup();
  }, [focusCode, devices]);

  return (
    <>
      <style>{MARKER_CSS}</style>
      <div
        ref={boxRef}
        style={{ height }}
        className="w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border"
        role="application"
        aria-label={labels.group}
      />
    </>
  );
}
