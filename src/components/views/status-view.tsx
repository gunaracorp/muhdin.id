"use client";

/**
 * status-view.tsx — v13.1 — R-097 «Papan Status Layanan Publik».
 * Transparansi uptime: kesehatan on-request (DB, runtime, data inti) + riwayat
 * 60 sampel terakhir sebagai sparkline. Data nyata dari GET /api/status —
 * setiap buka halaman juga mencatat satu sampel baru.
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { TrustHero } from "@/components/views/p0-shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";

interface StatusData {
  ok: boolean;
  version: string;
  runtime: { node: string; platform: string; uptimeSec: number; memoryMb: number };
  db: { ok: boolean; latencyMs: number };
  data: { members: number; packages: number; orders: number; reviews: number };
  history: { dbLatencyMs: number; uptimeSec: number; memoryMb: number; ok: boolean; createdAt: string }[];
  metrics: { uptimePct: number | null; avgLatency: number | null; samples: number };
  timestamp: string;
}

function uptimeLabel(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}h ${h}j ${m}m`;
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

function LiveCard({ icon, label, value, tone }: { icon: string; label: string; value: React.ReactNode; tone?: "ok" | "warn" }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Icon name={icon} className="h-4 w-4" aria-hidden />
        {label}
      </div>
      <div className={cn2("text-2xl font-extrabold tabular-nums", tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

function cn2(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function Sparkline({ history }: { history: StatusData["history"] }) {
  // bar chart 60 sampel, tinggi proporsional latensi (maks 400ms skala penuh)
  const rows = [...history].reverse();
  const max = Math.max(80, ...rows.map((r) => r.dbLatencyMs));
  return (
    <div className="flex h-28 items-end gap-[3px]" aria-hidden>
      {rows.map((r, i) => {
        const pct = Math.min(100, (r.dbLatencyMs / max) * 100);
        return (
          <span
            key={i}
            title={`${r.dbLatencyMs} ms — ${new Date(r.createdAt).toLocaleString()}`}
            className={cn2("flex-1 rounded-t-sm", r.ok ? (r.dbLatencyMs > 120 ? "bg-amber-500/70" : "bg-emerald-500/70") : "bg-red-500/80")}
            style={{ height: `${Math.max(6, pct)}%` }}
          />
        );
      })}
    </div>
  );
}

export function StatusView() {
  const { t } = useT();
  const [data, setData] = useState<StatusData | null>(null);
  const [err, setErr] = useState(false);

  const load = useCallback(() => {
    apiGet<StatusData>("/api/status")
      .then(setData)
      .catch(() => setErr(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const s = data;

  return (
    <div className="flex flex-col">
      <TrustHero tone="green" eyebrow={t("status.hero.eyebrow")} title={t("status.hero.title")} subtitle={t("status.hero.subtitle")} />

      <section aria-label={t("status.hero.title")} className="py-12">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6">
          {/* Kesehatan saat ini */}
          <div>
            <SectionHeading
              align="left"
              eyebrow={s?.ok ? "100%" : "—"}
              title={t("status.live.title")}
              subtitle={s ? `muhdin.id · ${s.version} · ${new Date(s.timestamp).toLocaleTimeString()}` : ""}
            />
            {err ? (
              <p className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/5 p-5 text-sm text-red-600 dark:text-red-300">
                {t("status.live.dbDown")} — /api/status
              </p>
            ) : !s ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <LiveCard
                  icon="database"
                  label={t("status.live.db")}
                  tone={s.db.ok ? "ok" : "warn"}
                  value={
                    <span className="inline-flex items-center gap-2">
                      <span className={cn2("inline-block h-2.5 w-2.5 rounded-full", s.db.ok ? "bg-emerald-500" : "bg-amber-500")} aria-hidden />
                      {s.db.ok ? t("status.live.dbOk") : t("status.live.dbDown")}
                    </span>
                  }
                />
                <LiveCard icon="zap" label={t("status.live.latency")} value={`${s.db.latencyMs} ms`} />
                <LiveCard icon="clock" label={t("status.live.uptime")} value={uptimeLabel(s.runtime.uptimeSec)} />
                <LiveCard icon="cpu" label={t("status.live.memory")} value={`${s.runtime.memoryMb} MB`} />
              </div>
            )}
          </div>

          {/* Data inti */}
          {s && (
            <Reveal>
              <div>
                <SectionHeading align="left" eyebrow="DATA" title={t("status.data.title")} subtitle="" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <LiveCard icon="users" label={t("status.data.members")} value={s.data.members.toLocaleString("id-ID")} />
                  <LiveCard icon="package" label={t("status.data.packages")} value={s.data.packages.toLocaleString("id-ID")} />
                  <LiveCard icon="receipt" label={t("status.data.orders")} value={s.data.orders.toLocaleString("id-ID")} />
                  <LiveCard icon="message-circle" label={t("status.data.reviews")} value={s.data.reviews.toLocaleString("id-ID")} />
                </div>
              </div>
            </Reveal>
          )}

          {/* Riwayat */}
          {s && (
            <Reveal>
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold">{t("status.history.title")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("status.history.subtitle")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      {t("status.history.uptimePct")}: {s.metrics.uptimePct ?? "—"}%
                    </Badge>
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                      {t("status.history.avgLatency")}: {s.metrics.avgLatency ?? "—"} ms
                    </Badge>
                    <Badge variant="outline">{t("status.history.samples")}: {s.metrics.samples}</Badge>
                  </div>
                </div>
                {s.history.length === 0 ? (
                  <p className="mt-6 text-sm text-muted-foreground">{t("status.history.empty")}</p>
                ) : (
                  <div className="mt-6">
                    <Sparkline history={s.history} />
                  </div>
                )}
              </div>
            </Reveal>
          )}

          <p className="text-center text-sm text-muted-foreground">{t("status.footer")}</p>
        </div>
      </section>
    </div>
  );
}
