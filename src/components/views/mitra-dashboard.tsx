"use client";

/**
 * Task 48 — MitraDashboard: portal penyelenggara (#/dashboard/mitra).
 * Login kode tiket (MHD-XXXXXX) — pola sama dengan portal anggota Task 33-c.
 * Data: GET /api/applications/track (status pendaftaran)
 *      + GET /api/nusuk/public (metrik integrasi ekosistem)
 *      + GET /api/members (data direktori bila sudah APPROVED).
 * Tidak ada endpoint sensitif — sama seperti halaman publik.
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, formatDateL10n, formatNumberL10n } from "@/lib/i18n";
import type { NusukPublicData } from "@/lib/types";
import { cn } from "@/lib/utils";

const TICKET_KEY = "muhdin-ticket";

/** Ekosistem dengan izin tersinkron live (konsisten dengan NusukView). */
const SYNCED_ECOSYSTEMS = new Set([1, 2, 3, 5, 6, 7, 9]);

type TrackApp = {
  found: boolean;
  ticketCode: string;
  orgName: string;
  type: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

type MemberLite = {
  name: string;
  type: string;
  city: string;
  province: string;
  rating: number;
  status: string;
  memberSince: number;
};

type Phase = "form" | "loading" | "active" | "notFound" | "error";

function typeLabel(ty: string, t: (k: string) => string): string {
  const key = `track.mt${ty}`;
  const val = t(key);
  return val === key ? ty : val;
}

/* ---------- Ring kepatuhan (SVG) ---------- */
function ComplianceRing({ pct }: { pct: number }) {
  const size = 150;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-gold/15" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-700 motion-reduce:transition-none",
            pct >= 80 ? "stroke-primary" : pct >= 50 ? "stroke-gold" : "stroke-destructive"
          )}
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span className="absolute text-3xl font-black text-foreground" dir="ltr">
        {Math.round(pct)}%
      </span>
    </span>
  );
}

