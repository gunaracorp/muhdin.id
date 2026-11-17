"use client";

/**
 * Audit 2026 — BiayaView: Model Biaya & Keberlanjutan (route #/biaya).
 * Menjawab tuntutan audit #1 (rekalkulasi biaya): koreksi jujur atas klaim
 * "100% gratis", struktur biaya per fase, sumber pembiayaan berkelanjutan,
 * dan komitmen transparansi. Shell p0-shared; RTL-aman & dark-mode-aman.
 */
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { TrustCallout, TrustHero, TrustSection } from "@/components/views/p0-shared";
import { cn } from "@/lib/utils";

const FASE_ROWS = ["fase1", "fase2", "fase3", "fase4", "fase5"] as const;
const OPS_ITEMS: { k: string; icon: string }[] = [
  { k: "ops1", icon: "server" },
  { k: "ops2", icon: "graduation-cap" },
  { k: "ops3", icon: "heart-handshake" },
];
const KOMIT = ["komit1", "komit2", "komit3", "komit4"] as const;

export function BiayaView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("audit13.biaya.hero.eyebrow")}
        title={t("audit13.biaya.hero.title")}
        subtitle={t("audit13.biaya.hero.subtitle")}
      />

      <section aria-label={t("audit13.biaya.hero.title")} className="py-12">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          {/* 1. Koreksi jujur */}
          <TrustCallout tone="amber" icon="alert-triangle" title={t("audit13.biaya.koreksiTitle")}>
            {t("audit13.biaya.koreksiD")}
          </TrustCallout>

          {/* 2. Struktur biaya per fase */}
          <TrustSection icon="banknote" title={t("audit13.biaya.faseTitle")} desc={t("audit13.biaya.faseDesc")}>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.biaya.faseH1")}</th>
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.biaya.faseH2")}</th>
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.biaya.faseH3")}</th>
                  </tr>
                </thead>
                <tbody>
                  {FASE_ROWS.map((k) => (
                    <tr key={k} className="border-b last:border-b-0">
                      <td className="p-3.5 font-bold">{t(`audit13.biaya.${k}a`)}</td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide",
                            t(`audit13.biaya.${k}b`) === "\u2014"
                              ? "bg-muted text-muted-foreground"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          {t(`audit13.biaya.${k}b`)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide",
                            t(`audit13.biaya.${k}c`).startsWith("Rp 0")
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : t(`audit13.biaya.${k}c`) === "\u2014"
                                ? "bg-muted text-muted-foreground"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {t(`audit13.biaya.${k}c`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TrustSection>

          {/* 3. Sumber pembiayaan berkelanjutan */}
          <TrustSection icon="wallet" title={t("audit13.biaya.opsTitle")} desc={t("audit13.biaya.opsDesc")}>
            <div className="grid gap-4 sm:grid-cols-3">
              {OPS_ITEMS.map((o) => (
                <div key={o.k} className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={o.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="text-[15px] font-extrabold leading-snug">{t(`audit13.biaya.${o.k}t`)}</h3>
                  </div>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground/75">
                    {t(`audit13.biaya.${o.k}d`)}
                  </p>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 4. Komitmen transparansi */}
          <TrustSection icon="file-check-2" title={t("audit13.biaya.komitTitle")}>
            <ul className="space-y-2.5">
              {KOMIT.map((k) => (
                <li key={k} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5 text-sm text-foreground/85">
                  <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span className="leading-relaxed">{t(`audit13.biaya.${k}`)}</span>
                </li>
              ))}
            </ul>
          </TrustSection>

          {/* 5. Prinsip */}
          <TrustCallout tone="gold" icon="info" title={t("audit13.biaya.calloutT")}>
            {t("audit13.biaya.calloutD")}
          </TrustCallout>

          {/* 6. CTA ke pembayaran */}
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/15 via-card to-card p-8 text-center">
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">{t("audit13.biaya.ctaT")}</h2>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground">{t("audit13.biaya.ctaD")}</p>
              <Button
                size="lg"
                onClick={() => navigate("pembayaran")}
                className="rounded-full bg-gradient-to-r from-primary to-forest font-extrabold text-white"
              >
                <Icon name="arrow-right" className="me-2 h-5 w-5 icon-flip" aria-hidden />
                {t("audit13.biaya.ctaT")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
