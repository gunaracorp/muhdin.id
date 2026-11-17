"use client";

/**
 * admin-omzet.tsx — v13.0 «GERBANG» — R-051 Dashboard Omzet Manajemen (CMS).
 *
 * Kesehatan bisnis dalam satu papan:
 *   • 4 kartu ringkasan (omzet lunas, konversi, menunggu bayar, rata-rata order)
 *   • grafik batang omzet LUNAS 12 bulan terakhir (SVG ringan, tanpa pustaka)
 *   • 5 paket penyumbang omzet terbesar
 *   • 8 pesanan terbaru
 * Data: GET /api/management/omzet (SUPER_ADMIN/ADMIN).
 */
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OmzetData {
  summary: {
    totalPaid: number;
    paidCount: number;
    pendingCount: number;
    cancelledCount: number;
    allCount: number;
    avgOrder: number;
    conversionRate: number;
  };
  monthly: { month: string; label: string; paid: number; count: number }[];
  topPackages: { title: string; amount: number; count: number }[];
  recent: {
    number: string;
    packageTitle: string;
    customerName: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const STATUS_TONE: Record<string, string> = {
  PAID: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  PENDING: "border-gold/50 bg-gold/10 text-gold-deep",
  CANCELLED: "border-destructive/40 bg-destructive/10 text-destructive",
  EXPIRED: "border-muted-foreground/40 bg-muted text-muted-foreground",
  REFUNDED: "border-orange-500/40 bg-orange-500/10 text-orange-700",
};
const STATUS_LABEL: Record<string, string> = {
  PAID: "Lunas", PENDING: "Menunggu", CANCELLED: "Batal", EXPIRED: "Kedaluwarsa", REFUNDED: "Refund",
};

export function AdminOmzet() {
  const [data, setData] = useState<OmzetData | null>(null);
  const [error, setError] = useState("");
  const [nps, setNps] = useState<{ nps: number | null; total: number; promoters: number; passives: number; detractors: number } | null>(null);

  useEffect(() => {
    apiGet<OmzetData>("/api/management/omzet")
      .then(setData)
      .catch((e) => setError((e as Error).message));
    // v13.1 — R-092 NPS pasca-perjalanan tampil di papan manajemen
    apiGet<{ nps: number | null; total: number; promoters: number; passives: number; detractors: number }>("/api/nps")
      .then(setNps)
      .catch(() => setNps(null));
  }, []);

  const s = data?.summary;
  const peak = Math.max(1, ...(data?.monthly.map((m) => m.paid) || [1]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Dashboard Omzet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kesehatan bisnis real-time dari data pesanan — omzet lunas, konversi, dan pesanan terbaru (R-051).
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: "wallet", label: "Omzet Lunas", value: s ? rupiah(s.totalPaid) : "—", tone: "text-emerald-600 bg-emerald-500/10" },
          { icon: "trending-up", label: "Konversi Lunas", value: s ? `${s.conversionRate}%` : "—", sub: s ? `${s.paidCount}/${s.allCount} pesanan` : undefined, tone: "text-primary bg-primary/10" },
          { icon: "clock", label: "Menunggu Bayar", value: s ? String(s.pendingCount) : "—", sub: s ? (s.pendingCount > 0 ? "perlu ditindak" : "bersih") : undefined, tone: "text-gold-deep bg-gold/10" },
          { icon: "bar-chart-3", label: "Rata-rata Order", value: s ? rupiah(s.avgOrder) : "—", sub: s ? `${s.cancelledCount} batal/kedaluwarsa` : undefined, tone: "text-muted-foreground bg-muted" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-lg p-1.5", c.tone)}>
                <Icon name={c.icon} className="h-4 w-4" aria-hidden />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{c.label}</p>
            </div>
            <p className="mt-2 text-lg font-extrabold tabular-nums">{c.value}</p>
            {c.sub && <p className="text-[11px] text-muted-foreground">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* v13.1 — NPS pasca-perjalanan (R-092) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: "heart", label: "NPS Jamaah", value: nps?.nps != null ? String(nps.nps) : "—", sub: nps && nps.total > 0 ? "Dari " + nps.total + " respons" : "Belum ada respons", tone: "text-rose-600 bg-rose-500/10" },
          { icon: "smile", label: "Promoter (9-10)", value: nps ? String(nps.promoters) : "—", tone: "text-emerald-600 bg-emerald-500/10" },
          { icon: "meh", label: "Passive (7-8)", value: nps ? String(nps.passives) : "—", tone: "text-amber-600 bg-amber-500/10" },
          { icon: "frown", label: "Detractor (0-6)", value: nps ? String(nps.detractors) : "—", tone: "text-red-600 bg-red-500/10" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-lg p-1.5", c.tone)}>
                <Icon name={c.icon} className="h-4 w-4" aria-hidden />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{c.label}</p>
            </div>
            <p className="mt-2 text-lg font-extrabold tabular-nums">{c.value}</p>
            {c.sub && <p className="text-[11px] text-muted-foreground">{c.sub}</p>}
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Omzet Lunas — 12 Bulan Terakhir</h2>
          <Badge variant="outline" className="text-[10px] font-bold">IDR</Badge>
        </div>
        {!data ? (
          <Skeleton className="mt-4 h-44 rounded-xl" />
        ) : (
          <div className="mt-5 flex h-44 items-end gap-1.5 sm:gap-2" role="img" aria-label="Grafik omzet lunas 12 bulan terakhir">
            {data.monthly.map((m) => {
              const h = Math.round((m.paid / peak) * 100);
              return (
                <div key={m.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[9px] font-bold tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {m.paid > 0 ? `${Math.round(m.paid / 1_000_000)}jt` : ""}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      m.paid > 0 ? "bg-gradient-to-t from-primary/70 to-primary" : "bg-muted",
                    )}
                    style={{ height: `${m.paid > 0 ? Math.max(h, 4) : 3}%` }}
                    title={`${m.label}: ${rupiah(m.paid)} (${m.count} order)`}
                  />
                  <span className="text-[9px] font-bold text-muted-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top paket */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-extrabold">Penyumbang Omzet Terbesar</h2>
          {!data ? (
            <Skeleton className="mt-4 h-32 rounded-xl" />
          ) : data.topPackages.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada pesanan lunas.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.topPackages.map((p, i) => {
                const max = data.topPackages[0].amount || 1;
                return (
                  <div key={p.title}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <p className="min-w-0 truncate font-bold">
                        <span className="me-1.5 text-muted-foreground">{i + 1}.</span>
                        {p.title}
                      </p>
                      <span className="shrink-0 font-bold tabular-nums text-emerald-600">{rupiah(p.amount)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500" style={{ width: `${Math.max((p.amount / max) * 100, 6)}%` }} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{p.count} pesanan lunas</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pesanan terbaru */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-extrabold">Pesanan Terbaru</h2>
          {!data ? (
            <Skeleton className="mt-4 h-32 rounded-xl" />
          ) : data.recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada pesanan.</p>
          ) : (
            <div className="mt-3 divide-y">
              {data.recent.map((o) => (
                <div key={o.number} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      <span dir="ltr" className="font-mono text-xs">{o.number}</span> · {o.customerName || "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{o.packageTitle}</p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-sm font-extrabold tabular-nums">{rupiah(o.amount)}</p>
                    <Badge variant="outline" className={cn("mt-0.5 text-[9px] font-bold", STATUS_TONE[o.status] || "")}>
                      {STATUS_LABEL[o.status] || o.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