export function MitraDashboard() {
  const { t, locale } = useT();
  const [phase, setPhase] = useState<Phase>("form");
  const [input, setInput] = useState("");
  const [inlineErr, setInlineErr] = useState("");
  const [app, setApp] = useState<TrackApp | null>(null);
  const [nusuk, setNusuk] = useState<NusukPublicData | null>(null);
  const [member, setMember] = useState<MemberLite | null>(null);
  const [copied, setCopied] = useState(false);
  const [stored, setStored] = useState(false);

  const load = useCallback(
    async (raw: string) => {
      const code = raw.replace(/\s+/g, "").toUpperCase();
      if (!code) {
        setPhase("form");
        setInlineErr(t("dash.loginErrEmpty"));
        return;
      }
      setPhase("loading");
      setInlineErr("");
      try {
        const res = await apiGet<TrackApp>(`/api/applications/track?code=${encodeURIComponent(code)}`);
        setApp(res);
        setPhase("active");
        try {
          window.localStorage.setItem(TICKET_KEY, res.ticketCode || code);
          setStored(true);
        } catch {
          /* ignore */
        }
        // Metrik ekosistem + data direktori (paralel, gagal = abaikan).
        apiGet<NusukPublicData>("/api/nusuk/public")
          .then(setNusuk)
          .catch(() => setNusuk(null));
        apiGet<MemberLite[]>("/api/members?status=TERVERIFIKASI")
          .then((list) => setMember(list.find((m) => m.name === res.orgName) ?? null))
          .catch(() => setMember(null));
      } catch (e) {
        const msg = (e as Error).message || "";
        setApp(null);
        try {
          window.localStorage.removeItem(TICKET_KEY);
        } catch {
          /* ignore */
        }
        setStored(false);
        if (/404|tidak ditemukan|not found/i.test(msg)) setPhase("notFound");
        else setPhase("error");
      }
    },
    [t]
  );

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      if (!alive) return;
      let saved = "";
      try {
        saved = window.localStorage.getItem(TICKET_KEY) || "";
      } catch {
        /* ignore */
      }
      if (saved) void load(saved);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [load]);

  const exit = () => {
    try {
      window.localStorage.removeItem(TICKET_KEY);
    } catch {
      /* ignore */
    }
    setStored(false);
    setApp(null);
    setInput("");
    setPhase("form");
  };

  const copyCode = async () => {
    if (!app) return;
    try {
      await navigator.clipboard.writeText(app.ticketCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const num = (n: number) => formatNumberL10n(n, locale);

  /* ---------- LOGIN GATE ---------- */
  if (phase !== "active") {
    return (
      <div className="flex flex-col">
        <section aria-label={t("dash.mEyebrow")} className="relative overflow-hidden bg-forest-deep text-white">
          <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
                <span className="h-px w-6 bg-current opacity-60" aria-hidden />
                {t("dash.mEyebrow")}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("dash.mCardTitle")}</h1>
              <p className="mt-3 max-w-2xl text-emerald-50/80">{t("dash.loginDesc")}</p>
            </Reveal>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Reveal>
              <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-forest text-gold-soft">
                    <Icon name="keyround" className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold">{t("dash.loginTitle")}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t("dash.mCardDesc")}</p>
                  </div>
                </div>
                <form
                  className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void load(input);
                  }}
                  noValidate
                >
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="mitra-ticket">{t("dash.loginLabel")}</Label>
                    <Input
                      id="mitra-ticket"
                      value={input}
                      onChange={(e) => setInput(e.target.value.toUpperCase())}
                      placeholder={t("dash.loginPlaceholder")}
                      aria-label={t("dash.loginLabel")}
                      aria-invalid={!!inlineErr || phase === "notFound"}
                      autoComplete="off"
                      autoCapitalize="characters"
                      className="font-mono tracking-widest"
                      dir="ltr"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-10 bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg"
                  >
                    <Icon name="layout-dashboard" className="me-1.5 h-4 w-4" aria-hidden />
                    {t("dash.loginBtn")}
                  </Button>
                </form>

                {phase === "notFound" ? (
                  <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/10 p-4">
                    <Icon name="search" className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden />
                    <div>
                      <p className="text-sm font-bold text-gold-deep">{t("dash.loginNotFound")}</p>
                      <button
                        type="button"
                        onClick={() => navigate("daftar")}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                      >
                        {t("dash.loginDemo")}
                        <Icon name="arrow-right" className="h-3 w-3 rtl:rotate-180" aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : phase === "error" ? (
                  <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                    <Icon name="alert-triangle" className="h-4 w-4" aria-hidden />
                    {t("dash.loginError")}
                  </p>
                ) : (
                  inlineErr && (
                    <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                      <Icon name="alert-triangle" className="h-4 w-4" aria-hidden />
                      {inlineErr}
                    </p>
                  )
                )}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <Icon name="shield-check" className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {t("dash.loginStored")}
              </p>
            </Reveal>
          </div>
        </section>
      </div>
    );
  }

  /* ---------- DASHBOARD AKTIF ---------- */
  if (!app) return null;
  const isApproved = app.status === "APPROVED";
  const isRejected = app.status === "REJECTED";
  const decided = isApproved || isRejected;
  const statusKey = `nusTrust.dash.status${app.status}`;
  const statusLabel = t(statusKey) === statusKey ? app.status : t(statusKey);
  const success = nusuk?.metrics.successRate ?? 0;
  const syncedCount = nusuk ? nusuk.ecosystems.filter((e) => SYNCED_ECOSYSTEMS.has(e.number)).length : 0;
  const connected = nusuk?.connection.status === "CONNECTED";

  const steps: { key: string; desc: string; state: "done" | "current" | "rejected" | "waiting" }[] = [
    { key: t("nusTrust.dash.step1"), desc: t("nusTrust.dash.step1Desc"), state: "done" },
    { key: t("nusTrust.dash.step2"), desc: t("nusTrust.dash.step2Desc"), state: decided ? "done" : "current" },
    {
      key: t("nusTrust.dash.step3"),
      desc: t("nusTrust.dash.step3Desc"),
      state: isApproved ? "done" : isRejected ? "rejected" : "waiting",
    },
  ];
  const stepCls: Record<string, string> = {
    done: "border-primary/40 bg-card text-primary",
    current: "border-gold bg-card text-gold-deep",
    rejected: "border-destructive/40 bg-card text-destructive",
    waiting: "border-border bg-muted text-muted-foreground",
  };
  const stepIcon: Record<string, string> = { done: "check-circle-2", current: "clock", rejected: "ban", waiting: "circle" };

  return (
    <div className="flex flex-col">
      {/* HERO IDENTITAS */}
      <section aria-label={app.orgName} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div aria-hidden className="absolute -top-20 -end-16 h-56 w-56 rounded-full bg-gold/15 blur-3xl animate-float-soft" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{t("dash.mHeroOrg")}</p>
                <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{app.orgName}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-emerald-100/85">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-bold">
                    <Icon name="handshake" className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {t("dash.mHeroType")}: {typeLabel(app.type, t)}
                  </span>
                  {app.submittedAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-bold">
                      <Icon name="calendar" className="h-3.5 w-3.5 text-gold" aria-hidden />
                      {t("dash.mHeroSince")}: {formatDateL10n(app.submittedAt, locale)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-xl bg-white/15 px-4 py-2 font-mono text-lg font-extrabold tracking-[0.18em]" dir="ltr">
                  {app.ticketCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-white/20"
                >
                  <Icon name={copied ? "check-circle-2" : "clipboard-list"} className="h-3.5 w-3.5" aria-hidden />
                  {copied ? t("dash.copied") : t("dash.copy")}
                </button>
                <Badge variant="outline" className="gap-1.5 border-white/30 bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white">
                  <Icon name={isApproved ? "badge-check" : isRejected ? "ban" : "clock"} className="h-3.5 w-3.5" aria-hidden />
                  {statusLabel}
                </Badge>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
          {/* KPI GRID */}
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
            {[
              { icon: "badge-check", label: t("dash.kpiPermits"), value: nusuk ? num(nusuk.metrics.permitsActive) : "—", tone: "text-primary bg-primary/10" },
              { icon: "refresh", label: t("dash.kpiSyncs"), value: nusuk ? num(nusuk.connection.totalSyncs) : "—", tone: "text-gold-deep bg-gold/15" },
              { icon: "activity", label: t("dash.kpiSuccess"), value: nusuk ? `${success}%` : "—", tone: "text-primary bg-primary/10" },
              member
                ? { icon: "star", label: t("dash.kpiRating"), value: `${member.rating.toFixed(1)} / 5`, tone: "text-gold-deep bg-gold/15" }
                : { icon: "users", label: t("dash.kpiStatus"), value: statusLabel, tone: "text-gold-deep bg-gold/15" },
            ].map((k) => (
              <StaggerItem key={k.label}>
                <div className="h-full rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className={cn("h-10 w-10 rounded-xl grid place-items-center", k.tone)}>
                    <Icon name={k.icon} className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="mt-3 text-2xl font-extrabold tracking-tight" dir="ltr">
                    {k.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{k.label}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          {/* KEPATUHAN + SYNC STATUS */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col items-center gap-5 rounded-3xl border bg-card p-6 shadow-sm sm:flex-row sm:p-7">
                <ComplianceRing pct={success} />
                <div className="min-w-0 text-center sm:text-start">
                  <h2 className="text-lg font-extrabold">{t("dash.complianceTitle")}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t("dash.complianceDesc")}</p>
                  <p
                    className={cn(
                      "mt-3 text-sm font-extrabold",
                      success >= 80 ? "text-primary" : success >= 50 ? "text-gold-deep" : "text-destructive"
                    )}
                  >
                    {success >= 80 ? t("dash.complianceExcel") : success >= 50 ? t("dash.complianceGood") : t("dash.complianceLow")}
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-3xl border bg-card p-6 shadow-sm sm:p-7">
                <h2 className="flex items-center gap-2 text-lg font-extrabold">
                  <Icon name="satellite" className="h-5 w-5 text-primary" aria-hidden />
                  {t("dash.syncTitle")}
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-muted/20 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("dash.syncEnv")}</p>
                    <p className="mt-1 font-mono text-sm font-extrabold" dir="ltr">
                      {nusuk ? nusuk.connection.environment || "—" : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">STATUS</p>
                    <p
                      className={cn(
                        "mt-1 inline-flex items-center gap-1.5 text-sm font-extrabold",
                        connected ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", connected ? "bg-primary" : "bg-muted-foreground/50")} aria-hidden />
                      {nusuk ? (connected ? t("dash.syncConnected") : t("dash.syncDisconnected")) : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border bg-muted/20 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("dash.syncLast")}</p>
                  <p className="mt-1 text-sm font-bold">
                    {nusuk?.connection.lastSyncAt
                      ? formatDateL10n(nusuk.connection.lastSyncAt, locale)
                      : "—"}
                  </p>
                </div>
                {nusuk && (
                  <p className="mt-3 text-[11px] text-muted-foreground">{t("dash.ecoSynced", { n: num(syncedCount) })}</p>
                )}
              </div>
            </Reveal>
          </div>

          {/* EKOSISTEM */}
          {nusuk && (
            <Reveal>
              <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-7">
                <h2 className="flex items-center gap-2 text-lg font-extrabold">
                  <Icon name="grid-3x3" className="h-5 w-5 text-gold-deep" aria-hidden />
                  {t("dash.ecoTitle")}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t("dash.ecoDesc")}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {nusuk.ecosystems.map((e) => {
                    const live = SYNCED_ECOSYSTEMS.has(e.number);
                    return (
                      <div
                        key={e.number}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border p-3",
                          live ? "border-primary/40 bg-primary/5" : "bg-muted/20"
                        )}
                      >
                        <Icon
                          name={e.icon || "grid-3x3"}
                          className={cn("h-4.5 w-4.5 shrink-0", live ? "text-primary" : "text-muted-foreground/50")}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-extrabold leading-tight">{e.name}</p>
                          <p className={cn("text-[9px] font-bold uppercase tracking-wider", live ? "text-primary" : "text-muted-foreground")}>
                            {live ? "LIVE" : "•"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">{t("dash.mMemberNote")}</p>
              </div>
            </Reveal>
          )}

          {/* LINIMASA */}
          <Reveal>
            <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-7">
              <h2 className="text-sm font-extrabold">{t("dash.tlTitle")}</h2>
              <ol className="relative mt-5 grid grid-cols-3 gap-2" aria-label={t("nusTrust.dash.ariaTimeline")}>
                <span aria-hidden className="absolute start-[16.6%] end-[16.6%] top-5 z-0 h-0.5 bg-border" />
                {steps.map((s) => (
                  <li key={s.key} className="relative z-10 flex flex-col items-center text-center">
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-full border-2 transition-colors duration-500 motion-reduce:transition-none",
                        stepCls[s.state]
                      )}
                    >
                      <Icon
                        name={stepIcon[s.state]}
                        className={cn("h-5 w-5", s.state === "current" && "animate-pulse motion-reduce:animate-none")}
                        aria-hidden
                      />
                    </span>
                    <span
                      className={cn(
                        "mt-2 text-xs font-extrabold",
                        s.state === "done" && "text-primary",
                        s.state === "current" && "text-gold-deep",
                        s.state === "rejected" && "text-destructive",
                        s.state === "waiting" && "text-muted-foreground"
                      )}
                    >
                      {s.key}
                    </span>
                    <span className="mt-0.5 hidden text-[11px] leading-snug text-muted-foreground sm:block">{s.desc}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* CATATAN VERIFIKATOR */}
          {app.reviewNote && (
            <Reveal>
              <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4" role="note">
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-gold-deep">
                  <Icon name="info" className="h-4 w-4" aria-hidden />
                  {t("dash.noteTitle")}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{app.reviewNote}</p>
              </div>
            </Reveal>
          )}

          {/* STATUS & CTA */}
          <Reveal>
            <section
              aria-label={t("dash.tlTitle")}
              className={cn(
                "rounded-3xl border p-6 sm:p-7",
                isApproved && "border-primary/30 bg-gradient-to-br from-primary/10 to-forest/10",
                isRejected && "border-destructive/30 bg-destructive/5",
                !decided && "border-gold/40 bg-gold/5"
              )}
            >
              {isApproved ? (
                <div className="text-center">
                  <span className="relative mx-auto grid h-16 w-16 place-items-center" role="img" aria-label={statusLabel}>
                    <span aria-hidden className="absolute inset-0 rounded-full bg-primary/25 animate-ping motion-reduce:animate-none" />
                    <span aria-hidden className="absolute inset-0 rounded-full bg-primary/15" />
                    <span className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-forest text-white shadow-lg">
                      <Icon name="badge-check" className="h-6 w-6" aria-hidden />
                    </span>
                  </span>
                  <h2 className="mt-4 text-xl font-extrabold">{t("dash.stApprovedTitle")}</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/80">{t("dash.stApprovedDesc")}</p>
                  <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button onClick={() => navigate("anggota")} className="bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg">
                      <Icon name="grid-3x3" className="me-1.5 h-4 w-4" aria-hidden />
                      {t("dash.ctaDirectory")}
                    </Button>
                    <Button onClick={() => navigate("anggota/verifikasi")} variant="outline" className="font-bold">
                      <Icon name="shield-check" className="me-1.5 h-4 w-4" aria-hidden />
                      {t("dash.ctaVerify")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="flex items-center gap-2 text-base font-extrabold">
                    <Icon name="target" className={cn("h-5 w-5", isRejected ? "text-destructive" : "text-gold-deep")} aria-hidden />
                    {isRejected ? t("dash.stRejectedTitle") : t("dash.stPendingTitle")}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {isRejected ? t("dash.stRejectedDesc") : t("dash.stPendingDesc")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isRejected && (
                      <Button onClick={() => navigate("daftar")} variant="outline" className="border-destructive/40 font-bold text-destructive hover:bg-destructive/10">
                        <Icon name="rotate" className="me-1.5 h-4 w-4" aria-hidden />
                        {t("dash.ctaReapply")}
                      </Button>
                    )}
                    <Button onClick={() => navigate("tutorial")} variant="outline" className="font-bold">
                      <Icon name="graduation-cap" className="me-1.5 h-4 w-4" aria-hidden />
                      {t("dash.ctaAcademy")}
                    </Button>
                    <Button onClick={() => navigate("kontak")} variant="outline" className="font-bold">
                      <Icon name="message-square" className="me-1.5 h-4 w-4" aria-hidden />
                      {t("dash.ctaSupport")}
                    </Button>
                  </div>
                </>
              )}
            </section>
          </Reveal>

          {/* EXIT */}
          <Reveal delay={0.1}>
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-4 sm:flex-row">
              <p className="text-xs text-muted-foreground">{t("dash.exitDesc")}</p>
              <Button variant="outline" size="sm" onClick={exit} className="shrink-0 font-bold text-destructive hover:bg-destructive/10">
                <Icon name="logout" className="me-1.5 h-4 w-4" aria-hidden />
                {t("dash.exit")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
