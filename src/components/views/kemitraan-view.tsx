"use client";

/**
 * Audit 2026 — KemitraanView: Master Kemitraan Strategis Banten 2026–2030
 * (route #/kemitraan). Menyajikan 4 pilar kemitraan, struktur FKK Banten
 * (ketua, sekretariat, 7 divisi), ruang lingkup, ekosistem bisnis, target 2030,
 * basis hukum, perjanjian & SLA, dan roadmap — sesuai hasil audit internal.
 * Shell bersama p0-shared; RTL-aman & dark-mode-aman.
 */
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { useT } from "@/lib/i18n";
import { TrustCallout, TrustHero, TrustSection } from "@/components/views/p0-shared";
import { cn } from "@/lib/utils";

const PARTNERS: { key: string; name: string; icon: string }[] = [
  { key: "kanwil", name: "Kanwil Kementerian Haji dan Umrah RI Banten", icon: "landmark" },
  { key: "iphi", name: "IPHI Banten", icon: "handshake" },
  { key: "kbihu", name: "KBIHU", icon: "users" },
  { key: "muhdin", name: "MUHDIN.ID", icon: "satellite" },
];

const DIVISI: { n: string; o: string; icon: string }[] = [
  { n: "d1", o: "d1o", icon: "scale" },
  { n: "d2", o: "d2o", icon: "badge-check" },
  { n: "d3", o: "d3o", icon: "users" },
  { n: "d4", o: "d4o", icon: "briefcase" },
  { n: "d5", o: "d5o", icon: "database-zap" },
  { n: "d6", o: "d6o", icon: "heart-handshake" },
  { n: "d7", o: "d7o", icon: "graduation-cap" },
];

const LINGKUP = ["l1", "l2", "l3", "l4", "l5"] as const;

const BISNIS: { k: string; icon: string }[] = [
  { k: "b1", icon: "package" },
  { k: "b2", icon: "file-text" },
  { k: "b3", icon: "building-2" },
  { k: "b4", icon: "bus" },
  { k: "b5", icon: "utensils" },
  { k: "b6", icon: "plane-takeoff" },
  { k: "b7", icon: "graduation-cap" },
  { k: "b8", icon: "shopping-bag" },
  { k: "b9", icon: "heart-handshake" },
  { k: "b10", icon: "banknote" },
];

const TARGETS = ["t1", "t2", "t3", "t4", "t5"] as const;

const LEGAL = ["lg1", "lg2", "lg3", "lg4"] as const;

const SLA_ROWS: { i: string; s: string; c: string; tone: "amber" | "success" }[] = [
  { i: "sla1i", s: "sla1s", c: "sla1c", tone: "amber" },
  { i: "sla2i", s: "sla2s", c: "sla2c", tone: "success" },
  { i: "sla3i", s: "sla3s", c: "sla3c", tone: "success" },
  { i: "sla4i", s: "sla4s", c: "sla4c", tone: "amber" },
];

const ROADMAP = ["r1", "r2", "r3", "r4", "r5"] as const;

