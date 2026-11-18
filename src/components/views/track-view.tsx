"use client";

import { useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT, formatDateL10n } from "@/lib/i18n";
import { PushEnableCard } from "@/components/site/push-enable-card"; // R-011 — Web Push
import type { TrackResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type SearchState = "idle" | "loading" | "notFound" | "error";

/** Status badge: kombinasi warna terverifikasi WCAG (pola StatusBadge members-view). */
function StatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const cls: Record<string, string> = {
    APPROVED: "bg-primary/10 text-primary border-primary/30",
    PENDING: "bg-gold/15 text-gold-deep border-gold/40",
    REJECTED: "bg-destructive/10 text-destructive border-destructive/30",
  };
  const code = cls[status] ? status : "PENDING";
  const icon = code === "APPROVED" ? "badge-check" : code === "REJECTED" ? "ban" : "clock";
  return (
    <Badge variant="outline" className={cn("text-[11px] font-bold shrink-0", cls[code])}>
      <Icon name={icon} className="h-3 w-3 me-1" />
      {t(`track.status${code}`)}
    </Badge>
  );
}

function typeLabel(ty: string, t: (k: string) => string): string {
  const key = `track.mt${ty}`;
  const val = t(key);
  return val === key ? ty : val;
}

export function TrackView() {
  const { t, locale } = useT();
  const [code, setCode] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [inlineErr, setInlineErr] = useState("");

  const search = async () => {
    const q = code.replace(/\s+/g, "").toUpperCase();
    if (!q) {
      setInlineErr(t("track.errEmpty"));
      setState("idle");
      setResult(null);
      return;
    }
    setInlineErr("");
    setState("loading");
    setResult(null);
    try {
      const res = await apiGet<TrackResult>(`/api/applications/track?code=${encodeURIComponent(q)}`);
      if (!res?.found) {
        setState("notFound");
      } else {
        setResult(res);
        setState("idle");
      }
    } catch (e) {
      const msg = (e as Error).message || "";
      if (/404|tidak ditemukan|not found/i.test(msg)) setState("notFound");
      else setState("error");
    }
  };

  const decision = result?.status === "APPROVED" || result?.status === "REJECTED";
  const rejected = result?.status === "REJECTED";
  const steps: { key: string; desc: string; state: "done" | "current" | "rejected" | "waiting" }[] = result
    ? [
        { key: "track.step1", desc: t("track.step1Desc"), state: "done" },
        {
          key: "track.step2",
          desc: t("track.step2Desc"),
          state: decision || result.reviewedAt ? "done" : "current",
        },
        {
          key: "track.step3",
          desc: t("track.step3Desc"),
          state: decision ? (rejected ? "rejected" : "done") : result.reviewedAt ? "current" : "waiting",
        },
      ]
    : [];

  const stepCls: Record<string, string> = {
    done: "border-primary/40 bg-card text-primary",
    current: "border-gold bg-card text-gold-deep",
    rejected: "border-destructive/40 bg-card text-destructive",
    waiting: "border-border bg-muted text-muted-foreground",
  };
  const stepIcon: Record<string, string> = {
    done: "check-circle-2",
    current: "clock",
    rejected: "ban",
    waiting: "circle",
  };
  const stepAria: Record<string, string> = {
    done: "track.ariaStepDone",
    current: "track.ariaStepCurrent",
    rejected: "track.ariaStepDone",
    waiting: "track.ariaStepWaiting",
  };

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("track.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("track.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("track.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* FORM PENCARIAN */}
          <Reveal>
            <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-extrabold">{t("track.cardTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("track.cardDesc")}</p>
              <form
                className="mt-5 flex flex-col sm:flex-row gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (state !== "loading") search();
                }}
                noValidate
              >
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="track-code">{t("track.codeLabel")}</Label>
                  <Input
                    id="track-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={t("track.codePlaceholder")}
                    aria-label={t("track.codeAria")}
                    aria-invalid={!!inlineErr}
                    autoComplete="off"
                    autoCapitalize="characters"
                    className="font-mono tracking-widest"
                    dir="ltr"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={state === "loading"}
                  className="h-10 sm:self-end bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg"
                  aria-label={t("track.btnSearchAria")}
                >
                  {state === "loading" ? (
                    <Icon name="loader-2" className="h-4 w-4 me-1.5 animate-spin" />
                  ) : (
                    <Icon name="search" className="h-4 w-4 me-1.5" />
                  )}
                  {t("track.btnSearch")}
                </Button>
              </form>
              {inlineErr && (
                <p role="alert" className="mt-3 text-xs font-semibold text-destructive flex items-center gap-1.5">
                  <Icon name="alert-triangle" className="h-3.5 w-3.5" />
                  {inlineErr}
                </p>
              )}
            </div>
          </Reveal>

          {/* TIDAK DITEMUKAN */}
          {state === "notFound" && (
            <Reveal className="mt-6">
              <div className="rounded-3xl border bg-muted/40 p-8 text-center">
                <Icon name="search" className="h-10 w-10 mx-auto text-muted-foreground/60" />
                <h3 className="mt-3 font-bold">{t("track.notFoundTitle")}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">{t("track.notFoundDesc")}</p>
              </div>
            </Reveal>
          )}

          {/* ERROR */}
          {state === "error" && (
            <Reveal className="mt-6">
              <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <Icon name="alert-triangle" className="h-10 w-10 mx-auto text-destructive/70" />
                <p className="mt-3 text-sm text-destructive font-semibold">{t("track.errGeneric")}</p>
              </div>
            </Reveal>
          )}

          {/* HASIL */}
          {result && (
            <Reveal className="mt-6">
              {/* R-011 — Web Push: nyalakan notifikasi keberangkatan (terikat tiket) */}
              <PushEnableCard cardNo={result.ticketCode} />
              <div className="rounded-3xl border bg-card shadow-sm overflow-hidden" role="status">
                <div className="bg-gradient-to-r from-primary to-forest text-white p-6 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100/80">
                        {t("track.labelOrg")}
                      </p>
                      <h2 className="mt-1 text-2xl font-extrabold leading-tight">{result.orgName}</h2>
                    </div>
                    <span
                      className="rounded-full bg-white/15 px-3 py-1.5 font-mono text-sm font-bold tracking-widest"
                      dir="ltr"
                    >
                      {result.ticketCode}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-6">
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("track.labelType")}
                      </dt>
                      <dd className="mt-1 text-sm font-bold">{typeLabel(result.type, t)}</dd>
                    </div>
                    {/* Task 53 — nomor urut pendaftaran realtime */}
                    {typeof result.queueNumber === "number" && result.queueNumber > 0 && (
                      <div>
                        <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t("liveReg.trackQueueLabel")}
                        </dt>
                        <dd className="mt-1 text-sm font-extrabold tabular-nums text-gold-deep" dir="ltr">
                          #{result.queueNumber}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("track.labelSubmitted")}
                      </dt>
                      <dd className="mt-1 text-sm font-bold">{formatDateL10n(result.submittedAt, locale)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("track.labelStatus")}
                      </dt>
                      <dd className="mt-1">
                        <StatusBadge status={result.status} />
                      </dd>
                    </div>
                  </dl>

                  {/* TIMELINE 3 LANGKAH */}
                  <div>
                    <h3 className="text-sm font-extrabold mb-4">{t("track.timelineTitle")}</h3>
                    <ol className="relative grid grid-cols-3 gap-2" aria-label={t("track.ariaTimeline")}>
                      <span
                        aria-hidden
                        className="absolute top-5 start-[16.6%] end-[16.6%] h-0.5 bg-border z-0"
                      />
                      {steps.map((s) => (
                        <li key={s.key} className="relative z-10 flex flex-col items-center text-center">
                          <span
                            aria-label={t(stepAria[s.state], { step: t(s.key) })}
                            className={cn(
                              "h-10 w-10 rounded-full border-2 grid place-items-center",
                              stepCls[s.state]
                            )}
                          >
                            <Icon
                              name={stepIcon[s.state]}
                              className={cn("h-5 w-5", s.state === "current" && "animate-pulse")}
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
                            {t(s.key)}
                          </span>
                          <span className="mt-0.5 hidden sm:block text-[11px] leading-snug text-muted-foreground">
                            {s.desc}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* CATATAN VERIFIKATOR */}
                  {result.reviewNote && (
                    <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
                      <p className="flex items-center gap-1.5 text-xs font-extrabold text-gold-deep uppercase tracking-wider">
                        <Icon name="info" className="h-4 w-4" />
                        {t("track.reviewNoteLabel")}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{result.reviewNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {/* CTA */}
          <Reveal className="mt-8">
            <div className="rounded-3xl border bg-muted/30 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-extrabold">{t("track.ctaTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("track.ctaDesc")}</p>
              </div>
              <Button
                onClick={() => navigate("gabung")}
                className="shrink-0 bg-gradient-to-r from-primary to-forest text-white shadow-md"
              >
                {t("track.ctaBtn")}
                <Icon name="arrow-right" className="h-4 w-4 ms-1.5 icon-flip" />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
