"use client";

/**
 * v7.0 — PINDAI IZIN 360° (#/pindai).
 *
 * Fitur pembeda MUHDIN: pengguna memasukkan NIB / nomor izin / nama perusahaan,
 * sistem membuka dossier kepatuhan — kelas usaha terdeteksi (BPW/PPIU/PIHK),
 * checklist 12 syarat kelengkapan (a–l) dinilai otomatis, skor dihitung, dan
 * rekomendasi berprioritas disusun + tautan mitra verifikasi/sertifikasi.
 *
 * Deep-link: #/pindai?q=<query> → pemindaian langsung berjalan saat halaman dibuka.
 * Semua data nyata dari /api/license-scan (rate limit 30/menit) — bukan mock.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { DetailHero } from "@/components/views/detail-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CERT_PARTNERS } from "@/lib/license-catalog";
import type { ScanResult } from "@/lib/license-engine";

interface Candidate {
  id: string;
  nib: string;
  name: string;
  legalEntity: string;
  city: string;
  province: string;
  docCount: number;
}

type ScanResponse =
  | { found: true; scannedAt: string; scan: ScanResult }
  | { found: false; reason: "NOT_FOUND" | "EMPTY_REGISTRY" | "MULTIPLE"; candidates?: Candidate[] };

const CLASSES = ["BPW", "PPIU", "PIHK"] as const;
const PARTNER = CERT_PARTNERS[0];

export function PindaiView({ initialQuery = "" }: { initialQuery?: string }) {
  const { t, locale } = useT();
  const { toast } = useToast();

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const runScan = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (q.length < 3) {
        toast({ title: t("scan.search.label"), description: t("scan.search.hint"), variant: "destructive" });
        return;
      }
      setLoading(true);
      setScan(null);
      setScannedAt(null);
      setCandidates(null);
      setNotFound(false);
      try {
        const res = await apiGet<ScanResponse>(`/api/license-scan?q=${encodeURIComponent(q)}`);
        if (res.found) {
          setScan(res.scan);
          setScannedAt(res.scannedAt);
        } else if (res.reason === "MULTIPLE" && res.candidates) {
          setCandidates(res.candidates);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        toast({ title: t("scan.state.scanning"), description: (err as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [t, toast]
  );

  // Deep-link: #/pindai?q=... → langsung pindai saat mount.
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length >= 3) void runScan(initialQuery);
  }, []);

  const copySummary = async () => {
    if (!scan) return;
    const lines = [
      `${t("scan.company.dossier")} — ${scan.company.name}`,
      `${t("scan.company.nib")}: ${scan.company.nib}`,
      `${t("scan.score.label")}: ${scan.score}/100`,
      ...scan.checklist.map((c) => `${c.letter}) ${t(`scan.req.${c.key}.name`)} — ${t(`scan.status.${c.status}`)}`),
      "",
      PARTNER.name + " — " + PARTNER.url,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast({ title: t("scan.actions.copied") });
    } catch {
      toast({ title: t("scan.actions.copy"), variant: "destructive" });
    }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/#/pindai?q=${encodeURIComponent(scan?.company.name ?? query)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("scan.actions.shareCopied") });
    } catch {
      toast({ title: t("scan.actions.share"), variant: "destructive" });
    }
  };

  const scoreColor = scan ? (scan.score >= 80 ? "#10b981" : scan.score >= 50 ? "#d4af37" : "#ef4444") : "#888";
  const C = 2 * Math.PI * 54;

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("scan.eyebrow")}
        title={t("scan.title")}
        subtitle={t("scan.subtitle")}
        backTo="bisnis"
        backLabel={t("footer.quick.bisnis")}
      />

      {/* ===== PANEL PENCARIAN ===== */}
      <section className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Reveal className="-mt-8">
          <div className="rounded-2xl border border-gold/40 bg-card p-5 shadow-lg shadow-black/5 sm:p-6">
            <label htmlFor="pindai-input" className="text-xs font-extrabold uppercase tracking-[0.15em] text-gold-deep">
              {t("scan.search.label")}
            </label>
            <form
              className="mt-2 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                void runScan(query);
              }}
            >
              <div className="relative flex-1">
                <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="pindai-input"
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("scan.search.placeholder")}
                  aria-label={t("scan.search.aria")}
                  className="h-12 bg-background ps-9 text-sm font-semibold"
                  dir="auto"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 gap-2 bg-gold px-6 text-xs font-extrabold tracking-widest text-forest-deep hover:bg-gold-soft"
              >
                {loading ? (
                  <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Icon name="scan" className="h-4 w-4" aria-hidden />
                )}
                {t("scan.search.cta")}
              </Button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground">{t("scan.search.hint")}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("scan.search.examples")}
              </span>
              {(["ex1", "ex2", "ex3"] as const).map((k, i) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    const v = ["PT Arofah Global", "8120099887766", "CV Mabrur Safar Lestari"][i];
                    setQuery(v);
                    void runScan(v);
                  }}
                  className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold text-gold-deep transition hover:bg-gold/20"
                >
                  {t(`scan.search.${k}`)}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ===== CARA KERJA (state idle) ===== */}
        {!scan && !loading && !candidates && !notFound && (
          <div className="mt-8">
            <p className="flex items-center gap-2 text-sm font-extrabold">
              <Icon name="workflow" className="h-4 w-4 text-gold" aria-hidden />
              {t("scan.how.title")}
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {(["s1", "s2", "s3"] as const).map((k, i) => (
                <Reveal key={k} delay={i * 0.08}>
                  <div className="h-full rounded-2xl border bg-card p-5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold-deep">
                      <Icon name={["keyboard", "folder-open", "list-checks"][i] as "keyboard"} className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <p className="mt-3 text-sm font-extrabold">{t(`scan.how.${k}t`)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`scan.how.${k}d`)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* ===== LOADING ===== */}
        {loading && (
          <div className="mt-8 space-y-4" aria-busy="true" aria-label={t("scan.state.scanning")}>
            <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Icon name="radar" className="h-4 w-4 animate-pulse text-gold" aria-hidden />
              {t("scan.state.scanning")}
            </p>
            <Skeleton className="h-32 rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
        )}

        {/* ===== KANDIDAT GANDA ===== */}
        {candidates && (
          <div className="mt-8 rounded-2xl border bg-card p-5">
            <p className="text-sm font-extrabold">{t("scan.state.candidates")}</p>
            <div className="mt-3 space-y-2">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setQuery(c.name);
                    void runScan(c.name);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-start transition hover:border-gold/50 hover:bg-gold/5"
                >
                  <span>
                    <span className="block text-sm font-extrabold">{c.name}</span>
                    <span className="block text-xs text-muted-foreground" dir="ltr">
                      {t("scan.company.nib")}: {c.nib} · {c.city}
                    </span>
                  </span>
                  <Icon name="chevron-right" className="h-4 w-4 text-gold rtl:rotate-180" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== TIDAK DITEMUKAN ===== */}
        {notFound && (
          <Reveal className="mt-8">
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <Icon name="file-question" className="mx-auto h-10 w-10 text-destructive/70" aria-hidden />
              <p className="mt-3 text-lg font-extrabold">{t("scan.state.notFoundTitle")}</p>
              <p className="mx-auto mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t("scan.state.notFoundDesc")}
              </p>
              <a href={PARTNER.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                <Button className="gap-2 bg-gold text-xs font-extrabold tracking-widest text-forest-deep hover:bg-gold-soft">
                  <Icon name="external-link" className="h-4 w-4" aria-hidden />
                  {t("scan.state.notFoundCta")}
                </Button>
              </a>
            </div>
          </Reveal>
        )}

        {/* ===== DOSSIER HASIL ===== */}
        {scan && (
          <div className="mt-8 space-y-6 pb-4">
            {/* Header perusahaan + skor */}
            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card shadow-lg shadow-black/5">
                <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-deep">
                      <Icon name="fingerprint" className="h-3.5 w-3.5" aria-hidden />
                      {t("scan.company.dossier")}
                    </p>
                    <h2 className="mt-1 truncate text-2xl font-black tracking-tight">{scan.company.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono font-bold" dir="ltr">
                        {t("scan.company.nib")}: {scan.company.nib}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="map-pin" className="h-3.5 w-3.5" aria-hidden />
                        {scan.company.city}
                        {scan.company.province ? `, ${scan.company.province}` : ""}
                      </span>
                      <span>{scan.company.legalEntity}</span>
                      {scannedAt && (
                        <span className="hidden sm:inline">
                          {t("scan.company.scannedAt")}: {dateFmt(scannedAt)}
                        </span>
                      )}
                    </div>
                    {scan.company.note && (
                      <p className="mt-2 max-w-lg rounded-lg bg-muted/40 px-3 py-1.5 text-[11px] italic text-muted-foreground">
                        {scan.company.note}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[11px]" onClick={() => void copySummary()}>
                        <Icon name="copy" className="h-3.5 w-3.5" aria-hidden />
                        {t("scan.actions.copy")}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[11px]" onClick={() => void shareLink()}>
                        <Icon name="share-2" className="h-3.5 w-3.5" aria-hidden />
                        {t("scan.actions.share")}
                      </Button>
                    </div>
                  </div>

                  {/* Ring skor */}
                  <div className="shrink-0 self-center text-center">
                    <div className="relative h-32 w-32">
                      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
                        <circle cx="64" cy="64" r="54" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/40" />
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          fill="none"
                          stroke={scoreColor}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={C}
                          strokeDashoffset={C * (1 - scan.score / 100)}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 grid place-items-center" aria-hidden>
                        <div>
                          <p className="text-3xl font-black tabular-nums" dir="ltr">
                            {scan.score}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground">{t("scan.score.of")}</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                      {t("scan.score.label")}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Kelas usaha terdeteksi */}
            <Reveal delay={0.05}>
              <div>
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <Icon name="id-card" className="h-4 w-4 text-gold" aria-hidden />
                  {t("scan.class.title")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {CLASSES.map((cls) => {
                    const st = scan.classStatus[cls];
                    const active = st === "AKTIF";
                    const dead = st === "BERMASALAH";
                    return (
                      <div
                        key={cls}
                        className={cn(
                          "rounded-2xl border p-4",
                          active && "border-emerald-500/40 bg-emerald-500/5",
                          dead && "border-destructive/40 bg-destructive/5",
                          !active && !dead && "border-border bg-muted/20"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-lg font-black tracking-tight">{cls}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-extrabold",
                              active && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                              dead && "border-destructive/40 bg-destructive/10 text-destructive",
                              !active && !dead && "text-muted-foreground"
                            )}
                          >
                            {t(`scan.class.${st}`)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">{t(`scan.class.${cls}`)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* Jalur naik kelas */}
            <Reveal delay={0.05}>
              <div className="rounded-2xl border bg-card p-5">
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <Icon name="trending-up" className="h-4 w-4 text-gold" aria-hidden />
                  {t("scan.path.title")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("scan.path.desc")}</p>
                <div className="mt-4 flex items-center gap-2">
                  {CLASSES.map((cls, i) => {
                    const rank = i + 1;
                    const currentRank = scan.currentClass ? CLASSES.indexOf(scan.currentClass) + 1 : 0;
                    const done = rank < currentRank;
                    const current = rank === currentRank;
                    const isNext = scan.nextClass === cls;
                    return (
                      <div key={cls} className="flex flex-1 items-center gap-2">
                        {i > 0 && <span className="h-px flex-1 bg-border" aria-hidden />}
                        <div
                          className={cn(
                            "flex-1 rounded-xl border px-3 py-2 text-center",
                            done && "border-emerald-500/40 bg-emerald-500/10",
                            current && "border-gold/60 bg-gold/10",
                            !done && !current && "border-border bg-muted/20"
                          )}
                        >
                          <p className={cn("text-sm font-black", current && "text-gold-deep")}>{cls}</p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {done ? t("scan.path.done") : current ? t("scan.path.current") : isNext ? t("scan.path.next") : t("scan.path.locked")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* Checklist a–l */}
            <Reveal delay={0.05}>
              <div>
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <Icon name="list-checks" className="h-4 w-4 text-gold" aria-hidden />
                  {t("scan.checklist.title")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("scan.checklist.sub")}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {scan.checklist.map((c) => {
                    const ok = c.status === "VALID";
                    const warn = c.status === "EXPIRING";
                    const bad = c.status === "EXPIRED";
                    return (
                      <div
                        key={c.key}
                        className={cn(
                          "flex gap-3 rounded-2xl border p-4",
                          ok && "border-emerald-500/30 bg-emerald-500/[0.04]",
                          warn && "border-gold/50 bg-gold/5",
                          bad && "border-destructive/40 bg-destructive/[0.04]"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black uppercase",
                            ok && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                            warn && "bg-gold/20 text-gold-deep",
                            bad && "bg-destructive/10 text-destructive",
                            !ok && !warn && !bad && "bg-muted text-muted-foreground"
                          )}
                          aria-label={c.letter}
                        >
                          {c.letter}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-extrabold leading-snug">{t(`scan.req.${c.key}.name`)}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{t(`scan.req.${c.key}.issuer`)}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-extrabold",
                                ok && "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
                                warn && "border-gold/50 text-gold-deep",
                                bad && "border-destructive/40 text-destructive",
                                !ok && !warn && !bad && "text-muted-foreground"
                              )}
                            >
                              {t(`scan.status.${c.status}`)}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground">
                              {t(`scan.rel.${c.relevance}`)}
                            </Badge>
                          </div>
                          {c.docNo && (
                            <p className="mt-1.5 truncate font-mono text-[10px] text-muted-foreground" dir="ltr" title={c.docNo}>
                              {c.docNo}
                            </p>
                          )}
                          {c.validUntil && (
                            <p className="text-[10px] font-semibold text-muted-foreground">
                              {dateFmt(c.validUntil)}
                              {c.daysLeft !== null &&
                                (c.daysLeft >= 0
                                  ? ` · ${t("scan.checklist.daysLeft", { d: c.daysLeft })}`
                                  : ` · ${t("scan.checklist.expiredDays", { d: Math.abs(c.daysLeft) })}`)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* Rekomendasi prioritas */}
            <Reveal delay={0.05}>
              <div className="rounded-2xl border bg-card p-5 sm:p-6">
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <Icon name="clipboard-check" className="h-4 w-4 text-gold" aria-hidden />
                  {t("scan.reco.title")}
                  {scan.recommendations.length > 0 && (
                    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                      {t("scan.reco.gapCount", { n: scan.recommendations.length })}
                    </Badge>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("scan.reco.sub")}</p>

                {scan.recommendations.length === 0 ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <Icon name="check-circle-2" className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{t("scan.reco.empty")}</p>
                  </div>
                ) : (
                  <ol className="mt-4 space-y-4">
                    {scan.recommendations.map((r, idx) => (
                      <li
                        key={r.key}
                        className={cn(
                          "relative rounded-2xl border p-4 ps-5 sm:ps-6",
                          r.tier === 0 && "border-destructive/40 bg-destructive/[0.04]",
                          r.tier === 1 && "border-gold/50 bg-gold/5",
                          r.tier > 1 && "border-border bg-muted/10"
                        )}
                      >
                        <div className="flex flex-wrap items-start gap-3">
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black uppercase",
                              r.tier === 0 && "bg-destructive text-white",
                              r.tier === 1 && "bg-gold text-forest-deep",
                              r.tier > 1 && "bg-foreground/10 text-foreground"
                            )}
                          >
                            {r.letter}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-extrabold">{t(`scan.req.${r.key}.name`)}</p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] font-extrabold",
                                  r.status === "EXPIRED" && "border-destructive/40 text-destructive",
                                  r.status === "EXPIRING" && "border-gold/50 text-gold-deep",
                                  r.status === "MISSING" && "text-muted-foreground"
                                )}
                              >
                                {t(`scan.status.${r.status}`)}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground">
                                {t(`scan.rel.${r.relevance}`)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`scan.req.${r.key}.why`)}</p>

                            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gold-deep">
                                  {t("scan.reco.steps")}
                                </p>
                                <ol className="mt-1 space-y-0.5">
                                  {(["s1", "s2", "s3"] as const).map((s) => (
                                    <li key={s} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                      <span className="mt-px font-black text-gold-deep">{s === "s1" ? "1" : s === "s2" ? "2" : "3"}.</span>
                                      <span>{t(`scan.req.${r.key}.${s}`)}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-[11px]">
                                  <span className="font-extrabold">{t("scan.reco.issuer")}:</span>{" "}
                                  <span className="text-muted-foreground">{t(`scan.req.${r.key}.issuer`)}</span>
                                </p>
                                <p className="text-[11px]">
                                  <span className="font-extrabold">{t("scan.reco.duration")}:</span>{" "}
                                  <span className="text-muted-foreground">{t(`scan.req.${r.key}.dur`)}</span>
                                </p>
                              </div>
                            </div>

                            <a
                              href={PARTNER.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-gold-deep underline-offset-2 hover:underline"
                            >
                              <Icon name="external-link" className="h-3 w-3" aria-hidden />
                              {t("scan.partner.perItem")}
                            </a>
                          </div>
                          <span className="hidden text-[10px] font-bold text-muted-foreground/50 sm:block" aria-hidden>
                            #{idx + 1}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Reveal>

            {/* Panel mitra sertifikasi */}
            <Reveal delay={0.05}>
              <div className="overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/15 via-card to-card">
                <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-deep">
                      <Icon name="award" className="h-3.5 w-3.5" aria-hidden />
                      {t("scan.partner.title")}
                    </p>
                    <p className="mt-1 text-base font-black">{PARTNER.name}</p>
                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">{t("scan.partner.desc")}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PARTNER.services.map((s) => (
                        <Badge key={s} variant="outline" className="border-gold/40 bg-gold/10 text-[9px] font-extrabold text-gold-deep">
                          {t(`scan.partner.${s}`)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-1.5">
                    <a href={PARTNER.url} target="_blank" rel="noopener noreferrer">
                      <Button className="gap-2 bg-gold px-6 text-xs font-extrabold tracking-widest text-forest-deep hover:bg-gold-soft">
                        <Icon name="external-link" className="h-4 w-4" aria-hidden />
                        {t("scan.partner.cta")}
                      </Button>
                    </a>
                    <p className="text-[10px] text-muted-foreground">{t("scan.partner.note")}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <p className="pb-2 text-[11px] leading-relaxed text-muted-foreground/80">{t("scan.disclaimer")}</p>
          </div>
        )}

        {/* empty hint saat idle */}
        {!scan && !loading && !candidates && !notFound && (
          <p className="mt-6 pb-4 text-center text-xs text-muted-foreground">{t("scan.state.emptyHint")}</p>
        )}
      </section>
    </div>
  );
}