export function KemitraanView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("audit13.kemitraan.hero.eyebrow")}
        title={t("audit13.kemitraan.hero.title")}
        subtitle={t("audit13.kemitraan.hero.subtitle")}
      />

      <section aria-label={t("audit13.kemitraan.hero.title")} className="py-12">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          {/* 1. Empat pilar kemitraan */}
          <TrustSection icon="handshake" title={t("audit13.kemitraan.partnerTitle")} desc={t("audit13.kemitraan.partnerDesc")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {PARTNERS.map((p) => (
                <div
                  key={p.key}
                  className={cn(
                    "flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-gold/50",
                    p.key === "kanwil" && "border-gold/40 bg-gold/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={p.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-extrabold leading-snug">{p.name}</h3>
                      <p className="text-xs font-bold uppercase tracking-wide text-gold-deep dark:text-gold">
                        {t(`audit13.kemitraan.p${p.key.charAt(0).toUpperCase() + p.key.slice(1)}Tag`)}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm text-foreground/75">
                    {["1", "2", "3"].map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Icon name="check-circle-2" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        <span>{t(`audit13.kemitraan.p${p.key.charAt(0).toUpperCase() + p.key.slice(1)}Org${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t pt-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      {t("audit13.kemitraan.peranBizT")}
                    </p>
                    <ul className="mt-1.5 space-y-1.5 text-sm text-foreground/75">
                      {["1", "2"].map((i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Icon name="target" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                          <span>{t(`audit13.kemitraan.p${p.key.charAt(0).toUpperCase() + p.key.slice(1)}Biz${i}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 2. Forum koordinasi FKK Banten */}
          <TrustSection icon="network" title={t("audit13.kemitraan.forumTitle")} desc={t("audit13.kemitraan.forumDesc")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5">
                <p className="text-[11px] font-black uppercase tracking-wider text-gold-deep dark:text-gold">
                  {t("audit13.kemitraan.ketuaT")}
                </p>
                <p className="mt-1 text-sm font-extrabold">{t("audit13.kemitraan.ketuaD")}</p>
              </div>
              <div className="rounded-2xl border bg-card p-5">
                <p className="text-[11px] font-black uppercase tracking-wider text-primary">
                  {t("audit13.kemitraan.sekT")}
                </p>
                <p className="mt-1 text-sm font-extrabold">{t("audit13.kemitraan.sekD")}</p>
              </div>
            </div>

            <p className="mt-5 text-sm font-extrabold">{t("audit13.kemitraan.divisiTitle")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("audit13.kemitraan.divisiDesc")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DIVISI.map((d, i) => (
                <div key={d.n} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-deep">
                    <Icon name={d.icon} className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                    <span className="absolute -end-1.5 -top-1.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-primary text-[9px] font-extrabold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold leading-snug">{t(`audit13.kemitraan.${d.n}n`)}</p>
                    <p className="mt-1 text-[13px] font-bold text-primary">{t(`audit13.kemitraan.${d.o}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 3. Ruang lingkup kemitraan */}
          <TrustSection icon="git-merge" title={t("audit13.kemitraan.lingkupTitle")} desc={t("audit13.kemitraan.lingkupDesc")}>
            <ul className="space-y-2.5">
              {LINGKUP.map((k) => (
                <li key={k} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5 text-sm text-foreground/85">
                  <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span className="leading-relaxed">{t(`audit13.kemitraan.${k}`)}</span>
                </li>
              ))}
            </ul>
          </TrustSection>

          {/* 4. Ekosistem bisnis */}
          <TrustSection icon="boxes" title={t("audit13.kemitraan.bisnisTitle")} desc={t("audit13.kemitraan.bisnisDesc")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BISNIS.map((b, i) => (
                <div key={b.k} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon name={b.icon} className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                  </span>
                  <p className="text-sm font-bold leading-snug">{t(`audit13.kemitraan.${b.k}`)}</p>
                  <span className="ms-auto text-[10px] font-black text-muted-foreground/60">{i + 1}</span>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 5. Target & dampak 2030 */}
          <TrustSection icon="target" title={t("audit13.kemitraan.targetTitle")} desc={t("audit13.kemitraan.targetDesc")}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TARGETS.map((k) => (
                <div key={k} className="rounded-2xl border border-gold/40 bg-gold/5 p-5 text-center">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {t(`audit13.kemitraan.${k}v`)}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-foreground/70">{t(`audit13.kemitraan.${k}l`)}</p>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 6. Basis hukum */}
          <TrustSection icon="scale" title={t("audit13.kemitraan.legalTitle")} desc={t("audit13.kemitraan.legalDesc")}>
            <ul className="space-y-2.5">
              {LEGAL.map((k) => (
                <li key={k} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5 text-sm text-foreground/85">
                  <Icon name="book-marked" className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="leading-relaxed">{t(`audit13.kemitraan.${k}`)}</span>
                </li>
              ))}
            </ul>
          </TrustSection>

          {/* 7. Perjanjian & SLA */}
          <TrustSection icon="clipboard-check" title={t("audit13.kemitraan.slaTitle")} desc={t("audit13.kemitraan.slaDesc")}>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-start">
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.kemitraan.slaH1")}</th>
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.kemitraan.slaH2")}</th>
                    <th className="p-3.5 text-start font-extrabold">{t("audit13.kemitraan.slaH3")}</th>
                  </tr>
                </thead>
                <tbody>
                  {SLA_ROWS.map((r) => (
                    <tr key={r.i} className="border-b last:border-b-0">
                      <td className="p-3.5 font-bold">{t(`audit13.kemitraan.${r.i}`)}</td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide",
                            r.tone === "success"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {t(`audit13.kemitraan.${r.s}`)}
                        </span>
                      </td>
                      <td className="p-3.5 text-foreground/75">{t(`audit13.kemitraan.${r.c}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TrustSection>

          {/* 8. Roadmap 2026–2030 */}
          <TrustSection icon="calendar" title={t("audit13.kemitraan.roadmapTitle")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {ROADMAP.map((r) => (
                <div key={r} className="rounded-xl border bg-card p-4 text-center">
                  <p className="text-lg font-extrabold text-gold-deep dark:text-gold">{t(`audit13.kemitraan.${r}y`)}</p>
                  <p className="mt-1 text-[13px] font-bold leading-snug text-foreground/80">{t(`audit13.kemitraan.${r}t`)}</p>
                </div>
              ))}
            </div>
          </TrustSection>

          {/* 9. Visi bersama */}
          <Reveal>
            <blockquote className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card p-6 text-center">
              <Icon name="quote" className="mx-auto h-6 w-6 text-gold" aria-hidden />
              <p className="mt-3 text-lg font-extrabold leading-relaxed text-foreground">
                &ldquo;{t("audit13.kemitraan.visiQuote")}&rdquo;
              </p>
              <footer className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("audit13.kemitraan.visiSource")}
              </footer>
            </blockquote>
          </Reveal>

          {/* 10. Catatan audit */}
          <TrustCallout tone="gold" icon="info" title={t("audit13.kemitraan.noteT")}>
            {t("audit13.kemitraan.partnerNote")}
          </TrustCallout>
        </div>
      </section>
    </div>
  );
}
