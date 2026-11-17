"use client";

/**
 * Audit 2026 — PembayaranView: Kebijakan Pembayaran & Keuangan (route #/pembayaran).
 * Menjawab tuntutan audit: integrasi payment gateway resmi (#3), alur transaksi
 * nyata quote-to-cash (#4), dan pemisahan dana jamaah (#5). Shell p0-shared;
 * RTL-aman & dark-mode-aman.
 */
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { TrustCallout, TrustHero, TrustSection, TrustSteps } from "@/components/views/p0-shared";

const PAY_CHANNELS: { k: string; icon: string }[] = [
  { k: "pay1", icon: "qr-code" },
  { k: "pay2", icon: "landmark" },
  { k: "pay3", icon: "smartphone" },
];

const FLOW_STEPS: { k: string; icon: string }[] = [
  { k: "flow1", icon: "mail" },
  { k: "flow2", icon: "file-text" },
  { k: "flow3", icon: "clipboard-check" },
  { k: "flow4", icon: "wallet" },
  { k: "flow5", icon: "file-check-2" },
  { k: "flow6", icon: "activity" },
];

const ESCROW_POINTS = ["escrow1", "escrow2", "escrow3"] as const;

export function PembayaranView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("audit13.pembayaran.hero.eyebrow")}
        title={t("audit13.pembayaran.hero.title")}
        subtitle={t("audit13.pembayaran.hero.subtitle")}
      />

      <section aria-label={t("audit13.pembayaran.hero.title")} className="py-12">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          {/* 1. Status kanal pembayaran */}
          <TrustSection icon="wallet" title={t("audit13.pembayaran.statusTitle")} desc={t("audit13.pembayaran.statusDesc")}>
            <div className="grid gap-4 sm:grid-cols-3">
              {PAY_CHANNELS.map((p) => (
                <div key={p.k} className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={p.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-extrabold">{t(`audit13.pembayaran.${p.k}n`)}</h3>
                      <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        {t(`audit13.pembayaran.${p.k}s`)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/75">
                    {t(`audit13.pembayaran.${p.k}d`)}
                  </p>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 2. Alur transaksi quote-to-cash */}
          <TrustSection icon="workflow" title={t("audit13.pembayaran.flowTitle")} desc={t("audit13.pembayaran.flowDesc")}>
            <TrustSteps
              items={FLOW_STEPS.map((s) => ({
                icon: s.icon,
                title: t(`audit13.pembayaran.${s.k}t`),
                desc: t(`audit13.pembayaran.${s.k}d`),
              }))}
            />
          </TrustSection>

          {/* 3. Pemisahan dana jamaah */}
          <TrustSection icon="banknote" title={t("audit13.pembayaran.escrowTitle")} desc={t("audit13.pembayaran.escrowDesc")}>
            <ul className="space-y-2.5">
              {ESCROW_POINTS.map((k) => (
                <li key={k} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5 text-sm text-foreground/85">
                  <Icon name="shield-check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span className="leading-relaxed">{t(`audit13.pembayaran.${k}`)}</span>
                </li>
              ))}
            </ul>
          </TrustSection>

          {/* 4. Ketentuan pengembalian dana */}
          <TrustSection icon="rotate-ccw" title={t("audit13.pembayaran.refundTitle")} desc={t("audit13.pembayaran.refundDesc")}>
            <TrustCallout tone="success" icon="file-check-2">
              {t("audit13.pembayaran.refundBody")}
            </TrustCallout>
          </TrustSection>

          {/* 5. Peringatan penipuan (danger) */}
          <TrustCallout tone="danger" icon="alert-triangle" title={t("audit13.pembayaran.warnTitle")}>
            {t("audit13.pembayaran.warnText")}
          </TrustCallout>

          {/* 6. CTA ke lacak pesanan */}
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/15 via-card to-card p-8 text-center">
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">{t("audit13.pembayaran.ctaT")}</h2>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground">{t("audit13.pembayaran.ctaD")}</p>
              <Button
                size="lg"
                onClick={() => navigate("pesanan")}
                className="rounded-full bg-gradient-to-r from-primary to-forest font-extrabold text-white"
              >
                <Icon name="radar" className="me-2 h-5 w-5" aria-hidden />
                {t("audit13.pembayaran.ctaT")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
