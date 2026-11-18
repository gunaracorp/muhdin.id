"use client";

/**
 * Audit 2026 — KeamananView: Keamanan, Audit & Ketahanan Platform (route #/keamanan).
 * Menjawab tuntutan audit: keamanan data (#6) dan program uji penetrasi/audit (#7)
 * plus UAT & akun demo (#9). Status kontrol disajikan jujur (aktif vs terjadwal).
 * Shell p0-shared; RTL-aman & dark-mode-aman.
 */
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { TrustCallout, TrustHero, TrustSection, TrustSteps } from "@/components/views/p0-shared";
import { cn } from "@/lib/utils";

const AKTIF_CONTROLS: { k: string; icon: string }[] = [
  { k: "a1", icon: "webhook" },
  { k: "a2", icon: "gauge" },
  { k: "a3", icon: "fingerprint" },
  { k: "a4", icon: "terminal" },
];

const PLAN_ITEMS: { k: string; icon: string; tone: "success" | "amber" | "info" }[] = [
  { k: "plan1", icon: "cable", tone: "success" },
  { k: "plan2", icon: "database-zap", tone: "amber" },
  { k: "plan3", icon: "hard-drive", tone: "amber" },
  { k: "plan4", icon: "server", tone: "info" },
];

const PENTEST_POINTS = ["pentest1", "pentest2", "pentest3", "pentest4"] as const;
const UAT_POINTS = ["uat1", "uat2", "uat3"] as const;

export function KeamananView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("audit13.keamanan.hero.eyebrow")}
        title={t("audit13.keamanan.hero.title")}
        subtitle={t("audit13.keamanan.hero.subtitle")}
      />

      <section aria-label={t("audit13.keamanan.hero.title")} className="py-12">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          {/* 1. Kontrol yang sudah berjalan */}
          <TrustSection icon="shield-check" title={t("audit13.keamanan.aktifTitle")} desc={t("audit13.keamanan.aktifDesc")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {AKTIF_CONTROLS.map((c) => (
                <div key={c.k} className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={c.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="text-[15px] font-extrabold leading-snug">{t(`audit13.keamanan.${c.k}t`)}</h3>
                  </div>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground/75">
                    {t(`audit13.keamanan.${c.k}d`)}
                  </p>
                  <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    <Icon name="check" className="h-3 w-3" aria-hidden />
                    {t("audit13.keamanan.plan1s")}
                  </span>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 2. Penguatan berkelanjutan */}
          <TrustSection icon="trending-up" title={t("audit13.keamanan.planTitle")} desc={t("audit13.keamanan.planDesc")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {PLAN_ITEMS.map((p) => (
                <div key={p.k} className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={p.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="text-[15px] font-extrabold leading-snug">{t(`audit13.keamanan.${p.k}t`)}</h3>
                  </div>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground/75">
                    {t(`audit13.keamanan.${p.k}d`)}
                  </p>
                  <span
                    className={cn(
                      "mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                      p.tone === "success" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                      p.tone === "amber" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      p.tone === "info" && "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                    )}
                  >
                    {t(`audit13.keamanan.${p.k}s`)}
                  </span>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 3. Program uji penetrasi & audit */}
          <TrustSection icon="radar" title={t("audit13.keamanan.pentestTitle")} desc={t("audit13.keamanan.pentestDesc")}>
            <ul className="space-y-2.5">
              {PENTEST_POINTS.map((k) => (
                <li key={k} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5 text-sm text-foreground/85">
                  <Icon name="scan-line" className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="leading-relaxed">{t(`audit13.keamanan.${k}`)}</span>
                </li>
              ))}
            </ul>
          </TrustSection>

          {/* 4. Responsible disclosure */}
          <TrustSection icon="mail" title={t("audit13.keamanan.discTitle")} desc={t("audit13.keamanan.discDesc")}>
            <Button variant="outline" onClick={() => navigate("lapor")} className="rounded-full font-bold">
              <Icon name="megaphone" className="me-1.5 h-4 w-4" aria-hidden />
              {t("audit13.kontakv.reportCta")}
            </Button>
          </TrustSection>

          {/* 5. UAT & akun demo */}
          <TrustSection icon="clipboard-check" title={t("audit13.keamanan.uatTitle")} desc={t("audit13.keamanan.uatDesc")}>
            <ul className="space-y-2.5">
              {UAT_POINTS.map((k) => (
                <li key={k} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5 text-sm text-foreground/85">
                  <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span className="leading-relaxed">{t(`audit13.keamanan.${k}`)}</span>
                </li>
              ))}
            </ul>
          </TrustSection>

          {/* 6. Kawalan KPI */}
          <TrustCallout tone="gold" icon="activity" title={t("audit13.keamanan.calloutT")}>
            {t("audit13.keamanan.calloutD")}
          </TrustCallout>
        </div>
      </section>
    </div>
  );
}
