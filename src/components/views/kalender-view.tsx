"use client";

/**
 * R-017 (v14.0) — Kalender Musim Umrah & Haji → Portal #/kalender.
 * Peta permintaan 12 bulan (grid), indikasi harga, catatan & saran per
 * bulan dari lib/season-calendar.ts (tri-bahasa di sumber data), plus CTA
 * ke katalog paket terverifikasi. Data pola musiman — bukan harga final.
 */

import { useT } from "@/lib/i18n";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { SEASON_MONTHS, monthLabel, type DemandLevel, type PriceTier } from "@/lib/season-calendar";
import { cn } from "@/lib/utils";

const DEMAND_STYLE: Record<DemandLevel, string> = {
  RENDAH: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  SEDANG: "bg-primary/10 text-primary border-primary/30",
  TINGGI: "bg-gold/15 text-gold-deep border-gold/40 dark:text-gold",
  PUNCAK: "bg-destructive/10 text-destructive border-destructive/30",
};

const DEMAND_BAR: Record<DemandLevel, string> = {
  RENDAH: "bg-emerald-500",
  SEDANG: "bg-primary",
  TINGGI: "bg-gold",
  PUNCAK: "bg-destructive",
};

const DEMAND_HEIGHT: Record<DemandLevel, string> = {
  RENDAH: "h-1/4",
  SEDANG: "h-1/2",
  TINGGI: "h-3/4",
  PUNCAK: "h-full",
};

const PRICE_STYLE: Record<PriceTier, string> = {
  HEMAT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  BAIK: "bg-primary/10 text-primary",
  NORMAL: "bg-muted text-muted-foreground",
  PREMIUM: "bg-gold/15 text-gold-deep dark:text-gold",
  PUNCAK: "bg-destructive/10 text-destructive",
};

export function KalenderView() {
  const { t, locale } = useT();
  const k = (key: string) => t(`kalender.${key}`);

  const peakMonths = SEASON_MONTHS.filter((m) => m.demand === "PUNCAK").map((m) => monthLabel(m.month, locale));
  const bestMonths = SEASON_MONTHS.filter((m) => m.price === "HEMAT" || m.price === "BAIK").map((m) => monthLabel(m.month, locale));

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {k("eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{k("title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{k("subtitle")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3" data-testid="kalender-stats">
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">{k("statBest")}</p>
                <p className="mt-1 text-sm font-extrabold">{bestMonths.slice(0, 4).join(" · ")}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">{k("statPeak")}</p>
                <p className="mt-1 text-sm font-extrabold">{peakMonths.join(" · ")}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">{k("statNote")}</p>
                <p className="mt-1 text-sm font-extrabold">{SEASON_MONTHS.length} / 12</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Grid 12 bulan */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Bar grafik permintaan */}
          <div className="mb-8 flex items-end gap-1.5 sm:gap-2.5" data-testid="kalender-bars">
            {SEASON_MONTHS.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-24 w-full items-end rounded-t-lg bg-muted/50">
                  <div className={cn("w-full rounded-t-lg", DEMAND_BAR[m.demand], DEMAND_HEIGHT[m.demand])} />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground sm:text-xs">{monthLabel(m.month, locale).slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <span className="font-extrabold uppercase tracking-wide text-muted-foreground">{k("legendDemand")}</span>
            {(Object.keys(DEMAND_STYLE) as DemandLevel[]).map((lvl) => (
              <span key={lvl} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", DEMAND_BAR[lvl])} />
                {k(`demand.${lvl}`)}
              </span>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SEASON_MONTHS.map((m, i) => (
              <Reveal key={m.month} delay={Math.min(i * 0.03, 0.3)}>
                <div className="h-full rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md" data-testid={`kalender-month-${m.month}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-extrabold">{monthLabel(m.month, locale)}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{k(`season.${m.seasonKey}`)}</p>
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase", DEMAND_STYLE[m.demand])}>
                      {k(`demand.${m.demand}`)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{k("priceLabel")}</span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase", PRICE_STYLE[m.price])}>
                      {k(`price.${m.price}`)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-bold text-foreground">{k("noteLabel")}: </span>
                    {m.note[locale as "id" | "en" | "ar"] ?? m.note.id}
                  </p>
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs leading-relaxed text-primary">
                    <Icon name="sparkles" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      <b className="font-bold">{k("tipLabel")}: </b>
                      {m.tip[locale as "id" | "en" | "ar"] ?? m.tip.id}
                    </span>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-8 flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-gold-deep dark:text-gold" data-testid="kalender-disclaimer">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {k("disclaimer")}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-r from-forest to-forest-deep p-8 text-white sm:flex-row sm:items-center">
              <div className="flex-1">
                <h2 className="text-xl font-extrabold">{k("ctaTitle")}</h2>
                <p className="mt-1 text-sm text-emerald-50/80">{k("ctaDesc")}</p>
              </div>
              <Button onClick={() => navigate("paket")} className="h-11 shrink-0 bg-gradient-to-r from-gold to-gold-deep text-white shadow-lg" data-testid="kalender-cta">
                {k("ctaBtn")}
                <Icon name="arrow-right" className="ms-2 h-4 w-4" aria-hidden />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
