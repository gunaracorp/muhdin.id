"use client";

/**
 * admin-funnel.tsx — v13.2 — R-093 Analitik Funnel Pendaftaran (CMS).
 *
 * Satu papan untuk melihat titik bocor alur pendaftaran:
 *   • 5 baris funnel (Lihat Paket → Buka Formulir → Kirim → Disetujui → KTA)
 *     dengan bar proporsional + konversi antar-stage (%)
 *   • kartu total event 30 hari terakhir
 *   • kartu "titik bocor terbesar" (drop-off absolut antar-stage)
 *   • sparkline 30 hari (SVG ringan, tanpa pustaka)
 * Data: GET /api/funnel (SUPER_ADMIN/ADMIN).
 */
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FunnelData {
  stages: { stage: string; label: string; count: number; conversionFromPrev: number | null }[];
  last30: { date: string; count: number }[];
  last30Total: number;
  leak: null | { from: string; to: string; lost: number };
}

const STAGE_ICONS: Record<string, string> = {
  VIEW_PAKET: "eye",
  VIEW_DAFTAR: "clipboard-list",
  DAFTAR_SUBMIT: "send",
  APP_APPROVED: "check-circle-2",
  KTA_ISSUED: "qr-code",
};

export function AdminFunnel() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<FunnelData>("/api/funnel")
      .then(setData)
      .catch(() => setError("Gagal memuat analitik funnel."));
  }, []);

  if (error) {
    return <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>;
  }
  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        {[64, 52, 40, 28, 18].map((w, i) => (
          <Skeleton key={i} className="h-14 w-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  const max = Math.max(1, ...data.stages.map((s) => s.count));
  const first = data.stages[0]?.count ?? 0;
  const last = data.stages[data.stages.length - 1]?.count ?? 0;
  const endToEnd = first > 0 ? Math.round((last / first) * 1000) / 10 : 0;
  const peak = Math.max(1, ...data.last30.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Kartu ringkasan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Event 30 Hari</p>
          <p className="mt-1 text-3xl font-extrabold text-primary">{data.last30Total}</p>
        </div>
        <div className="rounded-3xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Konversi Ujung-ke-Ujung</p>
          <p className="mt-1 text-3xl font-extrabold text-gold-deep dark:text-gold">{endToEnd}%</p>
          <p className="text-[11px] text-muted-foreground">Lihat Paket → KTA Terbit</p>
        </div>
        <div className={cn(
          "rounded-3xl border p-5 shadow-sm",
          data.leak && data.leak.lost > 0
            ? "border-destructive/40 bg-destructive/10"
            : "border-emerald-500/40 bg-emerald-500/10"
        )}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titik Bocor Terbesar</p>
          {data.leak && data.leak.lost > 0 ? (
            <>
              <p className="mt-1 text-2xl font-extrabold text-destructive">-{data.leak.lost}</p>
              <p className="text-[11px] text-muted-foreground">{data.leak.from} → {data.leak.to}</p>
            </>
          ) : (
            <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">Tidak ada bocor — alur utuh</p>
          )}
        </div>
      </div>

      {/* Funnel bar */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="filter" className="h-5 w-5 text-primary" />
          Funnel Pendaftaran
        </h3>
        <ul className="mt-5 space-y-3" data-testid="funnel-bars">
          {data.stages.map((s, i) => (
            <li key={s.stage} data-testid={`funnel-${s.stage}`}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 font-bold">
                  <Icon name={STAGE_ICONS[s.stage] ?? "circle"} className="h-4 w-4 text-primary" />
                  {i + 1}. {s.label}
                </span>
                <span className="flex items-center gap-3">
                  {s.conversionFromPrev !== null && (
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                      s.conversionFromPrev >= 50
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    )}>
                      {s.conversionFromPrev}%
                    </span>
                  )}
                  <span className="font-extrabold tabular-nums">{s.count}</span>
                </span>
              </div>
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    i === 0 ? "bg-primary/80" : i === data.stages.length - 1 ? "bg-gold" : "bg-primary/55"
                  )}
                  style={{ width: `${Math.max(2, (s.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Sparkline 30 hari */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-extrabold">Aktivitas 30 Hari Terakhir</h3>
        <svg viewBox="0 0 600 120" className="mt-4 h-28 w-full" role="img" aria-label="Sparkline aktivitas funnel 30 hari">
          <line x1="0" y1="110" x2="600" y2="110" className="stroke-border" strokeWidth="1" />
          {data.last30.map((d, i) => {
            const x = (i / (data.last30.length - 1)) * 590 + 5;
            const h = d.count === 0 ? 0 : Math.max(3, (d.count / peak) * 100);
            return (
              <rect key={d.date} x={x - 4} y={110 - h} width="8" height={h} rx="2"
                className={d.count > 0 ? "fill-gold" : "fill-muted"} />
            );
          })}
        </svg>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Puncak harian: {peak} event · {data.last30.filter((d) => d.count > 0).length} hari aktif
        </p>
      </div>
    </div>
  );
}
