"use client";

/**
 * Tour360 (v5 Fase 4) — viewer panorama 360° berbasis photo-sphere-viewer v5.
 *
 * Client-only (dimuat via next/dynamic ssr:false dari tour-view.tsx).
 * - Drag untuk melihat sekeliling, zoom via tombol navbar PSV.
 * - Marker "link" (panah emas) → navigasi antar scene (callback onNavigate).
 * - Marker "info" (pin emas) → callback onInfo (panel info dirender parent).
 * - Autorotate halus otomatis setelah 4 detik idle (AutorotatePlugin),
 *   dihentikan otomatis PSV saat pengguna berinteraksi.
 */

import { useEffect, useRef } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";

export type TourHotspotLocalized = {
  type: "info" | "link";
  yaw: number;
  pitch: number;
  /** Sudah dipilihkan sesuai locale aktif oleh parent. */
  title?: string;
  text?: string;
  target?: string;
  label?: string;
};

export type TourSceneLocalized = {
  slug: string;
  site: string;
  image: string;
  initialView: { yaw: number; pitch: number; hfov?: number };
  hotspots: TourHotspotLocalized[];
};

/** Ikon inline SVG untuk marker (ringan, tanpa dependensi registry ikon). */
const ICON_ARROW =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
const ICON_INFO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

function markerHtml(h: TourHotspotLocalized): string {
  const icon = h.type === "link" ? ICON_ARROW : ICON_INFO;
  const cls = h.type === "link" ? "tour-hs tour-hs-link" : "tour-hs tour-hs-info";
  return `<div class="${cls}"><span class="tour-hs-ic">${icon}</span>${
    h.label || h.title ? `<span class="tour-hs-lb">${h.label || h.title}</span>` : ""
  }</div>`;
}

export function Tour360({
  scene,
  onNavigate,
  onInfo,
}: {
  scene: TourSceneLocalized;
  onNavigate: (slug: string) => void;
  onInfo: (h: TourHotspotLocalized) => void;
}) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  // Callback disimpan di ref agar effect pembuat viewer tidak perlu diulang
  // (pola stabil seperti labelsRef di tracking-map).
  const navRef = useRef(onNavigate);
  const infoRef = useRef(onInfo);
  useEffect(() => {
    navRef.current = onNavigate;
    infoRef.current = onInfo;
  }, [onNavigate, onInfo]);

  // Buat viewer sekali.
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    const viewer = new Viewer({
      container: holder,
      panorama: scene.image,
      navbar: ["autorotate", "zoom", "move", "fullscreen"],
      defaultYaw: scene.initialView?.yaw ?? 0,
      defaultPitch: scene.initialView?.pitch ?? 0,
      defaultZoomLvl: 40,
      minFov: 30,
      maxFov: 110,
      plugins: [
        MarkersPlugin,
        [AutorotatePlugin, { autorotateSpeed: "0.35rpm", autostartDelay: 4000, autostartOnIdle: true }],
      ],
    });
    viewerRef.current = viewer;
    // Handle untuk pengujian E2E & debug (tanpa dampak UI).
    (window as unknown as { __tourViewer?: Viewer }).__tourViewer = viewer;

    const markers = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;
    markers.addEventListener("select-marker", (e) => {
      // Data hotspot dibaca dari marker (selalu milik scene aktif) — bukan
      // closure scene awal, agar info yang tampil sesuai panorama saat ini.
      const marker = (e as unknown as { marker?: { data?: { hotspot?: TourHotspotLocalized } } }).marker;
      const hs = marker?.data?.hotspot;
      if (!hs) return;
      if (hs.type === "link" && hs.target) navRef.current(hs.target);
      if (hs.type === "info") infoRef.current(hs);
    });

    return () => {
      try {
        viewer.destroy();
      } catch {
        /* abaikan — viewer sudah mati */
      }
      viewerRef.current = null;
    };
    // scene hanya untuk init pertama — perubahan scene ditangani effect kedua.
     
  }, []);

  // Saat scene berganti: ganti panorama (transisi halus) + marker baru.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const markers = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;
    const rotate = viewer.getPlugin(AutorotatePlugin) as AutorotatePlugin | undefined;
    // Lewati pemuatan ulang untuk panorama yang sama (init pertama).
    const currentPano = (viewer as unknown as { config?: { panorama?: string } }).config?.panorama;
    if (currentPano === scene.image) {
      markers.setMarkers(
        scene.hotspots.map((h, i) => ({
          id: `hs-${i}`,
          html: markerHtml(h),
          position: { yaw: h.yaw, pitch: h.pitch },
          size: { width: 148, height: 78 },
          anchor: "center center" as const,
          data: { hotspot: h },
        }))
      );
      return;
    }

    let alive = true;
    viewer
      .setPanorama(scene.image, {
        position: { yaw: scene.initialView?.yaw ?? 0, pitch: scene.initialView?.pitch ?? 0 },
        zoom: 40,
        transition: true,
        showLoader: true,
      })
      .then(() => {
        if (!alive) return;
        markers.setMarkers(
          scene.hotspots.map((h, i) => ({
            id: `hs-${i}`,
            html: markerHtml(h),
            position: { yaw: h.yaw, pitch: h.pitch },
            size: { width: 148, height: 78 },
            anchor: "center center" as const,
            data: { hotspot: h },
          }))
        );
        // Lanjutkan autorotate pelan untuk scene baru.
        rotate?.start();
      })
      .catch(() => {
        /* panorama gagal — biarkan tampilan lama */
      });

    return () => {
      alive = false;
    };
  }, [scene]);

  return <div ref={holderRef} className="h-full w-full" aria-label="Virtual tour 360" role="application" />;
}
