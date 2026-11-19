"use client";

/**
 * Task 41 (v15.2.0) — Ekosistem Global: #/ekosistem-global
 * MUHDIN GLOBAL ECOSYSTEM — orchestrator, MHUTU OS, 6 Business Engines
 * (AROFAHAJJ = Supply Engine spotlight), peta entitas, alur transaksi,
 * tier vendor, scorecard, hub procurement (peta jalan) & tata kelola.
 * Seluruh teks via kamus ecoGlobal (id/en/ar). Data statis — bukan klaim
 * izin/afiliasi (lihat governanceNote).
 */
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { navigate } from "@/hooks/use-hash-route";
import { cn } from "@/lib/utils";

const ENGINES: { key: string; icon: string; spotlight?: boolean }[] = [
  { key: "trust", icon: "shield-check" },
  { key: "supply", icon: "shopping-bag", spotlight: true },
  { key: "legal", icon: "scale" },
  { key: "advisory", icon: "briefcase" },
  { key: "certification", icon: "award" },
  { key: "protection", icon: "heart-pulse" },
];

const OS_MODULES: { key: string; icon: string }[] = [
  { key: "identity", icon: "fingerprint" },
  { key: "organization", icon: "building-2" },
  { key: "verification", icon: "badge-check" },
  { key: "journey", icon: "route" },
  { key: "documents", icon: "file-text" },
  { key: "control", icon: "gauge" },
];

const ENTITIES: { key: string; icon: string }[] = [
  { key: "muhdin", icon: "shield-check" },
  { key: "arofah", icon: "shopping-bag" },
  { key: "perizinan", icon: "scale" },
  { key: "gconsultant", icon: "briefcase" },
  { key: "sertifikasi", icon: "award" },
];

const FLOW: { key: string; icon: string }[] = [
  { key: "s1", icon: "plane-takeoff" },
  { key: "s2", icon: "shield-check" },
  { key: "s3", icon: "shopping-bag" },
  { key: "s4", icon: "handshake" },
  { key: "s5", icon: "clipboard-check" },
  { key: "s6", icon: "gauge" },
];

const SCORECARD: { key: string }[] = [
  { key: "legal" },
  { key: "quality" },
  { key: "price" },
  { key: "capacity" },
  { key: "refund" },
  { key: "admin" },
  { key: "data" },
];

const HUB_MODULES: { key: string; icon: string }[] = [
  { key: "directory", icon: "book-open" },
  { key: "verification", icon: "badge-check" },
  { key: "rfq", icon: "mail" },
  { key: "quotation", icon: "calculator" },
  { key: "po", icon: "file-check" },
  { key: "fulfillment", icon: "package-check" },
  { key: "finance", icon: "wallet" },
  { key: "performance", icon: "trending-up" },
];

