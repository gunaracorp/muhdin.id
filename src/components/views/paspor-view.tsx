"use client";

/**
 * PasporView (v5 Fase 3) — halaman publik #/paspor.
 *
 * 1. HERO + statistik paspor live dari /api/passport/public
 * 2. DEMO e-paspor interaktif: masukkan nomor → kartu digital ber-QR resmi
 *    (QR di-generate server: /api/passport/<no>/qr → PNG hijau)
 * 3. Cara kerja 3 langkah + keamanan & privasi
 * 4. CTA ke halaman verifikasi & dashboard jamaah
 *
 * Trilingual + RTL-aware; warna hijau-emas klasik konsisten portal.
 */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { navigate } from "@/hooks/use-hash-route";
import { useT, formatDateL10n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { apiGet, apiSend } from "@/lib/client-api";
import { DetailHero, DetailSectionHead } from "@/components/views/detail-shell";

type PublicData = {
  demo: { passportNo: string; type: string } | null;
  stats: { active: number; haji: number; umrah: number; verifications: number };
};

export type VerifyData = {
  found: boolean;
  throttled?: boolean;
  error?: boolean;
  valid?: boolean;
  reason?: string;
  passport?: {
    passportNo: string;
    holderName: string;
    type: string;
    gender: string;
    nationality: string;
    rombongan: string | null;
    status: string;
    issuedAt: string;
    expiresAt: string;
    verificationCount: number;
    lastVerifiedAt: string | null;
    org: { name: string; city: string } | null;
  };
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-gold/20 text-gold ring-gold/50",
  EXPIRED: "bg-amber-500/20 text-amber-300 ring-amber-400/50",
  REVOKED: "bg-red-500/25 text-red-200 ring-red-400/60",
  LOST: "bg-orange-500/20 text-orange-200 ring-orange-400/50",
};

export function PasporView() {
  const { t, locale } = useT();
  const [pub, setPub] = useState<PublicData | null>(null);
  const [code, setCode] = useState("");
  const [card, setCard] = useState<VerifyData | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGet<PublicData>("/api/passport/public")
      .then((d) => {
        if (!alive) return;
        setPub(d);
        if (d.demo) {
          const demoCode = d.demo.passportNo;
          setCode((c) => c || demoCode);
          // Kartu demo tampil otomatis (deferred — setState tidak sinkron di effect).
          setTimeout(() => {
            if (!alive) return;
            setBusy(true);
            apiSend<VerifyData>("/api/passport/verify", "POST", { code: demoCode, silent: true })
              .then((data) => {
                if (alive) setCard(data);
              })
              .catch(() => {
                if (alive) setCard({ found: false, error: true });
              })
              .finally(() => {
                if (alive) setBusy(false);
              });
          }, 0);
        }
      })
      .catch(() => {
        if (alive) setPub({ demo: null, stats: { active: 0, haji: 0, umrah: 0, verifications: 0 } });
      });
    return () => {
      alive = false;
    };
  }, []);

  const load = useCallback(
    async (raw?: string) => {
      const target = (raw ?? code).trim().toUpperCase();
      if (!target || busy) return;
      setBusy(true);
      setCard(null);
      try {
        const data = await apiSend<VerifyData>("/api/passport/verify", "POST", { code: target, silent: true });
        setCard(data);
      } catch {
        setCard({ found: false, error: true });
      } finally {
        setBusy(false);
      }
    },
    [code, busy]
  );

  const stats = pub?.stats;
  const p = card?.found ? card.passport : undefined;
  const statusKey = p ? (`st${p.status.charAt(0)}${p.status.slice(1).toLowerCase()}` as const) : null;

  return (
    <>
      <DetailHero
        eyebrow={t("paspor.hero.eyebrow")}
        title={t("paspor.hero.title")}
        subtitle={t("paspor.hero.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold text-gold ring-1 ring-gold/40">
            <Icon name="scan-line" className="h-3.5 w-3.5" aria-hidden />
            {t("paspor.hero.badge")}
          </span>
        }
      >
        <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { v: stats?.active, l: t("paspor.stats.aActive"), i: "wallet-cards" },
            { v: stats?.haji, l: t("paspor.stats.aHaji"), i: "moon-star" },
            { v: stats?.umrah, l: t("paspor.stats.aUmrah"), i: "building-2" },
            { v: stats?.verifications, l: t("paspor.stats.aVerif"), i: "shield-check" },
          ].map((s, idx) => (
            <div key={idx} className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15 backdrop-blur-sm">
              <Icon name={s.i} className="h-4 w-4 text-gold" aria-hidden />
              <p className="mt-1.5 text-xl font-extrabold tabular-nums">{s.v ?? "—"}</p>
              <p className="text-[11px] font-medium text-emerald-50/75">{s.l}</p>
            </div>
          ))}
        </div>
      </DetailHero>

      {/* ===== DEMO E-PASPOR ===== */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <DetailSectionHead icon="wallet-cards" title={t("paspor.demo.title")} />
            <p className="-mt-2 mb-6 max-w-2xl text-sm text-muted-foreground">{t("paspor.demo.subtitle")}</p>
          </Reveal>

          <Reveal>
            <form
              className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                void load();
              }}
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="paspor-code">{t("paspor.demo.codeLabel")}</Label>
                <Input
                  id="paspor-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t("paspor.demo.placeholder")}
                  dir="ltr"
                  className="font-mono tracking-wider"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={busy || !code.trim()} className="h-10 bg-primary hover:bg-forest">
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t("paspor.demo.loading")}
                  </span>
                ) : (
                  <>
                    <Icon name="scan-line" className="h-4 w-4" aria-hidden />
                    {t("paspor.demo.btnLoad")}
                  </>
                )}
              </Button>
            </form>
          </Reveal>

          {/* Kartu e-paspor */}
          <Reveal>
            {card && !card.found && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300" role="alert">
                <Icon name="triangle-alert" className="h-5 w-5 shrink-0" aria-hidden />
                {card.error ? t("paspor.verify.errDesc") : t("paspor.demo.notFound")}
              </div>
            )}
            {busy && !p && (
              <Skeleton className="h-[340px] w-full max-w-3xl rounded-3xl" aria-label={t("paspor.demo.loading")} />
            )}
            {p && statusKey && (
              <article
                aria-label={t("paspor.demo.cardAria")}
                className={cn(
                  "relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-forest-deep via-primary to-forest text-white shadow-2xl ring-1 ring-gold/40",
                  p.status !== "ACTIVE" && "opacity-95"
                )}
              >
                <div className="absolute inset-0 bg-islamic-pattern-gold opacity-25" aria-hidden />
                <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-gold/15 blur-2xl" aria-hidden />

                <div className="relative p-6 sm:p-8">
                  {/* Header kartu */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-forest-deep shadow-lg">
                        <Icon name="moon-star" className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">MUHDIN</p>
                        <p className="text-sm font-extrabold tracking-wide">
                          {p.type === "HAJI" ? t("paspor.demo.typeHaji") : t("paspor.demo.typeUmrah")}{" "}
                          {t("paspor.hero.title")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
                        STATUS_STYLE[p.status]
                      )}
                    >
                      {t(`paspor.demo.${statusKey}`)}
                    </span>
                  </div>

                  {/* Isi kartu */}
                  <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-widest text-emerald-100/70">{t("paspor.demo.holder")}</p>
                      <p className="truncate text-2xl font-extrabold sm:text-3xl">{p.holderName}</p>

                      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                        {[
                          { l: t("paspor.demo.no"), v: p.passportNo, mono: true },
                          { l: t("paspor.demo.nationality"), v: p.nationality },
                          { l: t("paspor.demo.rombongan"), v: p.rombongan || "—" },
                          { l: t("paspor.demo.org"), v: p.org?.name || "MUHDIN" },
                          { l: t("paspor.demo.issued"), v: formatDateL10n(p.issuedAt, locale) },
                          { l: t("paspor.demo.expires"), v: formatDateL10n(p.expiresAt, locale) },
                        ].map((f, i) => (
                          <div key={i} className="min-w-0">
                            <dt className="text-[10px] uppercase tracking-wider text-emerald-100/60">{f.l}</dt>
                            <dd className={cn("mt-0.5 truncate font-semibold", f.mono && "font-mono tracking-wider text-gold")} dir={f.mono ? "ltr" : undefined}>
                              {f.v}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <div className="mt-5 flex items-center gap-2 text-xs text-emerald-100/80">
                        <Icon name="badge-check" className="h-4 w-4 text-gold" aria-hidden />
                        <span className="tabular-nums">
                          {p.verificationCount} {t("paspor.demo.verifCount")}
                        </span>
                      </div>
                    </div>

                    {/* QR */}
                    <div className="flex flex-row items-center justify-center gap-3 sm:max-w-[168px] sm:flex-col">
                      <div className="rounded-2xl bg-white p-2.5 shadow-lg ring-1 ring-gold/50">
                        <img
                          src={`/api/passport/${encodeURIComponent(p.passportNo)}/qr`}
                          alt={`QR ${p.passportNo}`}
                          width={140}
                          height={140}
                          className="h-[132px] w-[132px]"
                          loading="lazy"
                        />
                      </div>
                      <p className="max-w-[132px] text-center text-[10px] font-medium text-emerald-100/70">
                        {t("paspor.demo.qrCaption")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Strip holografik emas */}
                <div className="relative h-2 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" aria-hidden />
                <div className="relative flex items-center justify-between px-6 py-3 text-[10px] font-semibold tracking-wider text-emerald-100/70 sm:px-8">
                  <span dir="ltr">PH · {new Date(p.issuedAt).getFullYear()} · IDN</span>
                  <span>{t("paspor.hero.badge")}</span>
                </div>
              </article>
            )}
          </Reveal>
        </div>
      </section>

      {/* ===== CARA KERJA ===== */}
      <section className="bg-muted/40 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <DetailSectionHead icon="workflow" title={t("paspor.steps.title")} />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {["s1", "s2", "s3"].map((k, idx) => (
              <Reveal key={k} delay={idx * 90}>
                <div className="h-full rounded-2xl border bg-card p-6 shadow-sm">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gold-deep to-gold text-base font-extrabold text-forest-deep shadow">
                    {idx + 1}
                  </span>
                  <h3 className="mt-4 text-base font-extrabold">{t(`paspor.steps.${k}t`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`paspor.steps.${k}d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEAMANAN ===== */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <DetailSectionHead icon="lock" title={t("paspor.security.title")} />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {["s1", "s2", "s3", "s4"].map((k, idx) => (
              <Reveal key={k} delay={idx * 80}>
                <div className="flex h-full gap-4 rounded-2xl border bg-card p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={["fingerprint", "shield-ban", "user-lock", "history"][idx]} className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold">{t(`paspor.security.${k}t`)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(`paspor.security.${k}d`)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-forest-deep to-primary p-8 text-white sm:p-10">
              <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
              <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div className="max-w-xl">
                  <h2 className="text-xl font-extrabold sm:text-2xl">{t("paspor.cta.title")}</h2>
                  <p className="mt-2 text-sm text-emerald-50/85">{t("paspor.cta.desc")}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate("verifikasi-paspor")} className="bg-gold text-forest-deep hover:bg-gold/90">
                    <Icon name="scan-line" className="h-4 w-4" aria-hidden />
                    {t("paspor.cta.btnVerify")}
                  </Button>
                  <Button variant="outline" onClick={() => navigate("dashboard/jamaah")} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                    <Icon name="layout-dashboard" className="h-4 w-4" aria-hidden />
                    {t("paspor.cta.btnDash")}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
