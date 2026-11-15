"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading, Stagger, StaggerItem, CountUp } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, formatDateL10n, formatNumberL10n, type Locale } from "@/lib/i18n";
import type { NusukMetrics, NusukPublicData, NusukSyncLog } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ================= KONSTANTA ================= */

/** Layanan Nusuk per ekosistem — teks di kamus (nusuk.svc*), nomor & level tetap di kode. */
const NUSUK_SERVICES: Record<number, { key: string; level: "LIVE" | "PILOT" | string }> = {
  1: { key: "nusuk.svc1", level: "LIVE" },
  2: { key: "nusuk.svc2", level: "LIVE" },
  3: { key: "nusuk.svc3", level: "LIVE" },
  4: { key: "nusuk.svc4", level: "LIVE" },
  5: { key: "nusuk.svc5", level: "LIVE" },
  6: { key: "nusuk.svc6", level: "LIVE" },
  7: { key: "nusuk.svc7", level: "PILOT" },
  8: { key: "nusuk.svc8", level: "PILOT" },
  9: { key: "nusuk.svc9", level: "LIVE" },
  10: { key: "nusuk.svc10", level: "PILOT" },
  11: { key: "nusuk.svc11", level: "Q3 2026" },
  12: { key: "nusuk.svc12", level: "Q1 2027" },
  13: { key: "nusuk.svc13", level: "Q2 2027" },
};

/** Ekosistem dengan izin tersinkron live (VISA, HANDLING, MUTAWIF, HOTEL, TRANSPORT, RAUDAH) */
const SYNCED_ECOSYSTEMS = new Set([1, 2, 3, 5, 6, 7, 9]);

/** Kode → key kamus (kode tetap dipakai untuk logika, label via kamus). */
const PERMIT_TYPE_KEYS: Record<string, string> = {
  VISA: "nusuk.permitTypeVISA",
  HANDLING: "nusuk.permitTypeHANDLING",
  MUTAWIF: "nusuk.permitTypeMUTAWIF",
  HOTEL: "nusuk.permitTypeHOTEL",
  TRANSPORT: "nusuk.permitTypeTRANSPORT",
  RAUDAH: "nusuk.permitTypeRAUDAH",
};

const STATUS_KEYS: Record<string, string> = {
  ACTIVE: "nusuk.statusACTIVE",
  PENDING: "nusuk.statusPENDING",
  EXPIRED: "nusuk.statusEXPIRED",
  REJECTED: "nusuk.statusREJECTED",
};

/** Kelas warna status izin — label teks via kamus.
 *  REJECTED: dark mode memakai tint (destructive 0.704 terlalu terang utk teks putih) */
const PERMIT_STATUS_CLS: Record<string, string> = {
  ACTIVE: "bg-primary text-white border-transparent shadow-md",
  PENDING: "bg-gold/15 text-gold-deep border-gold/50",
  EXPIRED: "bg-muted text-muted-foreground border-border",
  REJECTED: "bg-destructive text-white border-transparent shadow-md dark:bg-destructive/15 dark:text-destructive dark:border-destructive/40 dark:shadow-none",
};

const LOG_TYPE_KEYS: Record<string, string> = {
  FULL_SYNC: "nusuk.logTypeFULL_SYNC",
  WEBHOOK: "nusuk.logTypeWEBHOOK",
  CONNECTION: "nusuk.logTypeCONNECTION",
};

const ENV_KEYS: Record<string, string> = {
  SANDBOX: "nusuk.envSANDBOX",
  PRODUCTION: "nusuk.envPRODUCTION",
};

const MEMBER_TYPE_KEYS: Record<string, string> = {
  PPIU: "nusuk.mtPPIU",
  PIHK: "nusuk.mtPIHK",
  KBIHU: "nusuk.mtKBIHU",
  IPHI: "nusuk.mtIPHI",
  TRAVEL_WISATA: "nusuk.mtTRAVEL_WISATA",
};

const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/nusuk/public",
    copy: "/api/nusuk/public",
    descKey: "nusuk.epPublicDesc",
    authKey: "nusuk.authPublic",
  },
  {
    method: "GET",
    path: "/api/nusuk/verify?no=…",
    copy: "/api/nusuk/verify?no=NSK-VSA-2026-482913",
    descKey: "nusuk.epVerifyDesc",
    authKey: "nusuk.authPublic",
  },
  {
    method: "POST",
    path: "/api/nusuk/webhook",
    copy: "/api/nusuk/webhook",
    descKey: "nusuk.epWebhookDesc",
    authKey: "nusuk.authSignature",
  },
  {
    method: "POST",
    path: "/api/nusuk/sync",
    copy: "/api/nusuk/sync",
    descKey: "nusuk.epSyncDesc",
    authKey: "nusuk.authAdmin",
  },
];

/* ================= TIPE LOKAL ================= */

interface VerifyResponse {
  permit: {
    permitNo: string;
    type: string;
    holderName: string;
    status: string;
    meta: string | null;
    issuedAt: string;
    expiresAt: string;
    lastSync: string;
  };
  member: { name: string; type: string; city: string; licenseNo: string; status: string };
  checkedAt: string;
  environment: string;
}

/* ================= UTIL KECIL ================= */

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function numL10n(n: number, locale: Locale) {
  return formatNumberL10n(Number(n) || 0, locale);
}

function rateL10n(n: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-GB", {
      maximumFractionDigits: 1,
    }).format(Number(n) || 0);
  } catch {
    return String(n);
  }
}

