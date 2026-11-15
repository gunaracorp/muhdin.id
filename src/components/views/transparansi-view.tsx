"use client";

/**
 * Task 5-b-1 — TransparansiView: halaman Transparansi Terbuka (route #/transparansi).
 * Statistik keanggotaan live via apiGet("/api/members") + shell bersama p0-shared.
 * Semua teks lewat i18n namespace "transparansi" — RTL-aman & dark-mode-aman.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/client-api";
import { formatNumberL10n, useT } from "@/lib/i18n";
import { TrustCallout, TrustHero, TrustSection, TrustSteps } from "@/components/views/p0-shared";

/** Bentuk mentah baris /api/members (JSON array) — field publik saja. */
type PublicMember = {
  name: string;
  type: string;
  city: string;
  province: string;
  licenseNo: string;
  status: string;
};

const REPORT_ITEMS = [
  { key: "annual", icon: "book-marked" },
  { key: "finance", icon: "banknote" },
  { key: "minutes", icon: "clipboard-check" },
] as const;

const COMMIT_STEPS = [
  { key: "s1", icon: "activity" },
  { key: "s2", icon: "calendar" },
  { key: "s3", icon: "book-marked" },
  { key: "s4", icon: "timer" },
] as const;

const WATCH_ITEMS = [
  { key: "verify", icon: "scan", route: "verifikasi" },
  { key: "report", icon: "megaphone", route: "lapor" },
  { key: "sanction", icon: "gavel", route: "etik" },
  { key: "ticket", icon: "search", route: "lacak" },
] as const;

/** Audit 2026 — 8 KPI target awal (6–12 bulan) hasil audit kesiapan go-live. */
const KPI_AUDIT = ["k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8"] as const;

/** Audit 2026 — roadmap penyiapan operasional (0–30/31–60/61–90 hari/skala penuh). */
const ROADMAP_OPS = ["rm1", "rm2", "rm3", "rm4"] as const;

/** Label tipe member: pakai kamus members.type.* bila ada, fallback kode mentah. */
function typeLabel(ty: string, t: (k: string) => string): string {
  const val = t(`members.type.${ty}`);
  return val === `members.type.${ty}` ? ty : val;
}

