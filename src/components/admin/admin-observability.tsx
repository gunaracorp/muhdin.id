"use client";

/**
 * Task 19 (R-062) — CMS "Kesehatan Sistem": observability ringkas tanpa
 * dependensi eksternal. Kartu runtime & database, antrean kerja penting,
 * statistik rate-limit adaptif, dan log terakhir (ring buffer server).
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Metrics {
  generatedAt: string;
  runtime: { node: string; platform: string; uptimeSec: number; memoryMb: number; loadAvg1: string | null };
  database: { ok: boolean; latencyMs: number; error: string | null; queues: Record<string, number> };
  adaptive: { blockedCount: number; activeBuckets: number; violatingIps: { ip: string; count: number }[] };
  logs: {
    stats: { total: number; info: number; warn: number; error: number; security: number };
    recent: { ts: string; level: string; msg: string; meta?: Record<string, unknown> }[];
  };
}

const LEVEL_CLS: Record<string, string> = {
  info: "border-primary/30 bg-primary/10 text-primary",
  warn: "border-gold/40 bg-gold/10 text-gold-deep",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  security: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
};

const QUEUE_LABEL: Record<string, string> = {
  privacyPending: "Permintaan PDP",
  ordersPending: "Order Menunggu Bayar",
  threadsPending: "Diskusi Moderasi",
  applicationsPending: "Pendaftaran Anggota",
};

function up(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d}h ${h}j ${m}m` : h > 0 ? `${h}j ${m}m` : `${m}m`;
}

export function AdminObservability() {
  const [data, setData] = useState<Metrics | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    apiGet<Metrics>("/api/metrics").then(setData).catch((e) => setErr((e as Error).message));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000); // refresh tiap 30 detik
    return () => clearInterval(t);
  }, [load]);

  if (err) {
    return <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">Gagal memuat metrik: {err}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name="gauge" className="h-5 w-5 text-primary" aria-hidden />
            Kesehatan Sistem
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Log terstruktur, uptime, antrean kerja, dan pembatas laju adaptif. Data diperbarui tiap 30 detik.
          </p>
        </div>
        {data ? (
          <Badge variant="outline" className={data.database.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : "border-destructive/40 bg-destructive/10 text-destructive"}>
            {data.database.ok ? `DB OK · ${data.database.latencyMs}ms` : "DB ERROR"}
          </Badge>
        ) : null}
      </div>

      {!data ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* RUNTIME */}
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Uptime Proses", value: up(data.runtime.uptimeSec), icon: "clock" },
              { label: "Memori (RSS)", value: `${data.runtime.memoryMb} MB`, icon: "hard-drive" },
              { label: "Load (1m)", value: data.runtime.loadAvg1 ?? "—", icon: "trending-up" },
              { label: "Latensi DB", value: `${data.database.latencyMs} ms`, icon: "database-zap" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Icon name={c.icon} className="h-4 w-4" aria-hidden /> {c.label}
                </div>
                <p className="mt-1.5 text-xl font-extrabold text-foreground">{c.value}</p>
              </div>
            ))}
          </div>

          {/* ANTREAN KERJA */}
          <div>
            <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Antrean Kerja</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {Object.entries(data.database.queues).map(([k, v]) => (
                <div key={k} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{QUEUE_LABEL[k] || k}</p>
                  <p className={cn("mt-1 text-2xl font-extrabold", v > 0 ? "text-gold-deep" : "text-muted-foreground/50")}>{v < 0 ? "—" : v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RATE LIMIT ADAPTIF */}
          <div>
            <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Pembatas Laju Adaptif</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">IP Diblokir</p>
                <p className={cn("mt-1 text-2xl font-extrabold", data.adaptive.blockedCount > 0 ? "text-destructive" : "text-muted-foreground/50")}>{data.adaptive.blockedCount}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">IP Melanggar</p>
                <p className="mt-1 text-2xl font-extrabold text-gold-deep">{data.adaptive.violatingIps.length}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Bucket Aktif</p>
                <p className="mt-1 text-2xl font-extrabold">{data.adaptive.activeBuckets}</p>
              </div>
            </div>
          </div>

          {/* LOG TERAKHIR */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
              Log Terakhir
              <Badge variant="outline" className="text-[10px]">{data.logs.stats.total} kejadian/jam</Badge>
              {data.logs.stats.security > 0 && (
                <Badge variant="outline" className={cn("text-[10px]", LEVEL_CLS.security)}>security {data.logs.stats.security}</Badge>
              )}
            </h3>
            <div className="max-h-96 space-y-1.5 overflow-auto rounded-2xl border bg-card p-3 shadow-sm">
              {data.logs.recent.slice().reverse().slice(0, 40).map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Badge variant="outline" className={cn("shrink-0 text-[9px] uppercase", LEVEL_CLS[e.level] || LEVEL_CLS.info)}>{e.level}</Badge>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{new Date(e.ts).toLocaleTimeString("id-ID")}</span>
                  <span className="min-w-0 font-mono">{e.msg}{e.meta ? ` ${JSON.stringify(e.meta)}` : ""}</span>
                </div>
              ))}
              {data.logs.recent.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">Belum ada log.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