/** Versi l10n dari timeAgo (client-api) — logika sama, teks via kamus. */
function timeAgoL10n(iso: string | null | undefined, t: TFn) {
  if (!iso) return t("nusuk.agoNever");
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.max(1, Math.floor(diff / 1000));
    if (s < 60) return t("nusuk.agoSec", { n: s });
    const m = Math.floor(s / 60);
    if (m < 60) return t("nusuk.agoMin", { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t("nusuk.agoHour", { n: h });
    const d = Math.floor(h / 24);
    return t("nusuk.agoDay", { n: d });
  } catch {
    return iso ?? "";
  }
}

function durL10n(ms: number, locale: Locale, t: TFn) {
  if (ms < 1000) return t("nusuk.durMs", { n: numL10n(ms, locale) });
  return t("nusuk.durSec", { n: rateL10n(ms / 1000, locale) });
}

function permitTypeLabel(type: string, t: TFn) {
  const key = PERMIT_TYPE_KEYS[type];
  return key ? t(key) : type;
}

function memberTypeLabel(type: string, t: TFn) {
  const key = MEMBER_TYPE_KEYS[type];
  return key ? t(key) : type;
}

function envLabelOf(env: string, t: TFn) {
  const key = ENV_KEYS[env];
  return key ? t(key) : env;
}

/* ================= CHIP & LABEL ================= */

function LevelChip({ level }: { level: string }) {
  if (level === "LIVE") {
    return (
      <Badge className="bg-primary text-white border-transparent text-[9px] px-2 py-0.5 shrink-0">
        LIVE
      </Badge>
    );
  }
  if (level === "PILOT") {
    return (
      <Badge variant="outline" className="border-gold/50 bg-gold/10 text-gold-deep text-[9px] px-2 py-0.5 shrink-0">
        PILOT
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border text-muted-foreground text-[9px] px-2 py-0.5 shrink-0">
      {level}
    </Badge>
  );
}

function LogTypeChip({ type }: { type: string }) {
  const { t } = useT();
  const cls =
    type === "FULL_SYNC"
      ? "bg-primary/10 text-primary border-primary/30"
      : type === "WEBHOOK"
        ? "bg-gold/15 text-gold-deep border-gold/40"
        : "bg-muted text-muted-foreground border-border";
  const key = LOG_TYPE_KEYS[type];
  return (
    <Badge variant="outline" className={cn("text-[10px] font-bold", cls)}>
      <Icon
        name={type === "FULL_SYNC" ? "refresh" : type === "WEBHOOK" ? "webhook" : "plug"}
        className="h-3 w-3 me-1"
      />
      {key ? t(key) : type}
    </Badge>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useT();
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t("nusuk.copiedTitle"), description: label || t("nusuk.copiedDesc") });
    } catch {
      toast({
        title: t("nusuk.copyFailedTitle"),
        description: t("nusuk.copyFailedDesc"),
        variant: "destructive",
      });
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={t("nusuk.ariaCopy", { label: label || t("nusuk.fallbackCopyLabel") })}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      <Icon name="braces" className="h-3.5 w-3.5" />
      {t("nusuk.copy")}
    </button>
  );
}

/* ================= AUDIT 2026 — KAJIAN STRATEGIS ================= */

