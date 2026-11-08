"use client";

/**
 * PassportVerifyView (v5 Fase 3) — halaman verifikasi publik paspor.
 * Target pendaratan pemindaian QR: #/verifikasi-paspor/PH-XXX-TTTT-0000.
 *
 * Auto-verifikasi saat kode ada di hash route; hasil dengan semantik warna:
 * hijau (valid), amber (kedaluwarsa), merah (dicabut/hilang/tak ditemukan).
 * Setiap verifikasi non-silent dihitung server-side (deteksi anomali).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { navigate } from "@/hooks/use-hash-route";
import { useT, formatDateL10n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { apiSend } from "@/lib/client-api";
import { DetailHero } from "@/components/views/detail-shell";
import type { VerifyData } from "@/components/views/paspor-view";

type Phase = "idle" | "busy" | "done";

export function PassportVerifyView({ code }: { code?: string }) {
  const { t, locale } = useT();
  const [input, setInput] = useState(code ? decodeURIComponent(code) : "");
  const [phase, setPhase] = useState<Phase>(code ? "busy" : "idle");
  const [result, setResult] = useState<VerifyData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const verify = useCallback(
    async (raw: string) => {
      const target = raw.trim().toUpperCase();
      if (!target) return;
      setPhase("busy");
      try {
        const data = await apiSend<VerifyData>("/api/passport/verify", "POST", { code: target });
        setResult(data);
        setPhase("done");
      } catch {
        setResult({ found: false, error: true });
        setPhase("done");
      }
    },
    []
  );

  // Auto-verifikasi bila dibuka dari pemindaian QR (#/verifikasi-paspor/<kode>).
  // Deferred (setTimeout) agar setState tidak sinkron di body effect (react-hooks).
  useEffect(() => {
    if (!code) return;
    const id = setTimeout(() => void verify(decodeURIComponent(code)), 0);
    return () => clearTimeout(id);
  }, [code, verify]);

  const p = result?.found ? result.passport : undefined;
  const reason = result?.reason || "";

  const OUTCOME = {
    valid: { tone: "ok", icon: "badge-check", title: t("paspor.verify.validTitle"), desc: t("paspor.verify.validDesc") },
    EXPIRED: { tone: "warn", icon: "clock-alert", title: t("paspor.verify.expiredTitle"), desc: t("paspor.verify.expiredDesc") },
    REVOKED: { tone: "bad", icon: "shield-ban", title: t("paspor.verify.revokedTitle"), desc: t("paspor.verify.revokedDesc") },
    LOST: { tone: "bad", icon: "shield-alert", title: t("paspor.verify.lostTitle"), desc: t("paspor.verify.lostDesc") },
    notFound: { tone: "bad", icon: "search-x", title: t("paspor.verify.notFoundTitle"), desc: t("paspor.verify.notFoundDesc") },
    err: { tone: "warn", icon: "wifi-off", title: t("paspor.verify.errTitle"), desc: t("paspor.verify.errDesc") },
    throttle: { tone: "warn", icon: "gauge", title: t("paspor.verify.throttledTitle"), desc: t("paspor.verify.throttledDesc") },
  } as const;

  const outcome = result
    ? result.throttled
      ? OUTCOME.throttle
      : result.error
        ? OUTCOME.err
        : !result.found
          ? OUTCOME.notFound
          : result.valid
            ? OUTCOME.valid
            : reason === "EXPIRED"
              ? OUTCOME.EXPIRED
              : reason === "LOST"
                ? OUTCOME.LOST
                : OUTCOME.REVOKED
    : null;

  const toneRing = outcome
    ? outcome.tone === "ok"
      ? "border-emerald-500/50 bg-emerald-500/10"
      : outcome.tone === "warn"
        ? "border-amber-500/50 bg-amber-500/10"
        : "border-red-500/50 bg-red-500/10"
    : "";
  const toneText = outcome
    ? outcome.tone === "ok"
      ? "text-emerald-700 dark:text-emerald-300"
      : outcome.tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : "text-red-700 dark:text-red-300"
    : "";

  return (
    <>
      <DetailHero
        eyebrow={t("paspor.verify.eyebrow")}
        title={t("paspor.verify.title")}
        subtitle={t("paspor.verify.subtitle")}
        backTo="/paspor"
        backLabel={t("paspor.hero.title")}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold text-gold ring-1 ring-gold/40">
            <Icon name="shield-check" className="h-3.5 w-3.5" aria-hidden />
            {t("paspor.hero.badge")}
          </span>
        }
      />

      <section className="py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Form */}
          <Reveal>
            <form
              className="rounded-3xl border bg-card p-6 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                void verify(input);
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="vp-code">{t("paspor.verify.inputLabel")}</Label>
                <Input
                  id="vp-code"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  placeholder={t("paspor.verify.placeholder")}
                  dir="ltr"
                  className="h-11 font-mono tracking-widest"
                  autoComplete="off"
                  inputMode="text"
                />
              </div>
              <Button
                type="submit"
                disabled={phase === "busy" || !input.trim()}
                className="mt-4 h-11 w-full bg-primary hover:bg-forest"
              >
                {phase === "busy" ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t("paspor.verify.scanning")}
                  </span>
                ) : (
                  <>
                    <Icon name="scan-line" className="h-4 w-4" aria-hidden />
                    {t("paspor.verify.btn")}
                  </>
                )}
              </Button>
            </form>
          </Reveal>

          {/* Hasil */}
          {outcome && phase === "done" && (
            <Reveal>
              <div className={cn("mt-6 rounded-3xl border p-6 shadow-sm", toneRing)} role="status" aria-live="polite">
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1",
                      toneText,
                      outcome.tone === "ok" ? "ring-emerald-500/40" : outcome.tone === "warn" ? "ring-amber-500/40" : "ring-red-500/40"
                    )}
                  >
                    <Icon name={outcome.icon} className="h-7 w-7" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className={cn("text-lg font-extrabold tracking-wide", toneText)}>{outcome.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{outcome.desc}</p>
                  </div>
                </div>

                {p && (
                  <dl className="mt-5 grid gap-x-4 gap-y-3 rounded-2xl bg-background/60 p-4 text-sm sm:grid-cols-2">
                    {[
                      { l: t("paspor.demo.holder"), v: p.holderName },
                      { l: t("paspor.demo.no"), v: p.passportNo, mono: true },
                      { l: t("paspor.demo.type"), v: p.type === "HAJI" ? t("paspor.demo.typeHaji") : t("paspor.demo.typeUmrah") },
                      { l: t("paspor.demo.rombongan"), v: p.rombongan || "—" },
                      { l: t("paspor.demo.org"), v: p.org?.name || "MUHDIN" },
                      { l: t("paspor.demo.expires"), v: formatDateL10n(p.expiresAt, locale) },
                    ].map((f, i) => (
                      <div key={i} className="min-w-0">
                        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.l}</dt>
                        <dd className={cn("mt-0.5 truncate font-semibold", f.mono && "font-mono tracking-wider text-primary")} dir={f.mono ? "ltr" : undefined}>
                          {f.v}
                        </dd>
                      </div>
                    ))}
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("paspor.verify.countLabel")}</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums">{p.verificationCount}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("paspor.verify.lastLabel")}</dt>
                      <dd className="mt-0.5 font-semibold">
                        {p.lastVerifiedAt ? formatDateL10n(p.lastVerifiedAt, locale) : t("paspor.verify.never")}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </Reveal>
          )}

          {/* Tautan bawah */}
          <Reveal>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setPhase("idle");
                  setInput("");
                  setTimeout(() => inputRef.current?.focus(), 60);
                }}
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <Icon name="rotate-ccw" className="h-4 w-4" aria-hidden />
                {t("paspor.verify.again")}
              </button>
              <button
                type="button"
                onClick={() => navigate("paspor")}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
              >
                {t("paspor.hero.title")}
                <Icon name="arrow-right" className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </button>
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">{t("paspor.verify.disclaimer")}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
