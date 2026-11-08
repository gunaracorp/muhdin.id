"use client";

/**
 * AdminTour (v5 Fase 4) — CMS "Tur Virtual".
 *
 * Kelola 6 scene panorama 360°: statistik kunjungan, aktifkan/nonaktifkan
 * scene, atur urutan tayang (naik/turun), dan buka halaman publik.
 * Konten scene (nama/deskripsi/hotspot) dikelola via seed agar struktur
 * JSON trilingual tetap konsisten — CMS fokus pada kurasi tampilan.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { navigate } from "@/hooks/use-hash-route";

type TourSceneAdmin = {
  id: string;
  slug: string;
  site: string;
  image: string;
  name: { id?: string; en?: string; ar?: string };
  description: { id?: string; en?: string; ar?: string };
  hotspots: unknown[];
  order: number;
  active: boolean;
  viewCount: number;
};

type TourAdminData = {
  scenes: TourSceneAdmin[];
  stats: { scenes: number; hotspots: number; views: number };
};

const SITE_ICON: Record<string, string> = {
  MAKKAH: "moon-star",
  MADINAH: "umbrella",
  MINA: "tent-tree",
  ARAFAH: "mountain",
  MUZDALIFAH: "sparkles",
  JEDDAH: "plane",
};

export function AdminTour() {
  const { toast } = useToast();
  const [data, setData] = useState<TourAdminData | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await apiGet<TourAdminData>("/api/tour?admin=1");
      setData(d);
    } catch (e) {
      toast({ title: "Gagal memuat scene tur", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (scene: TourSceneAdmin, body: Record<string, unknown>, desc: string) => {
    setBusy(true);
    try {
      await apiSend("/api/tour", "PATCH", { id: scene.id, ...body });
      toast({ title: "Scene diperbarui", description: desc });
      await load();
    } catch (e) {
      toast({ title: "Gagal memperbarui", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const move = async (scene: TourSceneAdmin, dir: -1 | 1) => {
    if (!data) return;
    const sorted = [...data.scenes].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === scene.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    setBusy(true);
    try {
      await apiSend("/api/tour", "PATCH", { id: scene.id, order: swap.order });
      await apiSend("/api/tour", "PATCH", { id: swap.id, order: scene.order });
      toast({ title: "Urutan diperbarui", description: `${scene.name.id} ↔ ${swap.name.id}` });
      await load();
    } catch (e) {
      toast({ title: "Gagal mengubah urutan", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!data)
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );

  const sorted = [...data.scenes].sort((a, b) => a.order - b.order);
  const activeCount = data.scenes.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Scene", value: data.stats.scenes, icon: "orbit", tone: "text-primary bg-primary/10" },
          { label: "Scene Aktif", value: activeCount, icon: "eye", tone: "text-gold-deep bg-gold/15" },
          { label: "Total Kunjungan", value: data.stats.views, icon: "trending-up", tone: "text-primary bg-primary/10" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
            <span className={cn("grid h-11 w-11 place-items-center rounded-xl", c.tone)}>
              <Icon name={c.icon} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-extrabold tabular-nums">{c.value.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daftar scene */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Icon name="orbit" className="h-4 w-4 text-primary" />
              Scene Panorama 360°
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data.stats.hotspots} titik interaktif terpasang — kurasi tampilan di halaman publik #/tur-virtual.
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-primary border-primary/40 hover:bg-primary/10" onClick={() => navigate("tur-virtual")}>
            <Icon name="external-link" className="h-3.5 w-3.5" />
            Buka Tur
          </Button>
        </div>

        <div className="divide-y">
          {sorted.map((s, idx) => (
            <div key={s.id} className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-center", !s.active && "bg-muted/30")}>
              {/* Thumb */}
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border">
                { }
                <img src={s.image} alt={s.name.id || s.slug} className="h-full w-full object-cover" loading="lazy" />
                {!s.active && <span className="absolute inset-0 grid place-items-center bg-black/50 text-[10px] font-bold text-white">NONAKTIF</span>}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
                  <Icon name={SITE_ICON[s.site] ?? "orbit"} className="h-4 w-4 text-gold-deep" />
                  {s.name.id || s.slug}
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{s.site}</span>
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{s.description.id}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground" dir="ltr">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="map-pin" className="h-3 w-3" /> {s.hotspots.length} hotspot
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="eye" className="h-3 w-3" /> {s.viewCount.toLocaleString("id-ID")} kunjungan
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="hash" className="h-3 w-3" /> urutan {s.order}
                  </span>
                </p>
              </div>

              {/* Aksi */}
              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={busy || idx === 0} onClick={() => move(s, -1)} aria-label="Naikkan urutan">
                  <Icon name="arrow-up" className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={busy || idx === sorted.length - 1} onClick={() => move(s, 1)} aria-label="Turunkan urutan">
                  <Icon name="chevron-down" className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={s.active ? "outline" : "default"}
                  size="sm"
                  className={cn("h-8", s.active ? "text-amber-700 border-amber-500/40 hover:bg-amber-500/10" : "bg-primary hover:bg-forest")}
                  disabled={busy}
                  onClick={() => patch(s, { active: !s.active }, `${s.name.id} → ${s.active ? "nonaktif" : "aktif"}`)}
                >
                  <Icon name={s.active ? "eye-off" : "check-circle-2"} className="h-3.5 w-3.5" />
                  {s.active ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
