"use client";

/**
 * Task 29 (v13.2) — MASTER WHATSAPP COMMUNITY ARCHITECTURE — FINAL EDITION
 * Route: #/komunitas
 *
 * Keputusan arsitektural super final owner: 17 grup spesialis + 1 kanal
 * pengumuman resmi = 18 kanal komunikasi dalam 6 ekosistem utama.
 *
 * Seksi:
 *  1. Hero 17+1 + statistik ekosistem.
 *  2. Direktori master 18 grup — kartu per kanal dengan tombol SALIN deskripsi
 *     resmi siap-copas WhatsApp (clipboard API + fallback execCommand).
 *  3. Pemetaan 15 departemen BKN → grup.
 *  4. Aturan keanggotaan Primary Membership + Functional Access.
 *  5. Koordinator setiap grup.
 *  6. Identitas visual + rencana implementasi 3 tahap.
 *  7. Prinsip MUHDIN + CTA finale.
 *
 * RTL aman, dark mode token, i18n 3 bahasa untuk kerangka UI; nama grup &
 * naskah deskripsi resmi tetap asli (proper noun organisasi).
 */

import { useMemo, useState } from "react";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { navigate } from "@/hooks/use-hash-route";
import {
  WA_CHANNELS,
  ECOSYSTEMS,
  ECO_COUNTS,
  DEPT_MAPPING,
  MEMBERSHIP_RULES,
  COORDINATORS,
  PHASES,
  WA_STATS,
} from "@/lib/komunitas-wa";
import { cn } from "@/lib/utils";

/** Salin teks ke clipboard dengan fallback non-secure-context. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* jatuh ke fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Chip filter ekosistem. */
function EcoFilter({
  active,
  onPick,
}: {
  active: number | "all";
  onPick: (v: number | "all") => void;
}) {
  const { t } = useT();
  const chip = (isActive: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-colors",
      isActive
        ? "border-gold bg-gold/15 text-gold-deep dark:text-gold"
        : "border-border bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
    );
  return (
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t("waKomunitas.dir.filterAll")}>
      <button type="button" className={chip(active === "all")} onClick={() => onPick("all")}>
        <Icon name="grid-3x3" className="h-3.5 w-3.5" />
        {t("waKomunitas.dir.filterAll")} ({WA_STATS.total})
      </button>
      {ECOSYSTEMS.map((e) => (
        <button key={e.id} type="button" className={chip(active === e.id)} onClick={() => onPick(e.id)}>
          <Icon name={e.icon} className="h-3.5 w-3.5" />
          {t(`waKomunitas.eco.${e.key}`)} ({ECO_COUNTS[e.id] ?? 0})
        </button>
      ))}
    </div>
  );
}

