"use client";

/**
 * TrackingView (v5 Fase 3) — halaman publik #/tracking.
 *
 * Peta Leaflet (OSM, tanpa API key) + sidebar daftar rombongan dengan
 * filter situs & pencarian; polling live 15 detik ke /api/tracking?live=1
 * (server menjalankan satu tick simulasi gerak perangkat ONLINE).
 * Jejak perjalanan (polyline emas) dimuat dari /api/tracking/history.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { navigate } from "@/hooks/use-hash-route";
import { useT, formatNumberL10n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/client-api";
import { DetailHero, DetailSectionHead } from "@/components/views/detail-shell";
import type { GpsDevice, GpsTrail } from "@/components/site/tracking-map";

const TrackingMap = dynamic(() => import("@/components/site/tracking-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full rounded-2xl" />,
});

type TrackingData = {
  devices: GpsDevice[];
  stats: { total: number; online: number; pax: number; sites: number; paxOnline: number };
  serverTime: string;
};

const SITES = ["MAKKAH", "MINA", "ARAFAH", "MUZDALIFAH", "MADINAH", "JEDDAH"];

const STATUS_DOT: Record<string, string> = {
  ONLINE: "bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]",
  IDLE: "bg-emerald-500",
  OFFLINE: "bg-zinc-400",
};

function agoLabel(iso: string, justNow: string, minAgo: string, hourAgo: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return justNow;
  if (m < 60) return `${m} ${minAgo}`;
  return `${Math.floor(m / 60)} ${hourAgo}`;
}

export function TrackingView() {
  const { t, locale } = useT();
  const [data, setData] = useState<TrackingData | null>(null);
  const [trails, setTrails] = useState<GpsTrail[]>([]);
  const [live, setLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [q, setQ] = useState("");
  const [site, setSite] = useState<string>("ALL");
  const [focus, setFocus] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const d = await apiGet<TrackingData>(`/api/tracking?live=${live ? 1 : 0}`);
      setData(d);
      setLastUpdate(new Date());
    } catch {
      /* diam — retry polling berikutnya */
    } finally {
      setRefreshing(false);
    }
  }, [live]);

  // Muat pertama + polling.
  useEffect(() => {
    void load();
    const loadTrails = () => apiGet<{ trails: GpsTrail[] }>("/api/tracking/history?limit=24").then((r) => setTrails(r.trails)).catch(() => {});
    void loadTrails();
    timerRef.current = setInterval(() => {
      void load();
      void loadTrails();
    }, 15000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load]);

  const devices = data?.devices ?? [];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return devices.filter((d) => {
      if (site !== "ALL" && d.site !== site) return false;
      if (!needle) return true;
      return (
        d.groupName.toLowerCase().includes(needle) ||
        d.leader.toLowerCase().includes(needle) ||
        d.code.toLowerCase().includes(needle)
      );
    });
  }, [devices, q, site]);

  const stats = data?.stats;
  const labels = useMemo(
    () => ({
      group: t("gps.map.group"),
      leader: t("gps.map.leader"),
      pax: t("gps.map.pax"),
      site: t("gps.map.site"),
      speed: t("gps.map.speed"),
      battery: t("gps.map.battery"),
      updated: t("gps.map.updated"),
      kmh: t("gps.map.kmh"),
      trail: t("gps.map.trail"),
      sites: Object.fromEntries(SITES.map((s) => [s, t(`gps.sites.${s}`)])) as Record<string, string>,
      status: Object.fromEntries(["ONLINE", "IDLE", "OFFLINE"].map((s) => [s, t(`gps.status.${s}`)])) as Record<string, string>,
      fmt: (iso: string) => agoLabel(iso, t("gps.side.justNow"), t("gps.side.minAgo"), t("gps.side.hourAgo")),
    }),
    [t]
  );

  return (
    <>
      <DetailHero
        eyebrow={t("gps.hero.eyebrow")}
        title={t("gps.hero.title")}
        subtitle={t("gps.hero.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
        badge={
          <>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
                live ? "bg-red-500/20 text-red-200 ring-red-400/50" : "bg-white/10 text-white/70 ring-white/25"
              )}
            >
              {live && <span className="relative flex h-2 w-2" aria-hidden><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" /></span>}
              {live ? t("gps.live.on") : t("gps.live.paused")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold text-gold ring-1 ring-gold/40">
              <Icon name="satellite" className="h-3.5 w-3.5" aria-hidden />
              {t("gps.hero.badge")}
            </span>
          </>
        }
      />

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* ===== STATISTIK ===== */}
          <Reveal>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { v: stats?.online, l: t("gps.stats.online"), i: "wifi" },
                { v: stats?.pax, l: t("gps.stats.pax"), i: "users" },
                { v: stats?.total, l: t("gps.stats.groups"), i: "flag" },
                { v: stats?.sites, l: t("gps.stats.sites"), i: "map-pin" },
              ].map((s, idx) => (
                <div key={idx} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={s.i} className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div className="mt-2.5 text-2xl font-extrabold tabular-nums">
                    {s.v === undefined ? <Skeleton className="h-7 w-12" /> : formatNumberL10n(s.v, locale)}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* ===== PETA + SIDEBAR ===== */}
          <Reveal>
            <DetailSectionHead icon="radar" title={t("gps.map.title")} />
          </Reveal>
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            {/* Peta */}
            <Reveal>
              <div className="relative">
                <TrackingMap
                  devices={devices}
                  trails={trails}
                  focusCode={focus}
                  labels={labels}
                  height={520}
                />
                {/* Overlay legend + kontrol live */}
                <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex flex-wrap items-center justify-between gap-2">
                  <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 px-3 py-2 text-[11px] font-semibold shadow-lg backdrop-blur">
                    {[["ONLINE", t("gps.map.legendOnline")], ["IDLE", t("gps.map.legendIdle")], ["OFFLINE", t("gps.map.legendOffline")]].map(([k, l]) => (
                      <span key={k} className="inline-flex items-center gap-1.5">
                        <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT[k])} aria-hidden />
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="pointer-events-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLive((v) => !v)}
                      aria-pressed={!live}
                      aria-label={t("gps.live.toggle")}
                      className="h-8 rounded-xl border bg-card/95 shadow-lg backdrop-blur"
                    >
                      <Icon name={live ? "pause" : "play"} className="h-3.5 w-3.5" aria-hidden />
                      {live ? t("gps.live.paused") : t("gps.live.on")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void load()}
                      className="h-8 rounded-xl border bg-card/95 shadow-lg backdrop-blur"
                    >
                      <Icon name="refresh-cw" className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("gps.live.note")}{" "}
                {lastUpdate && (
                  <span className="tabular-nums">
                    {t("gps.side.lastUpdate")}{" "}
                    {lastUpdate.toLocaleTimeString(locale === "ar" ? "ar" : locale === "en" ? "en-GB" : "id-ID")}
                  </span>
                )}
              </p>
            </Reveal>

            {/* Sidebar */}
            <Reveal delay={100}>
              <div className="rounded-2xl border bg-card shadow-sm">
                <div className="border-b p-4">
                  <h3 className="text-sm font-extrabold">{t("gps.side.title")}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("gps.side.subtitle")}</p>
                  <div className="mt-3">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={t("gps.side.search")}
                      aria-label={t("gps.side.searchAria")}
                      className="h-9"
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label={t("gps.map.site")}>
                    {["ALL", ...SITES].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSite(s)}
                        aria-pressed={site === s}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-bold transition",
                          site === s
                            ? "bg-primary text-white shadow"
                            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                      >
                        {s === "ALL" ? t("gps.side.all") : t(`gps.sites.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <ul className="max-h-[430px] space-y-1.5 overflow-y-auto p-3 lg:max-h-[470px]" aria-label={t("gps.side.title")}>
                  {filtered.length === 0 && (
                    <li className="px-3 py-8 text-center text-sm text-muted-foreground">{t("gps.side.empty")}</li>
                  )}
                  {filtered.map((d) => (
                    <li key={d.code}>
                      <button
                        type="button"
                        onClick={() => setFocus(d.code)}
                        className={cn(
                          "w-full rounded-xl border p-3 text-start transition hover:border-primary/50 hover:bg-primary/5",
                          focus === d.code && "border-gold/60 bg-gold/10"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", STATUS_DOT[d.status])} aria-hidden />
                            <span className="truncate text-sm font-bold">{d.groupName}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {t(`gps.status.${d.status}`)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Icon name="user-round" className="h-3 w-3" aria-hidden />
                            {d.leader}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon name="users" className="h-3 w-3" aria-hidden />
                            <span className="tabular-nums">{d.pax}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon name="map-pin" className="h-3 w-3" aria-hidden />
                            {t(`gps.sites.${d.site}`)}
                          </span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Icon name="gauge" className="h-3 w-3" aria-hidden />
                            {Math.round(d.speedKph)} {t("gps.map.kmh")}
                          </span>
                          <span className={cn("inline-flex items-center gap-1 tabular-nums", d.battery <= 20 && "font-bold text-red-500")}>
                            <Icon name={d.battery <= 20 ? "battery-low" : "battery-full"} className="h-3 w-3" aria-hidden />
                            {d.battery}%
                          </span>
                          <span className="ms-auto inline-flex items-center gap-1 tabular-nums">
                            <Icon name="clock" className="h-3 w-3" aria-hidden />
                            {agoLabel(d.lastPingAt, t("gps.side.justNow"), t("gps.side.minAgo"), t("gps.side.hourAgo"))}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border bg-card p-8 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <h2 className="text-lg font-extrabold sm:text-xl">{t("gps.cta.title")}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("gps.cta.desc")}</p>
              </div>
              <Button onClick={() => navigate("gabung")} className="bg-primary hover:bg-forest">
                <Icon name="handshake" className="h-4 w-4" aria-hidden />
                {t("gps.cta.btn")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