export function TransparansiView() {
  const { t, locale } = useT();

  /* ---------- Statistik live ---------- */
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    data: PublicMember[] | null;
  }>({ loading: true, error: null, data: null });

  const load = useCallback(() => {
    // Semua setState berada di callback async (.then/.catch) — bukan sinkron
    // dalam body effect (aturan react-hooks/set-state-in-effect).
    apiGet<PublicMember[]>("/api/members")
      .then((rows) => setState({ loading: false, error: null, data: Array.isArray(rows) ? rows : [] }))
      .catch((e: unknown) =>
        setState({ loading: false, error: e instanceof Error ? e.message : "Error", data: null })
      );
  }, []);

  /** Retry eksplisit (event handler): reset ke skeleton lalu muat ulang. */
  const reload = useCallback(() => {
    setState({ loading: true, error: null, data: null });
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const rows = state.data ?? [];
    const verified = rows.filter((m) => (m.status || "").toUpperCase() === "TERVERIFIKASI");
    const base = verified.length > 0 ? verified : rows;

    const byType = new Map<string, number>();
    for (const m of base) byType.set(m.type, (byType.get(m.type) ?? 0) + 1);
    const topTypes = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const maxCount = topTypes.length > 0 ? topTypes[0][1] : 0;

    const provinces = new Set(base.map((m) => m.province).filter(Boolean));
    return { total: base.length, topTypes, maxCount, provinces: provinces.size };
  }, [state.data]);

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("transparansi.hero.eyebrow")}
        title={t("transparansi.hero.title")}
        subtitle={t("transparansi.hero.subtitle")}
      />

      <section aria-label={t("transparansi.hero.title")} className="py-12">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          {/* 1. Statistik Keanggotaan Live */}
          <TrustSection icon="activity" title={t("transparansi.stats.title")} desc={t("transparansi.stats.desc")}>
            {state.loading ? (
              <div className="space-y-4" role="status" aria-busy="true">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-24 rounded-2xl" />
                  <Skeleton className="h-24 rounded-2xl" />
                </div>
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            ) : state.error ? (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 sm:flex-row sm:items-center">
                <Icon name="alert-triangle" className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400" aria-hidden />
                <p className="flex-1 text-sm font-bold text-foreground/85">{t("transparansi.stats.error")}</p>
                <Button
                  variant="outline"
                  onClick={reload}
                  className="shrink-0 rounded-full font-bold"
                >
                  <Icon name="rotate" className="me-1.5 h-4 w-4" aria-hidden />
                  {t("transparansi.stats.retry")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Kartu angka utama */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-gold-deep dark:text-gold">
                      <Icon name="badge-check" className="h-4 w-4" aria-hidden />
                      {t("transparansi.stats.totalLabel")}
                    </div>
                    <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-foreground">
                      {formatNumberL10n(stats.total, locale)}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-card p-5">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-primary">
                      <Icon name="map" className="h-4 w-4" aria-hidden />
                      {t("transparansi.stats.provincesLabel")}
                    </div>
                    <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-foreground">
                      {formatNumberL10n(stats.provinces, locale)}
                    </p>
                  </div>
                </div>

                {/* Distribusi per tipe — bar horizontal */}
                <div className="rounded-2xl border bg-card p-5">
                  <p className="text-sm font-extrabold">{t("transparansi.stats.typesLabel")}</p>
                  <div className="mt-3 space-y-3">
                    {stats.topTypes.length === 0 && (
                      <p className="text-sm text-muted-foreground">{t("transparansi.stats.liveNote")}</p>
                    )}
                    {stats.topTypes.map(([ty, count]) => (
                      <div key={ty}>
                        <div className="flex items-center justify-between gap-3 text-[13px]">
                          <span className="font-bold text-foreground/90">{typeLabel(ty, t)}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {formatNumberL10n(count, locale)} {t("transparansi.stats.countSuffix")}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-forest transition-[width] duration-500"
                            style={{
                              width: `${stats.maxCount > 0 ? Math.max(6, Math.round((count / stats.maxCount) * 100)) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Catatan live */}
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {t("transparansi.stats.liveNote")}
                </p>
              </div>
            )}
          </TrustSection>

          {/* 2. Laporan yang Diterbitkan */}
          <TrustSection icon="file-text" title={t("transparansi.reports.title")} desc={t("transparansi.reports.desc")}>
            <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {REPORT_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-gold/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={item.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="text-[15px] font-extrabold leading-snug">
                      {t(`transparansi.reports.${item.key}T`)}
                    </h3>
                  </div>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground/75">
                    {t(`transparansi.reports.${item.key}D`)}
                  </p>
                  {item.key === "annual" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("unduhan")}
                      className="mt-3 self-start rounded-full font-bold"
                    >
                      {t("transparansi.reports.annualBtn")}
                      <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 3. Komitmen Publikasi */}
          <TrustSection icon="calendar" title={t("transparansi.commit.title")} desc={t("transparansi.commit.desc")}>
            <TrustSteps
              items={COMMIT_STEPS.map((s) => ({
                icon: s.icon,
                title: t(`transparansi.commit.${s.key}T`),
                desc: t(`transparansi.commit.${s.key}D`),
              }))}
            />
          </TrustSection>

          {/* 4. Kanal Pengawasan Publik */}
          <TrustSection icon="eye" title={t("transparansi.watch.title")} desc={t("transparansi.watch.desc")}>
            <div className="grid items-stretch gap-4 sm:grid-cols-2">
              {WATCH_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className="group flex h-full flex-col rounded-2xl border bg-card p-5 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={item.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="text-[15px] font-extrabold leading-snug">
                      {t(`transparansi.watch.${item.key}T`)}
                    </h3>
                  </div>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground/75">
                    {t(`transparansi.watch.${item.key}D`)}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
                    <Icon name="arrow-right" className="h-3.5 w-3.5 icon-flip" aria-hidden />
                  </span>
                </button>
              ))}
            </div>
          </TrustSection>

          {/* 5. Target KPI (Audit 2026) */}
          <TrustSection icon="target" title={t("audit13.kpi.title")} desc={t("audit13.kpi.desc")}>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.kpi.colName")}</th>
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.kpi.colBase")}</th>
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.kpi.colTarget")}</th>
                  </tr>
                </thead>
                <tbody>
                  {KPI_AUDIT.map((k) => (
                    <tr key={k} className="border-b last:border-b-0">
                      <td className="p-3.5 font-bold">{t(`audit13.kpi.${k}n`)}</td>
                      <td className="p-3.5 text-muted-foreground">{t(`audit13.kpi.${k}b`)}</td>
                      <td className="p-3.5">
                        <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                          {t(`audit13.kpi.${k}t`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("audit13.kpi.note")}</p>
          </TrustSection>

          {/* 6. Roadmap penyiapan operasional (Audit 2026) */}
          <TrustSection icon="calendar" title={t("audit13.kpi.roadmapTitle")} desc={t("audit13.kpi.roadmapDesc")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {ROADMAP_OPS.map((r) => (
                <div key={r} className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-gold-deep dark:text-gold">
                      {t(`audit13.kpi.${r}p`)}
                    </span>
                    <h3 className="text-[15px] font-extrabold leading-snug">{t(`audit13.kpi.${r}t`)}</h3>
                  </div>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground/75">
                    {t(`audit13.kpi.${r}d`)}
                  </p>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 7. Callout amber — catatan pendanaan */}
          <TrustCallout tone="amber" icon="alert-triangle" title={t("transparansi.callout.title")}>
            {t("transparansi.callout.text")}
          </TrustCallout>
        </div>
      </section>
    </div>
  );
}