export function EcoGlobalView() {
  const { t } = useT();
  const eg = (k: string) => t(`ecoGlobal.${k}`);

  return (
    <div className="bg-background">
      {/* ============ HERO — MUHDIN orchestrator + MHUTU OS ============ */}
      <section aria-labelledby="eco-global-hero" className="relative overflow-hidden bg-gradient-to-br from-forest-deep via-forest-deep to-forest py-14 text-center sm:py-20">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <Badge className="border border-gold/40 bg-gold/15 px-4 py-1.5 text-[10px] font-bold tracking-[0.25em] text-gold-soft sm:text-xs">
              {eg("eyebrow")}
            </Badge>
            <h1 id="eco-global-hero" className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
              {eg("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-emerald-100/85 sm:text-base">
              {eg("subtitle")}
            </p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
              {eg("lastUpdate")}
            </p>
          </Reveal>

          {/* Orchestrator */}
          <Reveal delay={0.1}>
            <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-gold/50 bg-gold/10 p-6 shadow-[0_0_55px_-12px_rgba(212,175,55,0.5)]">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">{eg("orchestratorBadge")}</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{eg("orchestratorTitle")}</h2>
              <p className="mt-2 text-xs text-emerald-100/85 sm:text-sm">{eg("orchestratorDesc")}</p>
            </div>
          </Reveal>

          {/* MHUTU OS */}
          <Reveal delay={0.15}>
            <div className="mx-auto mt-5 max-w-4xl rounded-3xl border border-white/15 bg-white/5 p-6 text-start">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100/70">{eg("osBadge")}</p>
                  <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">{eg("osTitle")}</h2>
                </div>
                <p className="max-w-xs text-xs text-emerald-100/75">{eg("osDesc")}</p>
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{eg("osModulesTitle")}</p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {OS_MODULES.map(({ key, icon }) => (
                  <div key={key} className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-forest-deep/40 p-3">
                    <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" strokeWidth={1.8} />
                    <p className="text-xs leading-relaxed text-emerald-100/85">{eg(`osModules.${key}`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 6 BUSINESS ENGINES ============ */}
      <section className="py-14 sm:py-20" aria-labelledby="eco-engines-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={eg("eyebrow")}
            title={eg("enginesTitle")}
            subtitle={eg("enginesDesc")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENGINES.map(({ key, icon, spotlight }, i) => (
              <Reveal key={key} delay={Math.min(i * 0.05, 0.3)}>
                <div
                  className={cn(
                    "h-full rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1",
                    spotlight
                      ? "border-gold/60 bg-gold/10 shadow-[0_0_40px_-14px_rgba(212,175,55,0.6)]"
                      : "bg-card hover:border-primary/40 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl",
                        spotlight ? "bg-gold/20 text-gold" : "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon name={icon} className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3 className="text-sm font-black leading-tight">{eg(`engines.${key}.name`)}</h3>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {eg(`engines.${key}.owner`)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{eg(`engines.${key}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AROFAHAJJ SPOTLIGHT ============ */}
      <section className="border-y bg-muted/30 py-14 sm:py-20" aria-labelledby="eco-arofah-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="rounded-3xl border border-gold/50 bg-card p-6 shadow-lg sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">{eg("arofahBadge")}</p>
              <h2 id="eco-arofah-title" className="mt-2 text-2xl font-black sm:text-4xl">
                {eg("arofahTitle")}
              </h2>
              <p className="mt-1 text-sm font-bold text-primary">{eg("arofahSub")}</p>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">{eg("arofahDesc")}</p>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {eg("arofahPillarsTitle")}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(["ticketing", "visa", "vendor", "partner"] as const).map((k) => (
                  <div key={k} className="rounded-2xl border bg-background p-4">
                    <p className="text-xs font-extrabold leading-snug">{eg(`arofahPillars.${k}`)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                  <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
                  {eg("arofahStatus")}
                </p>
                <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                  <Icon name="shield-alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  {eg("arofahBoundary")}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="https://arofahajj.com" target="_blank" rel="noopener noreferrer">
                  <button
                    type="button"
                    onClick={() => window.open("https://arofahajj.com", "_blank", "noopener")}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow transition hover:opacity-90"
                  >
                    <Icon name="external-link" className="h-4 w-4" />
                    {eg("ctaArofah")}
                  </button>
                </a>
                <a href="https://sertifikasi.arofahajj.com" target="_blank" rel="noopener noreferrer">
                  <button
                    type="button"
                    onClick={() => window.open("https://sertifikasi.arofahajj.com", "_blank", "noopener")}
                    className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-5 py-2.5 text-xs font-bold text-gold shadow transition hover:bg-gold/20"
                  >
                    <Icon name="award" className="h-4 w-4" />
                    {eg("ctaCert")}
                  </button>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ ENTITIES TABLE ============ */}
      <section className="py-14 sm:py-20" aria-labelledby="eco-entities-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow={eg("eyebrow")} title={eg("entitiesTitle")} subtitle={eg("entitiesDesc")} />
          <div className="mt-10 overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-muted/60 text-start">
                  <th className="px-4 py-3 text-start font-bold">{eg("entitiesTitle")}</th>
                  <th className="px-4 py-3 text-start font-bold">{eg("orchestratorBadge")}</th>
                </tr>
              </thead>
              <tbody>
                {ENTITIES.map(({ key, icon }, i) => (
                  <tr key={key} className={cn("border-t", i % 2 ? "bg-muted/20" : "")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Icon name={icon} className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                        <div>
                          <p className="font-extrabold leading-tight">{eg(`entities.${key}.name`)}</p>
                          <p className="text-[11px] font-semibold text-primary">{eg(`entities.${key}.role`)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">{eg(`entities.${key}.resp`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {eg("entitiesNote")}
          </p>
        </div>
      </section>

      {/* ============ SUPPLY FLOW ============ */}
      <section className="border-y bg-muted/30 py-14 sm:py-20" aria-labelledby="eco-flow-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={eg("eyebrow")} title={eg("flowTitle")} subtitle={eg("flowDesc")} />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FLOW.map(({ key, icon }, i) => (
              <Reveal key={key} delay={Math.min(i * 0.05, 0.3)}>
                <div className="relative h-full rounded-2xl border bg-card p-5 shadow-sm">
                  <span className="absolute end-4 top-4 text-3xl font-black text-muted-foreground/15">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon name={icon} className="h-6 w-6 text-primary" strokeWidth={1.8} />
                  <h3 className="mt-3 text-sm font-black">{eg(`flow.${key}.title`)}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{eg(`flow.${key}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TIERS + SCORECARD ============ */}
      <section className="py-14 sm:py-20" aria-labelledby="eco-tier-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow={eg("eyebrow")} title={eg("tiersTitle")} />
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {(["t1", "t2", "t3"] as const).map((k, i) => (
              <Reveal key={k} delay={i * 0.05}>
                <div className="h-full rounded-2xl border bg-card p-5">
                  <h3 className="text-sm font-black">{eg(`tiers.${k}.name`)}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{eg(`tiers.${k}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border bg-card p-6">
                <h3 className="text-base font-black">{eg("scorecardTitle")}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{eg("scorecardDesc")}</p>
                <ul className="mt-4 space-y-2">
                  {SCORECARD.map(({ key }) => (
                    <li key={key} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Icon name="check-circle-2" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {eg(`scorecard.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-2xl border bg-card p-6">
                <h3 className="text-base font-black">{eg("scorecardCatsTitle")}</h3>
                <div className="mt-4 space-y-2">
                  {(["platinum", "gold", "silver", "restricted", "suspended"] as const).map((k) => (
                    <p key={k} className="rounded-lg border bg-muted/30 px-3 py-2 text-xs font-semibold">
                      {eg(`scorecardCats.${k}`)}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ MHUTU PROCUREMENT HUB (roadmap) ============ */}
      <section className="border-y bg-muted/30 py-14 sm:py-20" aria-labelledby="eco-hub-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={eg("hubBadge")} title={eg("hubTitle")} subtitle={eg("hubDesc")} />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HUB_MODULES.map(({ key, icon }, i) => (
              <Reveal key={key} delay={Math.min(i * 0.04, 0.3)}>
                <div className="h-full rounded-2xl border bg-card p-4">
                  <Icon name={icon} className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  <p className="mt-2.5 text-xs font-bold leading-snug">{eg(`hubModules.${key}`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GOVERNANCE NOTE ============ */}
      <section className="py-14" aria-labelledby="eco-gov-title">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8">
              <h2 id="eco-gov-title" className="flex items-center gap-2.5 text-base font-black">
                <Icon name="shield-check" className="h-5 w-5 text-primary" />
                {eg("governanceTitle")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{eg("governanceNote")}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
