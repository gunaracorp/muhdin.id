"use client";

/**
 * TourView (v5 Fase 4) — halaman publik #/tur-virtual.
 *
 * 1. HERO + statistik tur live dari /api/tour
 * 2. VIEWER 360° (photo-sphere-viewer, client-only): marker link emas
 *    berpindah scene, marker info membuka panel ritual, autorotate halus.
 * 3. Chips scene + daftar 6 tahap perjalanan
 * 4. CTA ke Paspor Digital & GPS Rombongan
 *
 * Trilingual + RTL-aware; setiap pergantian scene tercatat di viewCount.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { apiGet, apiSend } from "@/lib/client-api";
import { DetailHero, DetailSectionHead } from "@/components/views/detail-shell";
import type { TourHotspotLocalized } from "@/components/site/tour-360";

const Tour360Viewer = dynamic(() => import("@/components/site/tour-360").then((m) => m.Tour360), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

type Tri = { id?: string; en?: string; ar?: string };

type TourHotspot = {
  type: "info" | "link";
  yaw: number;
  pitch: number;
  title?: Tri;
  text?: Tri;
  target?: string;
  label?: Tri;
};

type TourScene = {
  id: string;
  slug: string;
  site: string;
  image: string;
  name: Tri;
  description: Tri;
  initialView: { yaw: number; pitch: number; hfov?: number };
  hotspots: TourHotspot[];
  viewCount: number;
};

type TourData = {
  scenes: TourScene[];
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

function pick(tri: Tri | undefined, locale: "id" | "en" | "ar"): string {
  if (!tri) return "";
  return tri[locale] || tri.en || tri.id || "";
}

export function TourView() {
  const { t, locale } = useT();
  const [data, setData] = useState<TourData | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [info, setInfo] = useState<{ title: string; text: string } | null>(null);
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    apiGet<TourData>("/api/tour")
      .then((d) => {
        if (!alive) return;
        setData(d);
        setSlug((s) => s || d.scenes[0]?.slug || "");
      })
      .catch(() => {
        if (alive) setData({ scenes: [], stats: { scenes: 0, hotspots: 0, views: 0 } });
      });
    return () => {
      alive = false;
    };
  }, []);

  const current = useMemo(
    () => data?.scenes.find((s) => s.slug === slug) ?? data?.scenes[0] ?? null,
    [data, slug]
  );

  // Hotspot sudah dipilihkan teksnya sesuai locale aktif.
  const localizedScene = useMemo(() => {
    if (!current) return null;
    return {
      slug: current.slug,
      site: current.site,
      image: current.image,
      initialView: current.initialView,
      hotspots: current.hotspots.map((h): TourHotspotLocalized => ({
        type: h.type,
        yaw: h.yaw,
        pitch: h.pitch,
        title: pick(h.title, locale),
        text: pick(h.text, locale),
        target: h.target,
        label: pick(h.label, locale),
      })),
    };
  }, [current, locale]);

  // Hitung kunjungan sekali per scene per sesi (fire-and-forget).
  useEffect(() => {
    if (!current) return;
    if (viewedRef.current.has(current.slug)) return;
    viewedRef.current.add(current.slug);
    void apiSend("/api/tour/view", "POST", { slug: current.slug }).catch(() => {});
  }, [current]);

  const goTo = useCallback((target: string) => {
    setInfo(null);
    setSlug(target);
  }, []);

  const scenes = data?.scenes ?? [];
  const stats = data?.stats;
  const targetNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of scenes) map[s.slug] = pick(s.name, locale);
    return map;
  }, [scenes, locale]);

  return (
    <>
      <DetailHero
        eyebrow={t("tur.hero.eyebrow")}
        title={t("tur.hero.title")}
        subtitle={t("tur.hero.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold text-gold ring-1 ring-gold/40">
            <Icon name="orbit" className="h-3.5 w-3.5" aria-hidden />
            {t("tur.hero.badge")}
          </span>
        }
      >
        <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { v: stats?.scenes, l: t("tur.stats.scenes"), i: "orbit" },
            { v: stats?.hotspots, l: t("tur.stats.hotspots"), i: "map-pin" },
            { v: stats?.views, l: t("tur.stats.views"), i: "eye" },
            { v: 6, l: t("tur.stats.sites"), i: "globe" },
          ].map((s, idx) => (
            <div key={idx} className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15 backdrop-blur-sm">
              <Icon name={s.i} className="h-4 w-4 text-gold" aria-hidden />
              <p className="mt-1.5 text-xl font-extrabold tabular-nums" dir="ltr">
                {s.v?.toLocaleString(locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "id-ID") ?? "—"}
              </p>
              <p className="text-[11px] font-medium text-emerald-50/75">{s.l}</p>
            </div>
          ))}
        </div>
      </DetailHero>

      {/* ===== VIEWER 360° ===== */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <DetailSectionHead icon="orbit" title={t("tur.viewer.title")} />
            <p className="-mt-2 mb-6 max-w-2xl text-sm text-muted-foreground">{t("tur.viewer.subtitle")}</p>
          </Reveal>

          <Reveal>
            {/* Chips scene */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin" role="tablist" aria-label={t("tur.chips.aria")}>
              {scenes.map((s) => (
                <button
                  key={s.slug}
                  role="tab"
                  aria-selected={current?.slug === s.slug}
                  onClick={() => goTo(s.slug)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                    current?.slug === s.slug
                      ? "border-gold/60 bg-primary text-white shadow-md"
                      : "bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
                  )}
                >
                  <Icon name={SITE_ICON[s.site] ?? "orbit"} className="h-3.5 w-3.5" aria-hidden />
                  {pick(s.name, locale)}
                </button>
              ))}
            </div>

            {/* Bingkai viewer */}
            <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-forest-deep shadow-2xl ring-1 ring-gold/20">
              <div className="relative h-[420px] sm:h-[520px] lg:h-[600px]">
                {localizedScene ? (
                  <Tour360Viewer
                    scene={localizedScene}
                    onNavigate={goTo}
                    onInfo={(h) => setInfo({ title: h.title || "", text: h.text || "" })}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-white/70">
                    {data ? t("tur.viewer.empty") : t("tur.viewer.loading")}
                  </div>
                )}

                {/* Overlay judul scene */}
                {current && (
                  <div className="pointer-events-none absolute top-4 start-4 rounded-2xl bg-black/45 px-4 py-2.5 text-white ring-1 ring-white/15 backdrop-blur-md">
                    <p className="flex items-center gap-2 text-sm font-extrabold">
                      <Icon name={SITE_ICON[current.site] ?? "orbit"} className="h-4 w-4 text-gold" aria-hidden />
                      {pick(current.name, locale)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                      {t("gps.sites." + current.site)} · 360°
                    </p>
                  </div>
                )}

                {/* Panel info ritual */}
                {info && (
                  <div className="absolute inset-x-4 bottom-4 mx-auto max-w-lg rounded-2xl border border-gold/40 bg-black/70 p-4 text-white shadow-xl backdrop-blur-md" role="dialog" aria-label={info.title}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-extrabold text-gold">
                          <Icon name="map-pin" className="h-4 w-4" aria-hidden />
                          {info.title}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/85">{info.text}</p>
                      </div>
                      <button
                        onClick={() => setInfo(null)}
                        className="shrink-0 rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                        aria-label={t("tur.viewer.infoClose")}
                      >
                        <Icon name="x" className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips navigasi */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { i: "compass", l: t("tur.viewer.drag") },
                { i: "search", l: t("tur.viewer.zoom") },
                { i: "map-pin", l: t("tur.viewer.markers") },
              ].map((tip, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                  <Icon name={tip.i} className="h-3.5 w-3.5 text-gold-deep" aria-hidden />
                  {tip.l}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== DAFTAR SCENE ===== */}
      <section className="bg-muted/40 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <DetailSectionHead icon="route" title={t("tur.list.title")} />
            <p className="-mt-2 mb-8 max-w-2xl text-sm text-muted-foreground">{t("tur.list.subtitle")}</p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {scenes.map((s, idx) => (
              <Reveal key={s.slug} delay={idx * 60}>
                <button
                  onClick={() => goTo(s.slug)}
                  className={cn(
                    "group w-full overflow-hidden rounded-3xl border bg-card text-start shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
                    current?.slug === s.slug && "border-gold/50 ring-2 ring-gold/40"
                  )}
                >
                  <div className="relative h-36 overflow-hidden">
                    { }
                    <img
                      src={s.image}
                      alt={pick(s.name, locale)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <span className="absolute top-3 start-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-gold ring-1 ring-gold/40 backdrop-blur-sm">
                      {t("gps.sites." + s.site)}
                    </span>
                    <span className="absolute bottom-3 start-3 inline-flex items-center gap-1 text-[10px] font-semibold text-white/85" dir="ltr">
                      <Icon name="eye" className="h-3 w-3" aria-hidden />
                      {s.viewCount.toLocaleString(locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "id-ID")} {t("tur.list.views")}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="flex items-center justify-between gap-2 text-sm font-extrabold">
                      <span className="flex items-center gap-2">
                        <Icon name={SITE_ICON[s.site] ?? "orbit"} className="h-4 w-4 text-gold-deep" aria-hidden />
                        {pick(s.name, locale)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        {t("tur.list.open")}
                        <Icon name="arrow-right" className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                      </span>
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{pick(s.description, locale)}</p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-forest-deep via-primary to-forest p-8 text-center text-white sm:p-10">
              <div className="absolute inset-0 bg-islamic-pattern-gold opacity-25" aria-hidden />
              <div className="relative">
                <h3 className="text-xl font-extrabold sm:text-2xl">{t("tur.cta.title")}</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm text-emerald-50/85">{t("tur.cta.desc")}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button size="lg" className="bg-gold text-forest-deep hover:bg-gold-soft" onClick={() => navigate("paspor")}>
                    <Icon name="wallet-cards" className="mr-1.5 h-4 w-4" aria-hidden />
                    {t("tur.cta.btnPaspor")}
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => navigate("tracking")}>
                    <Icon name="satellite" className="mr-1.5 h-4 w-4" aria-hidden />
                    {t("tur.cta.btnTracking")}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
