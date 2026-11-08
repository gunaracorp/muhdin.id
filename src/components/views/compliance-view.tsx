"use client";

/**
 * v12.1 — GOD-MODE IZIN COMPLIANCE CHECKER (#/compliance).
 *
 * Compliance Center: papan kepatuhan SELURUH perusahaan registri MUHDIN,
 * dihitung live oleh engine Pindai Izin 360° — skor 0–100, grade A–E, level
 * risiko, riwayat tren antar-audit, dan dossier per-orang saat baris dibuka.
 * Data nyata dari /api/compliance/scoreboard + /api/compliance/report.
 *
 * Deep-link: #/compliance?q=<companyId> → dossier perusahaan langsung terbuka.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { DetailHero } from "@/components/views/detail-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GRADE_TONE, RISK_TONE, scoreColor, type Grade, type Risk } from "@/lib/compliance-engine";
import type { ScanResult } from "@/lib/license-engine";

interface BoardRow {
  id: string;
  nib: string;
  name: string;
  legalEntity: string;
  city: string;
  province: string;
  heldClasses: string[];
  currentClass: string | null;
  score: number;
  grade: Grade;
  risk: Risk;
  summary: { total: number; valid: number; expiring: number; expired: number; missing: number };
  lastCheckedAt: string | null;
}

interface BoardSummary {
  total: number;
  avgScore: number;
  grades: Record<Grade, number>;
  risks: Record<Risk, number>;
  expiredWajib: number;
  expiringWajib: number;
}

interface LastAudit {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  total: number;
  passed: number;
  warnings: number;
  critical: number;
  avgScore: number;
  notified: boolean;
}

interface TrendPoint {
  score: number;
  grade: string;
  risk: string;
  checkedAt: string;
}

interface ReportData {
  company: { id: string; nib: string; name: string; legalEntity: string; city: string; province: string };
  scan: ScanResult;
  grade: Grade;
  risk: Risk;
  trend: TrendPoint[];
}

interface BoardResponse {
  rows: BoardRow[];
  summary: BoardSummary;
  lastAudit: LastAudit | null;
}

const GRADES: Grade[] = ["A", "B", "C", "D", "E"];

export function ComplianceView({ initialQuery = "" }: { initialQuery?: string }) {
  const { t, locale } = useT();

  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [summary, setSummary] = useState<BoardSummary | null>(null);
  const [lastAudit, setLastAudit] = useState<LastAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(initialQuery || null);
  const [reports, setReports] = useState<Record<string, ReportData>>({});
  const [reportLoading, setReportLoading] = useState(false);
  const reportCache = useRef<Record<string, ReportData>>({});

  const dateFmt = useCallback(
    (iso: string | null) =>
      iso
        ? new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null,
    [locale]
  );

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<BoardResponse>("/api/compliance/scoreboard");
      setRows(data.rows);
      setSummary(data.summary);
      setLastAudit(data.lastAudit);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReport = useCallback(async (id: string) => {
    setReportLoading(true);
    try {
      const data = await apiGet<{ report: ReportData }>(`/api/compliance/report?id=${encodeURIComponent(id)}`);
      reportCache.current[id] = data.report;
      setReports((r) => ({ ...r, [id]: data.report }));
    } catch {
      /* biarkan baris tetap terbuka tanpa dossier — tidak fatal */
    } finally {
      setReportLoading(false);
    }
  }, []);

  const openReport = useCallback(
    async (id: string) => {
      setExpandedId((cur) => (cur === id ? null : id));
      if (reportCache.current[id]) {
        setReports((r) => ({ ...r, [id]: reportCache.current[id] }));
        return;
      }
      await fetchReport(id);
    },
    [fetchReport]
  );

  useEffect(() => {
    void loadBoard();
    // Deep-link #/compliance?q=<companyId> → dossier langsung terbuka.
    if (initialQuery) void fetchReport(initialQuery);
  }, [loadBoard, fetchReport, initialQuery]);

  const waHref = `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(
    "Assalamu'alaikum MUHDIN — saya ingin bertanya tentang kepatuhan izin & pendaftaran anggota."
  )}`;

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("compliance.eyebrow")}
        title={t("compliance.title")}
        subtitle={t("compliance.subtitle")}
        backTo="pindai"
        backLabel={t("compliance.cta.scan")}
        badge={
          <Badge className="gap-1 bg-gold text-black hover:bg-gold/90">
            <Icon name="shield-check" className="h-3 w-3" aria-hidden />
            {t("compliance.badge")}
          </Badge>
        }
      />

      {/* ===== RINGKASAN EKOSISTEM ===== */}
      <section className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Reveal className="-mt-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {loading || !summary ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
            ) : (
              <>
                <StatCard icon="building-2" label={t("compliance.stats.companies")} value={String(summary.total)} tone="text-primary" />
                <StatCard icon="gauge" label={t("compliance.stats.avg")} value={`${summary.avgScore}`} tone={scoreColor(summary.avgScore)} />
                <StatCard
                  icon="siren"
                  label={t("compliance.stats.critical")}
                  value={String(summary.grades.E)}
                  tone={summary.grades.E > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}
                />
                <StatCard
                  icon="hourglass"
                  label={t("compliance.stats.expiring")}
                  value={String(summary.expiringWajib)}
                  tone={summary.expiringWajib > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}
                />
              </>
            )}
          </div>

          {/* Chip audit terakhir */}
          {lastAudit && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-card/70 px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 font-extrabold uppercase tracking-widest text-gold-deep">
                <Icon name="activity" className="h-3.5 w-3.5" aria-hidden />
                {t("compliance.lastAudit.label")}
              </span>
              <span>
                {t("compliance.lastAudit.at")}: <strong className="text-foreground">{dateFmt(lastAudit.finishedAt ?? lastAudit.startedAt)}</strong>
              </span>
              <span>
                {t("compliance.lastAudit.score")}: <strong className="text-foreground">{Math.round(lastAudit.avgScore)}/100</strong>
              </span>
              <span>
                {t("compliance.lastAudit.critical")}: <strong className={cn(lastAudit.critical > 0 && "text-red-600 dark:text-red-400")}>{lastAudit.critical}</strong>
              </span>
            </div>
          )}
          {!loading && !lastAudit && !error && (
            <p className="mt-3 rounded-xl border border-dashed px-4 py-2.5 text-[11px] italic text-muted-foreground">
              {t("compliance.lastAudit.none")}
            </p>
          )}
        </Reveal>
      </section>

      {/* ===== SCOREBOARD ===== */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Reveal>
          <div className="mb-5">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">{t("compliance.board.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("compliance.board.sub")}</p>
          </div>
        </Reveal>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <Icon name="wifi-off" className="mx-auto h-8 w-8 text-destructive" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-destructive">Gagal memuat papan kepatuhan.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void loadBoard()}>
              <Icon name="refresh-cw" className="h-4 w-4" aria-hidden />
              Coba lagi
            </Button>
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {t("compliance.board.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row, idx) => {
              const isOpen = expandedId === row.id;
              const report = reports[row.id];
              return (
                <Reveal key={row.id} delay={Math.min(idx * 0.03, 0.2)}>
                  <div
                    className={cn(
                      "overflow-hidden rounded-2xl border bg-card transition-colors",
                      isOpen ? "border-gold/60 shadow-lg shadow-black/5" : "hover:border-gold/40"
                    )}
                  >
                    {/* Baris utama */}
                    <button
                      type="button"
                      onClick={() => void openReport(row.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 p-4 text-start sm:gap-4 sm:p-5"
                    >
                      {/* Peringkat */}
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black tabular-nums",
                          idx === 0 && "bg-gold/20 text-gold-deep",
                          idx > 0 && "bg-muted text-muted-foreground"
                        )}
                        aria-label={`#${idx + 1}`}
                      >
                        {idx + 1}
                      </span>

                      {/* Perusahaan */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold sm:text-base">{row.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span className="font-mono" dir="ltr">
                            NIB {row.nib}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="map-pin" className="h-3 w-3" aria-hidden />
                            {row.city}
                          </span>
                          <span>
                            {t("compliance.board.lastCheck")}:{" "}
                            {row.lastCheckedAt ? dateFmt(row.lastCheckedAt) : t("compliance.board.never")}
                          </span>
                        </p>
                        {/* Bar skor */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 max-w-56 flex-1 overflow-hidden rounded-full bg-muted" role="presentation">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ width: `${row.score}%`, backgroundColor: scoreColor(row.score) }}
                            />
                          </div>
                          <span className="text-xs font-black tabular-nums" dir="ltr" style={{ color: scoreColor(row.score) }}>
                            {row.score}
                          </span>
                        </div>
                      </div>

                      {/* Kelas + badge */}
                      <div className="hidden shrink-0 items-center gap-2 md:flex">
                        {row.heldClasses.length > 0 ? (
                          row.heldClasses.map((c) => (
                            <Badge key={c} variant="outline" className="text-[10px] font-bold">
                              {c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground">—</span>
                        )}
                        <span className={cn("rounded-lg px-2 py-1 text-xs font-black", GRADE_TONE[row.grade])} title={t(`compliance.grade.${row.grade}`)}>
                          {row.grade}
                        </span>
                        <span className={cn("rounded-lg px-2 py-1 text-[10px] font-bold", RISK_TONE[row.risk])}>
                          {t(`compliance.risk.${row.risk}`)}
                        </span>
                      </div>

                      <Icon
                        name="chevron-down"
                        className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                        aria-hidden
                      />
                    </button>

                    {/* Dossier terbuka */}
                    {isOpen && (
                      <div className="border-t bg-background/60 p-4 sm:p-6">
                        {reportLoading && !report ? (
                          <div className="space-y-3">
                            <Skeleton className="h-6 w-52 rounded-lg" />
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-xl" />
                              ))}
                            </div>
                          </div>
                        ) : report ? (
                          <div className="space-y-6">
                            {/* Ringkasan dokumen */}
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <MiniStat tone="text-emerald-600 dark:text-emerald-400" value={report.scan.summary.valid} label={t("compliance.board.summary.valid")} />
                              <MiniStat tone="text-amber-600 dark:text-amber-400" value={report.scan.summary.expiring} label={t("compliance.board.summary.expiring")} />
                              <MiniStat tone="text-red-600 dark:text-red-400" value={report.scan.summary.expired} label={t("compliance.board.summary.expired")} />
                              <MiniStat tone="text-muted-foreground" value={report.scan.summary.missing} label={t("compliance.board.summary.missing")} />
                            </div>

                            {/* Checklist 12 syarat */}
                            <div>
                              <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-gold-deep">
                                <Icon name="list-checks" className="h-3.5 w-3.5" aria-hidden />
                                {t("compliance.report.checklist")}
                              </p>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                {report.scan.checklist.map((c) => (
                                  <div
                                    key={c.key}
                                    className={cn(
                                      "rounded-xl border p-3",
                                      c.status === "EXPIRED" && "border-red-300 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30",
                                      c.status === "EXPIRING" && "border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30",
                                      c.status === "VALID" && "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20",
                                      c.status === "MISSING" && "border-dashed bg-muted/30"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="grid h-5 w-5 place-items-center rounded-md bg-foreground/10 text-[10px] font-black uppercase">
                                        {c.letter}
                                      </span>
                                      <span
                                        className={cn(
                                          "text-[9px] font-black tracking-wide",
                                          c.status === "VALID" && "text-emerald-600 dark:text-emerald-400",
                                          c.status === "EXPIRING" && "text-amber-600 dark:text-amber-400",
                                          c.status === "EXPIRED" && "text-red-600 dark:text-red-400",
                                          c.status === "MISSING" && "text-muted-foreground"
                                        )}
                                      >
                                        {t(`scan.status.${c.status}`)}
                                      </span>
                                    </div>
                                    <p className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-snug">{t(`scan.req.${c.key}.name`)}</p>
                                    {c.daysLeft !== null && c.status !== "VALID" && (
                                      <p className="mt-1 text-[10px] font-semibold text-muted-foreground" dir="ltr">
                                        {c.daysLeft < 0
                                          ? t("scan.checklist.expiredDays").replace("{d}", String(Math.abs(c.daysLeft)))
                                          : t("scan.checklist.daysLeft").replace("{d}", String(c.daysLeft))}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tren skor */}
                            <div>
                              <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-gold-deep">
                                <Icon name="trending-up" className="h-3.5 w-3.5" aria-hidden />
                                {t("compliance.report.trend")}
                              </p>
                              {report.trend.length === 0 ? (
                                <p className="text-[11px] italic text-muted-foreground">{t("compliance.report.noTrend")}</p>
                              ) : (
                                <div className="flex items-end gap-2" dir="ltr">
                                  {report.trend.map((p, i) => (
                                    <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                                      <span className="text-[10px] font-black tabular-nums text-muted-foreground">{p.score}</span>
                                      <div
                                        className="w-full max-w-10 rounded-t-md transition-all duration-700"
                                        style={{ height: `${Math.max(6, p.score * 0.6)}px`, backgroundColor: scoreColor(p.score) }}
                                        title={`${dateFmt(p.checkedAt)} — ${p.score}/100 (${p.grade})`}
                                      />
                                      <span className="w-full truncate text-center text-[9px] text-muted-foreground">{dateFmt(p.checkedAt)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Rekomendasi */}
                            {report.scan.recommendations.length > 0 && (
                              <div>
                                <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-gold-deep">
                                  <Icon name="lightbulb" className="h-3.5 w-3.5" aria-hidden />
                                  {t("compliance.report.recommendations")}
                                </p>
                                <ul className="space-y-1.5">
                                  {report.scan.recommendations.slice(0, 6).map((r) => (
                                    <li key={r.key} className="flex items-start gap-2 rounded-lg border bg-card px-3 py-2">
                                      <span
                                        className={cn(
                                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-black uppercase",
                                          r.tier === 0 && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                                          r.tier === 1 && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                                          r.tier >= 2 && "bg-muted text-muted-foreground"
                                        )}
                                      >
                                        {r.letter}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold">
                                          {t(`scan.req.${r.key}.name`)}
                                          <span className="ms-2 text-[9px] font-black tracking-wide text-gold-deep">
                                            {t(`compliance.report.tier.${r.tier}`)}
                                          </span>
                                        </p>
                                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{t(`scan.req.${r.key}.why`)}</p>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* CTA pindai */}
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" className="h-8 gap-1.5 text-[11px]" onClick={() => (window.location.hash = `/pindai?q=${encodeURIComponent(report.company.nib)}`)}>
                                <Icon name="scan" className="h-3.5 w-3.5" aria-hidden />
                                {t("compliance.report.viewScan")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs italic text-muted-foreground">—</p>
                        )}
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== CARA KERJA ===== */}
      <section className="border-t bg-muted/30 py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <Reveal>
            <h2 className="text-center text-xl font-black tracking-tight sm:text-2xl">{t("compliance.how.title")}</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(["s1", "s2", "s3"] as const).map((s, i) => (
              <Reveal key={s} delay={i * 0.08}>
                <div className="h-full rounded-2xl border bg-card p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-sm font-black text-primary">{i + 1}</span>
                  <p className="mt-3 text-sm font-extrabold">{t(`compliance.how.${s}t`)}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t(`compliance.how.${s}d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <Reveal>
          <div className="rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/15 via-card to-card p-8 text-center shadow-lg shadow-black/5">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">{t("compliance.cta.title")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t("compliance.cta.sub")}</p>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              GRATIS SELAMANYA · FREE FOREVER · مجاناً للأبد
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => (window.location.hash = "/pindai")}>
                <Icon name="scan" className="h-4 w-4" aria-hidden />
                {t("compliance.cta.scan")}
              </Button>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" asChild>
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <Icon name="message-circle" className="h-4 w-4" aria-hidden />
                  {BRAND.whatsappDisplay}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/** Kartu statistik ringkasan ekosistem. */
function StatCard({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
          <Icon name={icon} className="h-4 w-4 text-primary" aria-hidden />
        </span>
        <p className="text-[10px] font-extrabold uppercase leading-tight tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={cn("mt-2 text-2xl font-black tabular-nums", tone)} dir="ltr">
        {value}
      </p>
    </div>
  );
}

/** Mini-stat jumlah dokumen per status pada dossier. */
function MiniStat({ tone, value, label }: { tone: string; value: number; label: string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2 text-center">
      <p className={cn("text-lg font-black tabular-nums", tone)} dir="ltr">
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