/** Kartu satu kanal WhatsApp. */
function ChannelCard({ ch, delay }: { ch: (typeof WA_CHANNELS)[number]; delay: number }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const text = `#${ch.no} ${ch.name}\n\nAnggota: ${ch.members}\n\n${ch.desc}`;
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <Reveal delay={delay} className="h-full">
      <article
        className={cn(
          "flex h-full flex-col rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
          ch.announce ? "border-gold/50 bg-gradient-to-br from-gold/[0.08] to-card" : "border-primary/20 hover:border-primary/50"
        )}
        data-testid={`wa-channel-${ch.no}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-sm",
              ch.announce ? "bg-gold text-forest-deep" : "bg-primary/10 text-primary"
            )}
          >
            <Icon name={ch.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-forest-deep px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest text-gold">
              #{ch.no}
            </span>
            <h3 className="mt-1.5 text-sm font-extrabold leading-snug tracking-wide">{ch.name}</h3>
          </div>
        </div>

        <dl className="mt-4 space-y-2 text-xs leading-relaxed">
          <div>
            <dt className="font-bold uppercase tracking-wider text-muted-foreground">{t("waKomunitas.dir.fnLabel")}</dt>
            <dd className="mt-0.5 text-foreground/80">{ch.fn}</dd>
          </div>
          <div>
            <dt className="font-bold uppercase tracking-wider text-muted-foreground">{t("waKomunitas.dir.membersLabel")}</dt>
            <dd className="mt-0.5 text-foreground/80">{ch.members}</dd>
          </div>
        </dl>

        {ch.announce && (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-[11px] font-semibold text-gold-deep dark:text-gold">
            <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t("waKomunitas.dir.announceBadge")}
          </p>
        )}

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={onCopy}
            data-testid={`copy-${ch.no}`}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors",
              copied
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-gold/45 bg-gold/10 text-gold-deep hover:bg-gold/20 dark:text-gold"
            )}
          >
            <Icon name={copied ? "check-circle-2" : "copy"} className="h-4 w-4" />
            {copied ? t("waKomunitas.dir.copied") : t("waKomunitas.dir.copyBtn")}
          </button>
        </div>
      </article>
    </Reveal>
  );
}

/* ================================ HALAMAN ================================ */

export function KomunitasView() {
  const { t } = useT();
  const [eco, setEco] = useState<number | "all">("all");
  const channels = useMemo(
    () => (eco === "all" ? WA_CHANNELS : WA_CHANNELS.filter((c) => c.eco === eco)),
    [eco]
  );

  const heroStats = [
    { icon: "message-circle", value: String(WA_STATS.total), label: t("waKomunitas.statTotal") },
    { icon: "users", value: String(WA_STATS.groups), label: t("waKomunitas.statGroups") },
    { icon: "megaphone", value: String(WA_STATS.announce), label: t("waKomunitas.statAnnounce") },
    { icon: "hexagon", value: String(WA_STATS.ecosystems), label: t("waKomunitas.statEco") },
  ];

  return (
    <div className="flex flex-col">
      {/* 1 — Hero */}
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div aria-hidden className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div aria-hidden className="pointer-events-none absolute -top-24 -end-16 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("waKomunitas.eyebrow")}
            </span>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t("waKomunitas.title")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
              {t("waKomunitas.subtitle")}
            </p>
            <p className="mt-5 inline-flex rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-extrabold tracking-[0.25em] text-gold">
              17 + 1
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <ul className="mt-8 flex flex-wrap gap-3">
              {heroStats.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm transition-colors hover:border-gold/40"
                >
                  <Icon name={s.icon} className="h-5 w-5 shrink-0 text-gold" />
                  <span className="text-2xl font-extrabold leading-none text-gold">{s.value}</span>
                  <span className="text-xs font-semibold text-emerald-100/80">{s.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 2 — Direktori master 18 grup */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("waKomunitas.dir.eyebrow")}
            title={t("waKomunitas.dir.title")}
            subtitle={t("waKomunitas.dir.desc")}
          />
          <Reveal delay={0.1} className="mt-8">
            <EcoFilter active={eco} onPick={setEco} />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="wa-directory">
            {channels.map((ch, i) => (
              <ChannelCard key={ch.no} ch={ch} delay={Math.min(0.04 * i, 0.5)} />
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Pemetaan departemen BKN */}
      <section className="bg-mint/30 py-16 dark:bg-muted/30 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("waKomunitas.dept.eyebrow")}
            title={t("waKomunitas.dept.title")}
            subtitle={t("waKomunitas.dept.desc")}
          />
          <Reveal className="mt-10 overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm" data-testid="dept-mapping">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold">{t("waKomunitas.dept.colDept")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("waKomunitas.dept.colGroup")}</th>
                  </tr>
                </thead>
                <tbody>
                  {DEPT_MAPPING.map((m, i) => (
                    <tr key={m.dept} className="border-t transition-colors hover:bg-gold/[0.05]">
                      <td className="px-4 py-3 font-semibold">
                        <span className="me-2 inline-grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-[10px] font-extrabold text-primary">
                          {i + 1}
                        </span>
                        {m.dept}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-forest-deep px-3 py-1 text-[11px] font-extrabold tracking-widest text-gold">
                          {m.groups}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4 — Aturan keanggotaan */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("waKomunitas.rules.eyebrow")}
            title={t("waKomunitas.rules.title")}
            subtitle={t("waKomunitas.rules.desc")}
          />
          <ul className="mt-10 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3" data-testid="membership-rules">
            {MEMBERSHIP_RULES.map((r, i) => (
              <Reveal key={r.profile} delay={Math.min(0.03 * i, 0.4)}>
                <li className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm transition-all hover:border-gold/40">
                  <span className="min-w-0 flex-1 text-xs font-bold leading-snug">{r.profile}</span>
                  <span className="shrink-0 rounded-full bg-forest-deep px-3 py-1 text-[11px] font-extrabold tracking-widest text-gold">
                    {r.main}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.2} className="mt-6">
            <p className="mx-auto flex max-w-3xl items-start gap-2 rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-3 text-xs leading-relaxed text-foreground/75">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              {t("waKomunitas.rules.note")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — Koordinator */}
      <section className="bg-mint/30 py-16 dark:bg-muted/30 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("waKomunitas.coord.eyebrow")}
            title={t("waKomunitas.coord.title")}
            subtitle={t("waKomunitas.coord.desc")}
          />
          <Reveal className="mt-10 overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm" data-testid="coordinator-table">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold">{t("waKomunitas.coord.colNo")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("waKomunitas.coord.colRole")}</th>
                  </tr>
                </thead>
                <tbody>
                  {COORDINATORS.map((c) => {
                    const ch = WA_CHANNELS.find((w) => w.no === c.no);
                    return (
                      <tr key={c.no} className="border-t transition-colors hover:bg-gold/[0.05]">
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-forest-deep px-3 py-1 text-[11px] font-extrabold tracking-widest text-gold">
                            {c.no}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{c.role}</span>
                          {ch && <span className="ms-2 text-xs text-muted-foreground">— {ch.name}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6 — Identitas visual + 3 tahap */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-3xl border bg-card p-7 shadow-sm">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
                <span className="h-px w-5 bg-current" />
                {t("waKomunitas.visual.eyebrow")}
              </span>
              <h3 className="mt-3 text-xl font-extrabold">{t("waKomunitas.visual.title")}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t("waKomunitas.visual.desc")}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                <li className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
                  <span className="h-4 w-4 rounded-full bg-forest-deep ring-1 ring-gold/60" />
                  {t("waKomunitas.visual.chipNavy")}
                </li>
                <li className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold-deep dark:text-gold">
                  <span className="h-4 w-4 rounded-full bg-gold" />
                  {t("waKomunitas.visual.chipGold")}
                </li>
                <li className="flex items-center gap-2 rounded-full border bg-muted/50 px-3.5 py-1.5 text-xs font-bold text-foreground/75">
                  <span className="h-4 w-4 rounded-full bg-white ring-1 ring-border" />
                  {t("waKomunitas.visual.chipWhite")}
                </li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col rounded-3xl border bg-card p-7 shadow-sm">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
                <span className="h-px w-5 bg-current" />
                {t("waKomunitas.phases.eyebrow")}
              </span>
              <h3 className="mt-3 text-xl font-extrabold">{t("waKomunitas.phases.title")}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {t("waKomunitas.phases.desc")}
              </p>
              <ol className="mt-5 space-y-3">
                {PHASES.map((ph) => (
                  <li key={ph.n} className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-3.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold text-sm font-extrabold text-forest-deep">
                      {ph.n}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">{t(`waKomunitas.phases.${ph.key}`)}</p>
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        {ph.groups.map((g) => (
                          <span key={g} className="rounded-full bg-forest-deep px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-gold">
                            {g}
                          </span>
                        ))}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7 — Prinsip + CTA */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-forest-deep p-8 text-center text-white sm:p-12">
              <div aria-hidden className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
              <div aria-hidden className="pointer-events-none absolute -bottom-24 -start-16 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
              <div className="relative">
                <Icon name="hand-heart" className="mx-auto h-8 w-8 text-gold" />
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {t("waKomunitas.principle.title")}
                </h2>
                <ul className="mx-auto mt-5 max-w-xl space-y-2.5 text-start">
                  {["l1", "l2", "l3"].map((k) => (
                    <li key={k} className="flex items-start gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold">
                      <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {t(`waKomunitas.principle.${k}`)}
                    </li>
                  ))}
                </ul>
                <p className="mx-auto mt-5 max-w-2xl text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                  {t("waKomunitas.principle.closing")}
                </p>
                <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-[11px] font-extrabold tracking-[0.18em] text-gold sm:text-xs">
                  {t("waKomunitas.cta.tagline")}
                </p>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-emerald-100/80">
                  {t("waKomunitas.cta.desc")}
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    onClick={() => navigate("daftar")}
                    className="w-full bg-gold text-forest-deep font-bold shadow-md hover:bg-gold/90 sm:w-auto"
                  >
                    {t("waKomunitas.cta.btn")}
                    <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("pengurus")}
                    className="w-full border-gold/50 bg-transparent text-gold hover:bg-gold/10 sm:w-auto"
                  >
                    <Icon name="landmark" className="me-2 h-4 w-4" />
                    {t("waKomunitas.cta.struktur")}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