/** Kajian Strategis MUHDIN × NUSUK: integrasi resmi — bukan penggantian otoritas. */
function NusukPositioningSection() {
  const { t } = useT();
  const ARCH = ["a1", "a2", "a3", "a4", "a5", "a6"] as const;
  const FASES = [
    { p: "f1p", t: "f1t" },
    { p: "f2p", t: "f2t" },
    { p: "f3p", t: "f3t" },
    { p: "f4p", t: "f4t" },
  ] as const;

  return (
    <section className="py-14 sm:py-20" aria-labelledby="nusuk-pos-title">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon name="landmark" className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="nusuk-pos-title" className="text-lg font-extrabold leading-snug">
                {t("audit13.nusukpos.title")}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("audit13.nusukpos.desc")}</p>
            </div>
          </div>
        </Reveal>

        {/* Dua peran — berdampingan */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <Icon name="building-2" className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h3 className="text-[15px] font-extrabold leading-snug">{t("audit13.nusukpos.leftT")}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/75">{t("audit13.nusukpos.leftD")}</p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="h-full rounded-2xl border border-gold/40 bg-gold/5 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-deep">
                  <Icon name="satellite" className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h3 className="text-[15px] font-extrabold leading-snug">{t("audit13.nusukpos.rightT")}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/75">{t("audit13.nusukpos.rightD")}</p>
            </div>
          </Reveal>
        </div>

        {/* Arsitektur integrasi */}
        <Reveal>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="text-[15px] font-extrabold">{t("audit13.nusukpos.archTitle")}</h3>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {ARCH.map((k, i) => (
                <span key={k} className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-bold text-foreground/85">
                    {t(`audit13.nusukpos.${k}`)}
                  </span>
                  {i < ARCH.length - 1 && (
                    <Icon name="arrow-right" className="h-3.5 w-3.5 shrink-0 text-muted-foreground icon-flip" aria-hidden />
                  )}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Batas tegas */}
        <Reveal>
          <aside className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-5">
            <Icon name="alert-triangle" className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-400" aria-hidden />
            <div className="text-sm leading-relaxed text-foreground/85">
              <span className="font-extrabold">{t("audit13.nusukpos.warnTitle")}: </span>
              {t("audit13.nusukpos.warnText")}
            </div>
          </aside>
        </Reveal>

        {/* Fase integrasi */}
        <Reveal>
          <h3 className="text-[15px] font-extrabold">{t("audit13.nusukpos.faseTitle")}</h3>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FASES.map((f) => (
            <Reveal key={f.p}>
              <div className="h-full rounded-xl border bg-card p-4 text-center">
                <p className="text-xs font-black uppercase tracking-wider text-gold-deep dark:text-gold">
                  {t(`audit13.nusukpos.${f.p}`)}
                </p>
                <p className="mt-1.5 text-[13px] font-bold leading-snug text-foreground/85">
                  {t(`audit13.nusukpos.${f.t}`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= HERO ================= */

function Hero({ data }: { data: NusukPublicData | null }) {
  const { t, locale } = useT();
  const connected = data?.connection.status === "CONNECTED";
  const sandbox = data?.connection.environment === "SANDBOX";

  return (
    <section className="relative bg-forest-deep text-white overflow-hidden" aria-labelledby="nusuk-hero-title">
      <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-forest-deep to-forest" />
      <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float-soft" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <Reveal>
          <Badge className="bg-gold/20 text-gold-soft border border-gold/40 hover:bg-gold/30 hover:text-gold-soft px-3.5 py-1.5 text-[10px] sm:text-xs font-bold tracking-[0.18em]">
            <Icon name="satellite" className="h-3.5 w-3.5 me-1.5 shrink-0" />
            NUSUK CONNECT
          </Badge>
          <h1 id="nusuk-hero-title" className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
            {t("nusuk.heroTitle1")} <span className="text-gold-gradient">{t("nusuk.heroTitle2")}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-emerald-50/80 leading-relaxed">
            {data ? (
              <>
                {t(data.connection.autoSync ? "nusuk.heroDescAuto1" : "nusuk.heroDescManual1")}{" "}
                <span className="font-semibold text-white">{numL10n(data.connection.totalSyncs, locale)}×</span>{" "}
                {t("nusuk.heroDescPost", { env: envLabelOf(data.connection.environment, t) })}
              </>
            ) : (
              t("nusuk.heroLoading")
            )}
          </p>

          {/* 3 chip live */}
          <div className="mt-7 flex flex-wrap items-center gap-2.5" aria-label={t("nusuk.ariaConnStatus")}>
            {!data ? (
              <>
                <Skeleton className="h-8 w-40 rounded-full bg-white/10" />
                <Skeleton className="h-8 w-32 rounded-full bg-white/10" />
                <Skeleton className="h-8 w-52 rounded-full bg-white/10" />
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
                        connected ? "bg-emerald-400" : "bg-red-400"
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex h-2.5 w-2.5 rounded-full",
                        connected ? "bg-emerald-400" : "bg-red-400"
                      )}
                    />
                  </span>
                  {connected ? t("nusuk.chipConnected") : t("nusuk.chipDisconnected")} · {data.connection.status}
                </span>
                <span
                  title={data.connection.environment}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
                    sandbox
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
                  )}
                >
                  <Icon name="keyround" className="h-3.5 w-3.5 shrink-0" />
                  {envLabelOf(data.connection.environment, t)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold">
                  <Icon name="timer" className="h-3.5 w-3.5 text-gold shrink-0" />
                  {t("nusuk.lastSync", { ago: timeAgoL10n(data.connection.lastSyncAt, t) })}
                </span>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= METRIK LIVE ================= */

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="h-full rounded-2xl border bg-card p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight leading-none">{value}</div>
      <div className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

function MetricsSection({
  metrics,
  totalSyncs,
}: {
  metrics: NusukMetrics;
  totalSyncs: number;
}) {
  const { t, locale } = useT();
  return (
    <section className="py-14 sm:py-20" aria-labelledby="nusuk-metrics-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusuk.metricsEyebrow")}
          title={t("nusuk.metricsTitle")}
          subtitle={t("nusuk.metricsSubtitle")}
        />
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Reveal>
            <StatCard icon="shield-check" label={t("nusuk.statActivePermits")} value={numL10n(metrics.permitsActive, locale)} />
          </Reveal>
          <Reveal delay={0.06}>
            <StatCard icon="grid-3x3" label={t("nusuk.statMembersSynced")} value={numL10n(metrics.membersConnected, locale)} />
          </Reveal>
          <Reveal delay={0.12}>
            <StatCard icon="activity" label={t("nusuk.statSyncSuccess")} value={`${rateL10n(metrics.successRate, locale)}%`} />
          </Reveal>
          <Reveal delay={0.18}>
            <StatCard icon="refresh" label={t("nusuk.statTotalSyncs")} value={numL10n(totalSyncs, locale)} />
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="mt-4 rounded-2xl border bg-muted/40 p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1.5">
              <Icon name="database-zap" className="h-3.5 w-3.5 text-primary" />
              {t("nusuk.byTypeLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {metrics.byType.map((bt) => (
                <span
                  key={bt.type}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card border px-3 py-1 text-[11px] font-medium"
                  title={t("nusuk.typeChipTitle", {
                    label: permitTypeLabel(bt.type, t),
                    total: numL10n(bt.total, locale),
                    active: numL10n(bt.active, locale),
                  })}
                >
                  <span className="font-mono font-bold text-primary">{bt.type}</span>
                  <span className="text-muted-foreground">
                    {t("nusuk.typeChip", { total: numL10n(bt.total, locale), active: numL10n(bt.active, locale) })}
                  </span>
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground lg:ms-auto shrink-0 flex items-center gap-1.5">
              <Icon name="timer" className="h-3.5 w-3.5 text-gold-deep" />
              {t("nusuk.avgLine", { dur: durL10n(metrics.avgDurationMs, locale, t), n: numL10n(metrics.syncsLast7d, locale) })}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= DATA & LAYANAN RESMI (Task 23 — riset nusuk.sa & haj.gov.sa) ================= */

/** Statistik resmi terkini (rilis Kementerian Hajj & Umrah KSA · GASTAT · SPA). */
const OFFICIAL_STATS: { icon: string; value: number; suffix?: string; labelKey: string }[] = [
  { icon: "smartphone", value: 40_000_000, suffix: "+", labelKey: "nusuk.offStatUsers" },
  { icon: "globe", value: 12_400_000, labelKey: "nusuk.offStatVisas" },
  { icon: "moon-star", value: 1_673_230, labelKey: "nusuk.offStatHajj" },
  { icon: "users", value: 18_500_000, labelKey: "nusuk.offStatSeason" },
];

/** Enam pilar layanan resmi di nusuk.sa (visa/ Masar, izin umrah, Rawdah, paket, mashaer, edukasi). */
const OFFICIAL_SERVICES: { icon: string; titleKey: string; descKey: string }[] = [
  { icon: "passport", titleKey: "nusuk.svc1Title", descKey: "nusuk.svc1Desc" },
  { icon: "clipboard-list", titleKey: "nusuk.svc2Title", descKey: "nusuk.svc2Desc" },
  { icon: "moon-star", titleKey: "nusuk.svc3Title", descKey: "nusuk.svc3Desc" },
  { icon: "building-2", titleKey: "nusuk.svc4Title", descKey: "nusuk.svc4Desc" },
  { icon: "bus", titleKey: "nusuk.svc5Title", descKey: "nusuk.svc5Desc" },
  { icon: "book-open", titleKey: "nusuk.svc6Title", descKey: "nusuk.svc6Desc" },
];

/**
 * Task 47 — Layanan elektronik resmi Kementerian Hajj & Umrah, dibaca langsung
 * dari portal haj.gov.sa (e-services). Izin Umrah & Rawdah ditindaklanjuti di
 * aplikasi Nusuk; tautan selalu ke domain resmi agar bebas dead-link.
 */
const MINISTRY_ESERVICES: { icon: string; titleKey: string; descKey: string; href: string }[] = [
  {
    icon: "tent-tree",
    titleKey: "nusuk.esHajjTitle",
    descKey: "nusuk.esHajjDesc",
    href: "https://www.haj.gov.sa/en",
  },
  {
    icon: "moon-star",
    titleKey: "nusuk.esRawdahTitle",
    descKey: "nusuk.esRawdahDesc",
    href: "https://www.nusuk.sa/",
  },
  {
    icon: "clipboard-list",
    titleKey: "nusuk.esUmrahTitle",
    descKey: "nusuk.esUmrahDesc",
    href: "https://www.nusuk.sa/",
  },
];

/**
 * Task 47 — Aturan penting Tamu Allah 2025–2026, dirangkum dari nusuk.sa,
 * haj.gov.sa, dan rilis saluran resmi KSA (Nusuk app, KSA Visa, Visi 2030).
 * Urutan = urutan tampil di grid (nomor 01–08 dirender otomatis).
 */
const OFFICIAL_RULES: { icon: string; titleKey: string; descKey: string }[] = [
  { icon: "badge-check", titleKey: "nusuk.rule1Title", descKey: "nusuk.rule1Desc" },
  { icon: "moon-star", titleKey: "nusuk.rule2Title", descKey: "nusuk.rule2Desc" },
  { icon: "shield-check", titleKey: "nusuk.rule3Title", descKey: "nusuk.rule3Desc" },
  { icon: "passport", titleKey: "nusuk.rule4Title", descKey: "nusuk.rule4Desc" },
  { icon: "clock", titleKey: "nusuk.rule5Title", descKey: "nusuk.rule5Desc" },
  { icon: "building-2", titleKey: "nusuk.rule6Title", descKey: "nusuk.rule6Desc" },
  { icon: "globe", titleKey: "nusuk.rule7Title", descKey: "nusuk.rule7Desc" },
  { icon: "users", titleKey: "nusuk.rule8Title", descKey: "nusuk.rule8Desc" },
];

/** Task 47 — Hotline resmi platform Nusuk (terbaca langsung dari nusuk.sa). */
const NUSUK_HOTLINES: { icon: string; value: string; tel: string; labelKey: string }[] = [
  { icon: "phone", value: "1966", tel: "tel:1966", labelKey: "nusuk.hotlineLocalLabel" },
  { icon: "globe", value: "+966 92 000 2814", tel: "tel:+966920002814", labelKey: "nusuk.hotlineIntlLabel" },
];

/** Task 47 — tanggal verifikasi riset langsung ke dua situs resmi (konten statis → hydration aman). */
const INFO_VERIFIED_ISO = "2026-09-28";

function OfficialSection() {
  const { t, locale } = useT();
  return (
    <section
      className="py-14 sm:py-20 bg-gradient-to-b from-muted/40 to-transparent"
      aria-labelledby="nusuk-official-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusuk.offEyebrow")}
          title={t("nusuk.offTitle")}
          subtitle={t("nusuk.offSubtitle")}
        />

        {/* 4 statistik resmi — kartu forest + CountUp sinematik */}
        <Stagger className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" stagger={0.08}>
          {OFFICIAL_STATS.map((s) => (
            <StaggerItem key={s.labelKey}>
              <div className="h-full relative overflow-hidden rounded-2xl bg-forest-deep p-4 sm:p-5 text-white shadow-lg">
                <div className="absolute inset-0 bg-islamic-pattern-gold opacity-25" aria-hidden />
                <div className="relative">
                  <div className="h-9 w-9 rounded-lg bg-gold/20 border border-gold/40 grid place-items-center text-gold">
                    <Icon name={s.icon} className="h-4.5 w-4.5" />
                  </div>
                  <div className="mt-3 text-lg sm:text-2xl font-extrabold text-gold-gradient tracking-tight leading-none whitespace-nowrap">
                    <CountUp value={s.value} suffix={s.suffix ?? ""} locale={locale} />
                  </div>
                  <div className="mt-1.5 text-[11px] sm:text-xs text-emerald-100/80 font-medium">
                    {t(s.labelKey)}
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal delay={0.1}>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <Icon name="shield-check" className="h-3.5 w-3.5 text-primary shrink-0" />
            {t("nusuk.offStatNote")}
          </p>
        </Reveal>

        {/* 6 pilar layanan resmi Nusuk */}
        <Reveal className="mt-12">
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {t("nusuk.svcTitle")}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {t("nusuk.svcSubtitle")}
          </p>
        </Reveal>
        <Stagger className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" stagger={0.06}>
          {OFFICIAL_SERVICES.map((s) => (
            <StaggerItem key={s.titleKey}>
              <div className="h-full rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold leading-snug text-foreground">{t(s.titleKey)}</h4>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{t(s.descKey)}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Task 47 — Layanan e-Resmi Kementerian Hajj & Umrah (dibaca langsung dari haj.gov.sa) */}
        <Reveal className="mt-12">
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Icon name="landmark" className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            {t("nusuk.esTitle")}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {t("nusuk.esSubtitle")}
          </p>
        </Reveal>
        <div
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
          aria-label={t("nusuk.ariaEservices")}
        >
          {MINISTRY_ESERVICES.map((s, i) => (
            <Reveal key={s.titleKey} delay={0.05 * i}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-gold/50 hover:bg-gold/5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gold/10 border border-gold/30 grid place-items-center text-gold-deep">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold leading-snug text-foreground">{t(s.titleKey)}</h4>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{t(s.descKey)}</p>
                  </div>
                </div>
                <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  {t("nusuk.esBtn")}
                  <Icon
                    name="external-link"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  />
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        {/* Task 47 — Aturan penting Tamu Allah 2025–2026 */}
        <Reveal className="mt-12">
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Icon name="scroll-text" className="h-5 w-5 sm:h-6 sm:w-6 text-gold-deep" />
            {t("nusuk.rulesTitle")}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {t("nusuk.rulesSubtitle")}
          </p>
        </Reveal>
        <div
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          aria-label={t("nusuk.ariaRules")}
        >
          {OFFICIAL_RULES.map((r, i) => (
            <Reveal key={r.titleKey} delay={0.04 * i}>
              <div className="relative h-full rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                <span
                  aria-hidden
                  dir="ltr"
                  className="absolute top-3.5 end-4 text-3xl font-black font-mono text-primary/10 select-none"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
                  <Icon name={r.icon} className="h-5 w-5" />
                </div>
                <h4 className="mt-3 pe-8 font-extrabold text-sm sm:text-base leading-snug text-foreground">
                  {t(r.titleKey)}
                </h4>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(r.descKey)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Kuota Haji Indonesia 1447 H — panel megah */}
        <Reveal className="mt-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-deep via-forest-deep to-forest p-7 sm:p-10 shadow-2xl">
            <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
            <div
              aria-hidden
              className="absolute -top-16 -end-14 h-44 w-44 rounded-full bg-gold/15 blur-3xl animate-float-soft"
            />
            <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{t("nusuk.quotaTitle")}</p>
                <p className="mt-2 text-4xl sm:text-5xl font-black text-gold-gradient leading-none whitespace-nowrap">
                  {formatNumberL10n(221_000, locale)}
                </p>
                <p className="mt-1 text-sm text-emerald-100/80">{t("nusuk.quotaTotalLabel")}</p>
              </div>
              <div aria-hidden className="hidden lg:block h-16 w-px bg-gradient-to-b from-transparent via-gold/50 to-transparent" />
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold-soft">
                    <Icon name="users" className="h-3.5 w-3.5" />
                    {t("nusuk.quotaReguler")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white">
                    <Icon name="badge-check" className="h-3.5 w-3.5 text-gold" />
                    {t("nusuk.quotaKhusus")}
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-emerald-100/70 leading-relaxed">{t("nusuk.quotaNote")}</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Sumber resmi — tautan keluar + catatan DGA & kesehatan */}
        <Reveal className="mt-10">
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Icon name="external-link" className="h-5 w-5 text-primary" />
            {t("nusuk.linksTitle")}
          </h3>
        </Reveal>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label={t("nusuk.ariaOfficialLinks")}>
          <Reveal delay={0.05}>
            <a
              href="https://www.nusuk.sa/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-gold/50 hover:bg-gold/5"
            >
              <div className="h-12 w-12 shrink-0 rounded-xl bg-forest-deep grid place-items-center text-gold shadow-[0_8px_20px_-8px_rgba(11,92,63,0.6)]">
                <Icon name="globe" className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-sm sm:text-base text-foreground" dir="ltr">
                  www.nusuk.sa
                </p>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{t("nusuk.linkNusukDesc")}</p>
              </div>
              <Icon
                name="external-link"
                className="h-4.5 w-4.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              />
            </a>
          </Reveal>
          <Reveal delay={0.1}>
            <a
              href="https://haj.gov.sa/en"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-gold/50 hover:bg-gold/5"
            >
              <div className="h-12 w-12 shrink-0 rounded-xl bg-forest-deep grid place-items-center text-gold shadow-[0_8px_20px_-8px_rgba(11,92,63,0.6)]">
                <Icon name="landmark" className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-sm sm:text-base text-foreground" dir="ltr">
                  haj.gov.sa
                </p>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{t("nusuk.linkHajjDesc")}</p>
              </div>
              <Icon
                name="external-link"
                className="h-4.5 w-4.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              />
            </a>
          </Reveal>
        </div>
        {/* Task 47 — Kontak resmi Nusuk: 2 hotline + kartu aplikasi resmi */}
        <Reveal className="mt-10">
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Icon name="phone" className="h-5 w-5 text-primary" />
            {t("nusuk.contactTitle")}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {t("nusuk.contactSubtitle")}
          </p>
        </Reveal>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label={t("nusuk.ariaContacts")}>
          {NUSUK_HOTLINES.map((h, i) => (
            <Reveal key={h.labelKey} delay={0.05 * i}>
              <a
                href={h.tel}
                className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
              >
                <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary">
                  <Icon name={h.icon} className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t(h.labelKey)}
                  </p>
                  <p className="mt-0.5 text-xl sm:text-2xl font-black tracking-tight text-foreground font-mono" dir="ltr">
                    {h.value}
                  </p>
                </div>
              </a>
            </Reveal>
          ))}
          <Reveal delay={0.1}>
            <a
              href="https://www.nusuk.sa/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full items-start gap-4 rounded-2xl border bg-gradient-to-br from-forest-deep to-forest p-5 shadow-lg transition-all hover:shadow-xl"
            >
              <div className="h-12 w-12 shrink-0 rounded-xl bg-gold/20 border border-gold/40 grid place-items-center text-gold">
                <Icon name="smartphone" className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/70">
                  {t("nusuk.appCardLabel")}
                </p>
                <p className="mt-0.5 font-extrabold text-sm sm:text-base leading-snug text-white">
                  {t("nusuk.appCardTitle")}
                </p>
                <p className="mt-1 text-xs text-emerald-100/80 leading-relaxed">{t("nusuk.appCardDesc")}</p>
              </div>
            </a>
          </Reveal>
        </div>

        {/* Task 47 — catatan verifikasi sumber (tanggal riset langsung) */}
        <Reveal delay={0.08} className="mt-4">
          <p className="flex h-full items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/5 p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <Icon name="sparkles" className="h-4.5 w-4.5 mt-0.5 shrink-0 text-gold-deep" />
            <span>
              {t("nusuk.srcNote", { date: formatDateL10n(INFO_VERIFIED_ISO, locale) })}
            </span>
          </p>
        </Reveal>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Reveal delay={0.12}>
            <p className="flex h-full items-start gap-2.5 rounded-xl border bg-muted/40 p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <Icon name="shield-check" className="h-4.5 w-4.5 mt-0.5 shrink-0 text-primary" />
              <span>{t("nusuk.dgaNote")}</span>
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="flex h-full items-start gap-2.5 rounded-xl border bg-muted/40 p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <Icon name="heart-pulse" className="h-4.5 w-4.5 mt-0.5 shrink-0 text-gold-deep" />
              <span>{t("nusuk.healthNote")}</span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= CEK IZIN (PERMIT CHECKER) ================= */

function InfoRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Icon name={icon} className="h-3.5 w-3.5 text-primary" />
        {label}
      </p>
      <div className="mt-1.5 text-sm font-semibold text-foreground leading-snug break-words">{children}</div>
    </div>
  );
}

function PermitChecker() {
  const { t, locale } = useT();
  const [no, setNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState("");

  const verify = async () => {
    const q = no.trim().toUpperCase();
    if (!q) {
      setResult(null);
      setError(t("nusuk.errEmptyNo"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<VerifyResponse>(`/api/nusuk/verify?no=${encodeURIComponent(q)}`);
      setResult(res);
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const statusCls = result
    ? PERMIT_STATUS_CLS[result.permit.status] || PERMIT_STATUS_CLS.EXPIRED
    : PERMIT_STATUS_CLS.EXPIRED;
  const statusKey = result
    ? STATUS_KEYS[result.permit.status] || "nusuk.statusEXPIRED"
    : "nusuk.statusEXPIRED";

  return (
    <div className="max-w-3xl mx-auto">
      <Reveal>
        <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-gradient-to-r from-primary/5 via-transparent to-gold/5 p-5 sm:p-6">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-gold to-gold-soft grid place-items-center text-forest-deep shadow-md">
                <Icon name="scan" className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight">{t("nusuk.checkerCardTitle")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("nusuk.checkerCardDesc")}</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Icon
                  name="qr-code"
                  className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none"
                />
                <Input
                  value={no}
                  onChange={(e) => setNo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                  placeholder={t("nusuk.checkerPlaceholder")}
                  aria-label={t("nusuk.ariaPermitNo")}
                  className="ps-9 h-11 font-mono uppercase tracking-wider"
                />
              </div>
              <Button
                onClick={verify}
                disabled={loading}
                aria-label={t("nusuk.ariaVerifyNow")}
                className="h-11 px-6 bg-gradient-to-r from-gold to-gold-soft text-forest-deep font-bold hover:brightness-105 shrink-0"
              >
                {loading ? (
                  <Icon name="loader-2" className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Icon name="scan" className="h-4 w-4 me-2" />
                )}
                {t("nusuk.verifyNow")}
              </Button>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground flex items-start gap-1.5">
              <Icon name="info" className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gold-deep" />
              {t("nusuk.checkerHint")}
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2.5"
              >
                <Icon name="alert-triangle" className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">{t("nusuk.verifyFailed")}</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 sm:p-6" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge className={cn("px-3.5 py-1.5 text-xs font-extrabold tracking-wide", statusCls)}>
                    <Icon name="badge-check" className="h-4 w-4 me-1.5" />
                    {t(statusKey)}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Icon name="shield-check" className="h-3.5 w-3.5 text-primary" />
                    {t("nusuk.checkedLine", {
                      env: envLabelOf(result.environment, t),
                      ago: timeAgoL10n(result.checkedAt, t),
                    })}
                  </span>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t("nusuk.permitNoLabel")}
                    </p>
                    <p className="mt-1 font-mono text-xl sm:text-2xl font-bold tracking-tight break-all" dir="ltr">
                      {result.permit.permitNo}
                    </p>
                    <p className="mt-2 text-sm font-bold text-primary">
                      {permitTypeLabel(result.permit.type, t)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("nusuk.onBehalf", { name: result.permit.holderName })}
                    </p>
                  </div>
                  <div className="shrink-0 w-full sm:w-48" aria-hidden="true">
                    <div
                      className="h-14 rounded-md bg-forest-deep/90"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, transparent 0 2px, #d4af37 2px 3px, transparent 3px 6px, #d4af37 6px 9px, transparent 9px 10px, #d4af37 10px 11px, transparent 11px 15px)",
                      }}
                    />
                    <p className="mt-1.5 text-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground" dir="ltr">
                      {result.permit.permitNo}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <InfoRow icon="building-2" label={t("nusuk.labelHolder")}>
                    {result.member.name}
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-normal text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0">
                        {memberTypeLabel(result.member.type, t)}
                      </Badge>
                      {result.member.city} · {t("nusuk.licenseWord")}{" "}
                      <span className="font-mono font-semibold" dir="ltr">
                        {result.member.licenseNo}
                      </span>
                    </span>
                  </InfoRow>
                  <InfoRow icon="calendar" label={t("nusuk.labelValidity")}>
                    {formatDateL10n(result.permit.issuedAt, locale)} → {formatDateL10n(result.permit.expiresAt, locale)}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {t("nusuk.lastSyncShort", { ago: timeAgoL10n(result.permit.lastSync, t) })}
                    </span>
                  </InfoRow>
                  {result.permit.meta && (
                    <div className="sm:col-span-2">
                      <InfoRow icon="clipboard-list" label={t("nusuk.labelPermitNote")}>
                        <span className="font-normal text-foreground/80">{result.permit.meta}</span>
                      </InfoRow>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "fingerprint", title: t("nusuk.trust1Title"), desc: t("nusuk.trust1Desc") },
          { icon: "cable", title: t("nusuk.trust2Title"), desc: t("nusuk.trust2Desc") },
          { icon: "shield-ellipsis", title: t("nusuk.trust3Title"), desc: t("nusuk.trust3Desc") },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border bg-muted/30 p-4 text-center">
            <Icon name={c.icon} className="h-5 w-5 mx-auto text-primary" />
            <p className="mt-2 text-sm font-bold">{c.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </Reveal>
    </div>
  );
}

function PermitCheckerSection() {
  const { t } = useT();
  return (
    <section className="py-14 sm:py-20 bg-mint/30 dark:bg-muted/30" aria-labelledby="nusuk-checker-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusuk.checkerEyebrow")}
          title={t("nusuk.checkerTitle")}
          subtitle={t("nusuk.checkerSubtitle")}
        />
        <div className="mt-10">
          <PermitChecker />
        </div>
      </div>
    </section>
  );
}

/* ================= MATRIKS 13 EKOSISTEM ================= */

function MatrixSection({ ecosystems }: { ecosystems: NusukPublicData["ecosystems"] }) {
  const { t } = useT();
  return (
    <section className="py-14 sm:py-20" aria-labelledby="nusuk-matrix-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusuk.matrixEyebrow")}
          title={t("nusuk.matrixTitle")}
          subtitle={t("nusuk.matrixSubtitle")}
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ecosystems.map((eco, i) => {
            const svc = NUSUK_SERVICES[eco.number];
            return (
              <Reveal key={eco.number} delay={Math.min(i * 0.035, 0.4)}>
                <div className="h-full rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft shadow-sm">
                      <Icon name={eco.icon} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold text-muted-foreground truncate">
                          #{String(eco.number).padStart(2, "0")} · {eco.cluster}
                        </p>
                        <LevelChip level={svc?.level ?? "SOON"} />
                      </div>
                      <h3 className="mt-1 font-bold text-sm leading-snug">{eco.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {svc ? t(svc.key) : t("nusuk.matrixPending")}
                      </p>
                      {SYNCED_ECOSYSTEMS.has(eco.number) && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                          <Icon name="check-circle-2" className="h-3 w-3" />
                          {t("nusuk.syncedLive")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ================= API BRIDGE ================= */

function EndpointRow({
  method,
  path,
  copy,
  descKey,
  authKey,
}: {
  method: string;
  path: string;
  copy: string;
  descKey: string;
  authKey: string;
}) {
  const { t } = useT();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 px-4 sm:px-5 py-3.5 transition-colors hover:bg-white/[0.03]">
      <span
        className={cn(
          "inline-flex w-fit shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider",
          method === "GET"
            ? "border-primary/50 bg-primary/20 text-emerald-200"
            : "border-gold/50 bg-gold/15 text-gold"
        )}
      >
        {method}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs sm:text-[13px] font-semibold text-white break-all" dir="ltr">
          {path}
        </p>
        <p className="mt-0.5 text-[11px] sm:text-xs text-emerald-100/70 leading-relaxed">{t(descKey)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 sm:justify-end">
        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-100/70">
          {t(authKey)}
        </span>
        <CopyButton text={copy} label={path} />
      </div>
    </div>
  );
}

function ApiBridgeSection() {
  const { t } = useT();
  const curlExample = t("nusuk.curlExample");
  return (
    <section className="py-14 sm:py-20 bg-mint/30 dark:bg-muted/30" aria-labelledby="nusuk-api-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusuk.apiEyebrow")}
          title={t("nusuk.apiTitle")}
          subtitle={t("nusuk.apiSubtitle")}
        />
        <Reveal className="mt-10">
          <div className="rounded-2xl bg-forest-deep text-emerald-50 shadow-xl border border-white/10 overflow-hidden">
            {/* window bar */}
            <div className="flex items-center gap-2 border-b border-white/10 px-4 sm:px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400/80" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-gold/80" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-primary/90" aria-hidden="true" />
              <span className="ms-3 font-mono text-[11px] text-emerald-100/60 flex items-center gap-1.5 truncate" dir="ltr">
                <Icon name="terminal" className="h-3.5 w-3.5 shrink-0" />
                muhdin.web.id · nusuk-api-v1
              </span>
              <span className="ms-auto hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                ONLINE
              </span>
            </div>

            <div className="divide-y divide-white/5" role="list" aria-label={t("nusuk.ariaEndpointList")}>
              {API_ENDPOINTS.map((ep) => (
                <EndpointRow key={ep.path} {...ep} />
              ))}
            </div>

            <div className="border-t border-white/10 px-4 sm:px-5 py-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] text-emerald-100/60 flex items-center gap-1.5">
                  <Icon name="braces" className="h-3.5 w-3.5 shrink-0" />
                  {t("nusuk.curlLabel")}
                </p>
                <CopyButton text={curlExample} label={t("nusuk.curlLabel")} />
              </div>
              <pre
                aria-label={t("nusuk.ariaCurlExample")}
                dir="ltr"
                className="overflow-x-auto scrollbar-thin rounded-xl bg-black/40 border border-white/10 p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-emerald-100/90 text-left"
              >
                <code>{curlExample}</code>
              </pre>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= WEBHOOK FEED ================= */

function SyncFeedSection({ logs }: { logs: NusukSyncLog[] }) {
  const { t, locale } = useT();
  return (
    <section className="py-14 sm:py-20" aria-labelledby="nusuk-feed-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusuk.feedEyebrow")}
          title={t("nusuk.feedTitle")}
          subtitle={t("nusuk.feedSubtitle")}
        />
        <div className="mt-10 max-w-3xl mx-auto">
          {logs.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center">
              <Icon aria-hidden name="radar" className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="mt-3 text-sm text-muted-foreground">{t("nusuk.feedEmpty")}</p>
            </div>
          ) : (
            <ol className="relative ms-2 border-s-2 border-primary/20 space-y-4">
              {logs.slice(0, 6).map((log, i) => {
                const ok = log.status === "SUCCESS";
                return (
                  <li key={log.id} className="relative ps-6 sm:ps-8">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -start-[9px] top-4 h-4 w-4 rounded-full border-[3px] border-background",
                        ok ? "bg-primary" : "bg-destructive"
                      )}
                    />
                    <Reveal delay={Math.min(i * 0.05, 0.3)}>
                      <div className="rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex flex-wrap items-center gap-2">
                          <LogTypeChip type={log.type} />
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold",
                              ok
                                ? "border-primary/30 bg-primary/5 text-primary"
                                : "border-destructive/30 bg-destructive/5 text-destructive"
                            )}
                          >
                            <Icon name={ok ? "check-circle-2" : "alert-triangle"} className="h-3 w-3 me-1" />
                            {ok ? t("nusuk.logSUCCESS") : t("nusuk.logFAILED")}
                          </Badge>
                          <span className="ms-auto text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Icon name="timer" className="h-3 w-3 shrink-0" />
                            {durL10n(log.durationMs, locale, t)} · {timeAgoL10n(log.createdAt, t)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/85">{log.message}</p>
                        {log.recordsAffected > 0 && (
                          <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                            <Icon name="database-zap" className="h-3.5 w-3.5 text-gold-deep" />
                            {t("nusuk.recordsAffected", { n: numL10n(log.recordsAffected, locale) })}
                          </p>
                        )}
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

/* ================= ANGGOTA PALING PATUH ================= */

function TopMembersSection({ members }: { members: NusukPublicData["topMembers"] }) {
  const { t, locale } = useT();
  return (
    <section className="py-14 sm:py-20 bg-mint/30 dark:bg-muted/30" aria-labelledby="nusuk-members-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusuk.topEyebrow")}
          title={t("nusuk.topTitle")}
          subtitle={t("nusuk.topSubtitle")}
        />
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {members.map((m, i) => (
            <Reveal key={m.id} delay={Math.min(i * 0.05, 0.3)} className="min-w-0">
              <div className="min-w-0 flex items-center gap-3 sm:gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
                <span
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full grid place-items-center font-extrabold text-sm shadow-sm",
                    i === 0
                      ? "bg-gradient-to-br from-gold to-gold-soft text-forest-deep"
                      : "bg-forest-deep text-gold-soft"
                  )}
                  aria-label={t("nusuk.ariaRank", { n: i + 1 })}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm truncate">{m.name}</p>
                    <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 shrink-0">
                      {memberTypeLabel(m.type, t)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                    <Icon name="map-pin" className="h-3 w-3 shrink-0" />
                    {m.city}
                  </p>
                  <div
                    className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-valuenow={m.compliance}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t("nusuk.ariaCompliance", { name: m.name })}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-forest"
                      style={{ width: `${Math.min(100, Math.max(2, m.compliance))}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-lg font-extrabold leading-none">{numL10n(m.activePermits, locale)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t("nusuk.activePermitsShort")}</p>
                  <p className="mt-1 text-[10px] font-bold text-primary">
                    {t("nusuk.pctCompliant", { n: rateL10n(m.compliance, locale) })}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= CTA ================= */

function CtaSection() {
  const { t } = useT();
  return (
    <section className="py-14 sm:py-20" aria-labelledby="nusuk-cta-title">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-deep via-forest-deep to-forest p-10 sm:p-14 text-center shadow-2xl">
            <div className="absolute inset-0 bg-islamic-pattern-gold opacity-50" />
            <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl animate-float-soft" />
            <div className="relative">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gold/20 border border-gold/40 grid place-items-center text-gold">
                <Icon name="radio-tower" className="h-7 w-7" />
              </div>
              <h2 id="nusuk-cta-title" className="mt-5 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {t("nusuk.ctaTitle1")} <span className="text-gold-gradient">{t("nusuk.ctaTitle2")}</span>
              </h2>
              <p className="mt-4 text-emerald-50/85 max-w-2xl mx-auto leading-relaxed">{t("nusuk.ctaDesc")}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("gabung")}
                  aria-label={t("nusuk.ariaJoin")}
                  className="bg-gradient-to-r from-gold to-gold-soft text-forest-deep font-bold h-12 px-8 hover:brightness-105"
                >
                  <Icon name="handshake" className="h-5 w-5 me-2" />
                  {t("nusuk.ctaJoin")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("kontak")}
                  aria-label={t("nusuk.ariaContactTeam")}
                  className="border-white/30 text-white hover:bg-white/10 h-12 px-8"
                >
                  <Icon name="send" className="h-5 w-5 me-2" />
                  {t("nusuk.ctaContact")}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= LOADING & ERROR ================= */

function LoadingSkeleton() {
  const { t } = useT();
  return (
    <div
      className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20 space-y-8"
      aria-busy="true"
      aria-label={t("nusuk.ariaLoading")}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-4 w-64 mx-auto" />
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useT();
  return (
    <section className="py-14 sm:py-20" aria-label={t("nusuk.ariaError")}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
          <Icon name="alert-triangle" className="h-10 w-10 mx-auto text-destructive" />
          <h2 className="mt-3 text-lg font-extrabold text-destructive">{t("nusuk.errorTitle")}</h2>
          <p className="mt-1.5 text-sm text-destructive">{message}</p>
          <Button
            variant="outline"
            onClick={onRetry}
            aria-label={t("nusuk.ariaRetry")}
            className="mt-5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
          >
            <Icon name="refresh" className="h-4 w-4 me-2" />
            {t("nusuk.retry")}
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ================= MAIN ================= */

export function NusukView() {
  const { locale } = useT();
  const [data, setData] = useState<NusukPublicData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<NusukPublicData>(`/api/nusuk/public?locale=${locale}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, locale]);

  const retry = () => {
    setError("");
    setLoading(true);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="flex flex-col">
      <Hero data={data} />

      {/* Audit 2026 — Kajian Strategis: integrasi resmi, bukan penggantian otoritas */}
      <NusukPositioningSection />

      {error ? (
        <>
          <ErrorState message={error} onRetry={retry} />
          {/* Checker tetap dapat dipakai karena endpoint-nya independen */}
          <PermitCheckerSection />
          <CtaSection />
        </>
      ) : !data ? (
        <LoadingSkeleton />
      ) : (
        <>
          <MetricsSection metrics={data.metrics} totalSyncs={data.connection.totalSyncs} />
          <OfficialSection />
          <PermitCheckerSection />
          <MatrixSection ecosystems={data.ecosystems} />
          <ApiBridgeSection />
          <SyncFeedSection logs={data.recentLogs} />
          <TopMembersSection members={data.topMembers} />
          <CtaSection />
        </>
      )}
    </div>
  );
}

export default NusukView;
