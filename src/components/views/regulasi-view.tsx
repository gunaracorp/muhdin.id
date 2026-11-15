"use client";

/**
 * Task 5-b-1 — RegulasiView: halaman Pusat Regulasi & Kepatuhan (route #/regulasi).
 * Memakai shell bersama TrustHero / TrustSection / TrustCallout dari p0-shared.
 * Semua teks lewat i18n namespace "regulasi" — RTL-aman & dark-mode-aman.
 */
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { TrustCallout, TrustHero, TrustSection } from "@/components/views/p0-shared";

const BPK_URL = "https://peraturan.bpk.go.id";
const DSN_URL = "https://www.dsn-mui.or.id";

const INST_ITEMS = [
  { key: "uormas", icon: "landmark" },
  { key: "sk", icon: "scale" },
  { key: "adart", icon: "scroll-text" },
] as const;

const INDUSTRY_ITEMS = [
  { key: "uu13", icon: "file-text" },
  { key: "pp115", icon: "gavel" },
  { key: "kemen", icon: "landmark" },
  // Audit 2026 — basis hukum baru penyelenggaraan haji & umrah
  { key: "permen1", icon: "stamp" },
  { key: "permen2", icon: "stamp" },
] as const;

const POLICY_ITEMS = [
  { key: "etik", icon: "swords", route: "etik" },
  { key: "ekosistem", icon: "boxes", route: "ekosistem" },
  { key: "unduhan", icon: "book-marked", route: "unduhan" },
  { key: "transparansi", icon: "eye", route: "transparansi" },
] as const;

/* Kartu regulasi dengan tautan eksternal (peraturan.bpk.go.id / DSN-MUI). */
function RegCard({
  icon,
  title,
  desc,
  linkLabel,
  href,
}: {
  icon: string;
  title: string;
  desc: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-gold/50">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon name={icon} className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="text-[15px] font-extrabold leading-snug">{title}</h3>
      </div>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground/75">{desc}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-gold-deep hover:underline dark:text-gold"
      >
        {linkLabel}
        <Icon name="external-link" className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}

/* Kartu kebijakan internal — navigasi hash internal. */
function PolicyCard({
  icon,
  title,
  desc,
  route,
  openLabel,
}: {
  icon: string;
  title: string;
  desc: string;
  route: string;
  openLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => navigate(route)}
      className="group flex h-full flex-col rounded-2xl border bg-card p-5 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon name={icon} className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="text-[15px] font-extrabold leading-snug">{title}</h3>
      </div>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground/75">{desc}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
        {openLabel}
        <Icon
          name="arrow-right"
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 icon-flip"
          aria-hidden
        />
      </span>
    </button>
  );
}

export function RegulasiView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("regulasi.hero.eyebrow")}
        title={t("regulasi.hero.title")}
        subtitle={t("regulasi.hero.subtitle")}
      />

      <section aria-label={t("regulasi.hero.title")} className="py-12">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          {/* 1. Landasan Kelembagaan */}
          <TrustSection icon="landmark" title={t("regulasi.inst.title")} desc={t("regulasi.inst.desc")}>
            <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INST_ITEMS.map((item) => (
                <RegCard
                  key={item.key}
                  icon={item.icon}
                  title={t(`regulasi.inst.${item.key}T`)}
                  desc={t(`regulasi.inst.${item.key}D`)}
                  linkLabel={t("regulasi.industry.link")}
                  href={BPK_URL}
                />
              ))}
            </div>
          </TrustSection>

          {/* 2. Regulasi Industri Haji & Umrah */}
          <TrustSection icon="file-text" title={t("regulasi.industry.title")} desc={t("regulasi.industry.desc")}>
            <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRY_ITEMS.map((item) => (
                <RegCard
                  key={item.key}
                  icon={item.icon}
                  title={t(`regulasi.industry.${item.key}T`)}
                  desc={t(`regulasi.industry.${item.key}D`)}
                  linkLabel={t("regulasi.industry.link")}
                  href={BPK_URL}
                />
              ))}
            </div>
            {/* Audit 2026 — catatan regulasi penting: kewajiban penyelenggara tetap */}
            <div className="mt-4">
              <TrustCallout tone="amber" icon="alert-triangle" title={t("regulasi.industry.noteT")}>
                {t("regulasi.industry.noteD")}
              </TrustCallout>
            </div>
          </TrustSection>

          {/* 3. Standar Syariah */}
          <TrustSection icon="moon-star" title={t("regulasi.syariah.title")} desc={t("regulasi.syariah.desc")}>
            <RegCard
              icon="book-marked"
              title={t("regulasi.syariah.cardT")}
              desc={t("regulasi.syariah.cardD")}
              linkLabel={t("regulasi.syariah.link")}
              href={DSN_URL}
            />
            <div className="mt-4">
              <TrustCallout tone="gold" icon="shield-check" title={t("regulasi.syariah.calloutT")}>
                {t("regulasi.syariah.calloutD")}
              </TrustCallout>
            </div>
          </TrustSection>

          {/* 4. Kebijakan Internal MUHDIN */}
          <TrustSection icon="shield-check" title={t("regulasi.policy.title")} desc={t("regulasi.policy.desc")}>
            <div className="grid items-stretch gap-4 sm:grid-cols-2">
              {POLICY_ITEMS.map((item) => (
                <PolicyCard
                  key={item.key}
                  icon={item.icon}
                  title={t(`regulasi.policy.${item.key}T`)}
                  desc={t(`regulasi.policy.${item.key}D`)}
                  route={item.route}
                  openLabel={t("regulasi.policy.open")}
                />
              ))}
            </div>
          </TrustSection>

          {/* 5. Callout dokumen resmi */}
          <TrustCallout tone="gold" icon="info" title={t("regulasi.note.title")}>
            <span>{t("regulasi.note.text")}</span>
            <button
              type="button"
              onClick={() => navigate("kontak")}
              className="ms-1 inline-flex items-center gap-1 align-baseline font-extrabold underline underline-offset-2 transition-colors hover:text-gold-deep dark:hover:text-gold"
            >
              {t("regulasi.note.kontak")}
              <Icon name="arrow-right" className="h-3.5 w-3.5 icon-flip" aria-hidden />
            </button>
          </TrustCallout>

          {/* CTA bawah */}
          <Reveal delay={0.08}>
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("regulasi.cta.title")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" onClick={() => navigate("etik")} className="rounded-full px-6 font-bold">
                  {t("regulasi.cta.etik")}
                  <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("transparansi")}
                  className="rounded-full px-6 font-bold"
                >
                  {t("regulasi.cta.transparansi")}
                  <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
                </Button>
                <Button variant="outline" onClick={() => navigate("anggota")} className="rounded-full px-6 font-bold">
                  {t("regulasi.cta.anggota")}
                  <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
