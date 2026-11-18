"use client";

/**
 * Task 29 (v13.2) — SUSUNAN PENGURUS MUHDIN: MASTER FINAL 2026–2031 (#/pengurus)
 *
 * Keputusan super final owner (dokumen master diupload 2026-11-18). Struktur:
 *  1. Hero + statistik organisasi.
 *  2. Pimpinan & Sekretariat — Ketua Umum & Sekjen (kartu setara profesional;
 *     titel profesional Sekjen tampil di halaman profil detail).
 *  3. Empat Dewan — Penasihat / Kehormatan / Pakar / Pengawas (badge status
 *     personalia apa adanya dari dokumen).
 *  4. Pimpinan Inti BKN — Waketum I–VII, Sekjen+Wasekjen, Bendahara.
 *  5. 15 Bidang Strategis (detail subbidang expandable).
 *  6. 3 Bidang Khusus (ketua + subbidang + keluaran wajib).
 *  7. Personalia Tambahan (kandidat konsolidasi).
 *  8. Register 38 Bakorwil + tingkat organisasi BKN→Bakorwil→BKD→BKC.
 *  9. Standar Kerja — 5 unsur jabatan, siklus kerja, 11 KPI.
 * 10. CTA finale (+ tautan ke 18 Kanal WhatsApp).
 *
 * RTL aman (logical properties), dark mode via token, foto opsional — monogram
 * emas fallback. Nama tetap Latin di semua locale. Status personalia ditampilkan
 * jujur sesuai dokumen resmi (Usulan / Perlu konfirmasi / Belum ditetapkan).
 */

import { useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import {
  PENGURUS_PERSON,
  NET_COUNTS,
  type PengurusPerson,
} from "@/lib/pengurus-data";
import {
  SEKJEN,
  COUNCILS,
  WAKETUM,
  WASEKJEN,
  BENDAHARA,
  BIDANG_STRATEGIS,
  BIDANG_KHUSUS,
  PERSONALIA_TAMBAHAN,
  DPW_38,
  DPW_STRUKTUR,
  ORG_STATS,
  STATUS_KEYS,
  type OrgPerson,
  type PersonStatus,
  type LeaderRow,
} from "@/lib/org-master";
import { cn } from "@/lib/utils";

/** Buang gelar ber-titik lalu ambil inisial dua kata (nama pertama + terakhir). */
function monogram(name: string): string {
  const tokens = name
    .replace(/^(Hj?\.|Drs\.|Prof\.|Dr\.|Ir\.|KH\.|Tn\.|Ny\.|Mayor Art\. \(Purn\.\))*\s*/gi, "")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !t.includes("."))
    .map((t) => t.replace(/[^\p{L}]/gu, ""))
    .filter(Boolean);
  const first = tokens[0]?.charAt(0) ?? "?";
  const last = tokens.length > 1 ? tokens[tokens.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

/** Badge status personalia — warna netral elegan sesuai tingkat penetapan. */
function StatusBadge({ status }: { status: PersonStatus }) {
  const { t } = useT();
  const cls = {
    USULAN: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    PERLU_KONFIRMASI: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    BELUM_DITETAPKAN: "border-border bg-muted text-muted-foreground",
    TERPASANG: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  }[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", cls)}>
      {t(`orgMaster.status.${STATUS_KEYS[status]}`)}
    </span>
  );
}

/** Avatar bulat monogram/foto dengan ring emas. */
function Avatar({ name, icon, size = "md", centered = true }: { name: string; icon: string; size?: "sm" | "md" | "lg"; centered?: boolean }) {
  const dim = { sm: "h-12 w-12", md: "h-20 w-20", lg: "h-36 w-36 text-3xl sm:h-44 sm:w-44 sm:text-4xl" }[size];
  const badge = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-10 w-10" }[size];
  const badgeIcon = { sm: "h-3 w-3", md: "h-3.5 w-3.5", lg: "h-5 w-5" }[size];
  return (
    <div className={cn("relative shrink-0", centered && "mx-auto", dim)}>
      <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-forest ring-4 ring-gold/45 shadow-[0_16px_44px_-14px_rgba(212,175,55,0.55)]">
        <span aria-hidden className="font-extrabold tracking-wider text-white">
          {monogram(name)}
        </span>
      </div>
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-1 -end-1 grid place-items-center rounded-full border-2 border-background bg-gold text-forest-deep shadow-md",
          badge
        )}
      >
        <Icon name={icon} className={badgeIcon} />
      </span>
    </div>
  );
}

/* ============ 2 — Pimpinan & Sekretariat (kartu setara, tanpa kesan monopoli) ============ */

function PillarCard({ pid, delay }: { pid: "ketum" | "sekjen"; delay: number }) {
  const { t } = useT();
  const person: PengurusPerson = PENGURUS_PERSON[pid];
  return (
    <Reveal delay={delay} className="h-full">
      <article
        role="link"
        tabIndex={0}
        aria-label={`${t(`pengurus.role.${pid}`)}: ${person.name}`}
        onClick={() => navigate(`/pengurus/${pid}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/pengurus/${pid}`);
          }
        }}
        className="relative h-full cursor-pointer rounded-3xl border border-primary/25 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-7"
        data-testid={`pillar-${pid}`}
      >
        <div className="flex items-center gap-4">
          <Avatar name={person.name} icon={person.icon} size="md" centered={false} />
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              <Icon name={person.icon} className="h-3 w-3" aria-hidden />
              {t(`pengurus.role.${pid}`)}
            </span>
            <h3 className="mt-2 text-base font-extrabold leading-snug sm:text-lg">
              {person.name}
            </h3>
          </div>
        </div>
        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {t(`pengurus.mandate.${pid}`)}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-[11px] font-bold text-gold-deep dark:text-gold transition">
          {t("orgMaster.pillars.viewProfile")}
          <Icon name="chevron-right" className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
        </span>
      </article>
    </Reveal>
  );
}

/* ============ 3 — Empat Dewan ============ */

function CouncilCard({ council, delay }: { council: (typeof COUNCILS)[number]; delay: number }) {
  const { t } = useT();
  return (
    <Reveal delay={delay} className="h-full">
      <article className="flex h-full flex-col rounded-3xl border border-primary/25 bg-card p-6 shadow-sm transition-shadow hover:shadow-lg hover:border-primary/50 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon name={council.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold leading-tight">
              {t(`orgMaster.council.${council.id}.title`)}
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-deep dark:text-gold">
              {council.code}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t(`orgMaster.council.${council.id}.mandat`)}
        </p>
        <ul className="mt-4 space-y-3" data-testid={`council-${council.id}`}>
          {council.people.map((p: OrgPerson) => (
            <li key={p.name} className="rounded-2xl border bg-muted/30 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold leading-snug">{p.name}</span>
                <StatusBadge status={p.status} />
              </div>
              {p.scope && <p className="mt-1 text-xs text-foreground/70">{p.scope}</p>}
              {p.note && (
                <p className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
                  <Icon name="info" className="mt-0.5 h-3 w-3 shrink-0 text-gold-deep" />
                  {p.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      </article>
    </Reveal>
  );
}

/* ============ 4 — Kartu pimpinan inti ============ */

function LeaderCard({ row, roleLabel, delay }: { row: LeaderRow; roleLabel: string; delay: number }) {
  const { t } = useT();
  const empty = row.name === "";
  return (
    <Reveal delay={delay} className="h-full">
      <article className="flex h-full flex-col rounded-3xl border bg-card p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
        {empty ? (
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground">
            <Icon name="user-plus" className="h-6 w-6" />
          </span>
        ) : (
          <Avatar name={row.name} icon={row.icon} size="sm" />
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 self-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          <Icon name={row.icon} className="h-3 w-3" aria-hidden />
          {roleLabel}
        </span>
        <h3 className="mt-2 text-sm font-extrabold leading-snug">
          {empty ? t("orgMaster.status.belumDitetapkan") : row.name}
        </h3>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">{row.portfolio}</p>
        {row.note && (
          <p className="mt-2 flex items-start gap-1 text-start text-[10.5px] text-muted-foreground">
            <Icon name="info" className="mt-0.5 h-3 w-3 shrink-0 text-gold-deep" />
            {row.note}
          </p>
        )}
        <div className="mt-3">
          <StatusBadge status={row.status} />
        </div>
      </article>
    </Reveal>
  );
}

/* ============ 5 — Kartu bidang strategis (expandable) ============ */

function BidangCard({ b, delay }: { b: (typeof BIDANG_STRATEGIS)[number]; delay: number }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay} className="h-full">
      <article
        className={cn(
          "flex h-full flex-col rounded-3xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md",
          open && "border-gold/50 shadow-md"
        )}
        data-testid={`bidang-${b.no}`}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon name={b.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-deep dark:text-gold">
              BIDANG {b.no}
            </span>
            <h3 className="mt-0.5 text-sm font-extrabold leading-snug">{b.title}</h3>
          </div>
        </div>
        <p className="mt-2.5 flex-1 text-xs leading-relaxed text-muted-foreground">{b.tujuan}</p>
        {open && (
          <ul className="mt-3 space-y-1.5 border-t pt-3" data-testid={`bidang-${b.no}-sub`}>
            {b.sub.map((s) => (
              <li key={s} className="flex items-start gap-1.5 text-xs text-foreground/75">
                <Icon name="check" className="mt-0.5 h-3 w-3 shrink-0 text-gold-deep" />
                {s}
              </li>
            ))}
          </ul>
        )}
        {b.note && open && (
          <p className="mt-2 flex items-start gap-1 text-[10.5px] text-muted-foreground">
            <Icon name="info" className="mt-0.5 h-3 w-3 shrink-0 text-gold-deep" />
            {b.note}
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3 inline-flex items-center gap-1 self-start text-[11px] font-bold text-primary hover:text-primary/80"
        >
          {t("orgMaster.bidang.subLabel")} ({b.sub.length})
          <Icon name="chevron-down" className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </article>
    </Reveal>
  );
}

/* ============ 6 — Kartu bidang khusus ============ */

function BidangKhususCard({ k, delay }: { k: (typeof BIDANG_KHUSUS)[number]; delay: number }) {
  const { t } = useT();
  return (
    <Reveal delay={delay} className="h-full">
      <article className="flex h-full flex-col rounded-3xl border-2 border-gold/30 bg-gradient-to-br from-gold/[0.06] to-card p-6 shadow-sm transition-shadow hover:shadow-lg">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold-deep dark:text-gold">
            <Icon name={k.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-deep dark:text-gold">
              BIDANG KHUSUS {k.no}
            </span>
            <h3 className="mt-0.5 text-sm font-extrabold leading-snug">{k.title}</h3>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border bg-card/80 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("orgMaster.khusus.ketuaLabel")}
          </span>
          <p className="mt-1 text-sm font-extrabold">{k.ketua}</p>
          {k.ketuaNote && (
            <p className="mt-1 flex items-start gap-1 text-[10.5px] text-muted-foreground">
              <Icon name="info" className="mt-0.5 h-3 w-3 shrink-0 text-gold-deep" />
              {k.ketuaNote}
            </p>
          )}
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t("orgMaster.khusus.subLabel")}
        </p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {k.sub.map((s) => (
            <li key={s} className="flex items-start gap-1.5 rounded-xl bg-muted/40 px-2.5 py-1.5 text-[11px] text-foreground/75">
              <Icon name="check" className="mt-0.5 h-3 w-3 shrink-0 text-gold-deep" />
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t("orgMaster.khusus.outLabel")}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {k.out.map((o) => (
            <li key={o} className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-gold-deep dark:text-gold">
              {o}
            </li>
          ))}
        </ul>
      </article>
    </Reveal>
  );
}

/* ================================ HALAMAN ================================ */

export function PengurusView() {
  const { t } = useT();
  const heroStats = [
    { icon: "users", value: String(ORG_STATS.councilPeople), label: t("orgMaster.statPeople") },
    { icon: "landmark", value: String(ORG_STATS.dewans), label: t("orgMaster.statCouncil") },
    { icon: "briefcase", value: String(ORG_STATS.bidangStrategis), label: t("orgMaster.statBidang") },
    { icon: "map", value: String(ORG_STATS.dpw), label: t("orgMaster.statDpw") },
  ];

  return (
    <div className="flex flex-col">
      {/* 1 — Hero banner */}
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div aria-hidden className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div aria-hidden className="pointer-events-none absolute -top-24 -end-16 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("orgMaster.eyebrow")}
            </span>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t("orgMaster.title")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
              {t("orgMaster.subtitle")}
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

      {/* 2 — Dua Pilar Kepemimpinan */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("orgMaster.pillars.eyebrow")}
            title={t("orgMaster.pillars.title")}
            subtitle={t("orgMaster.pillars.desc")}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
            <PillarCard pid="ketum" delay={0.05} />
            <PillarCard pid="sekjen" delay={0.18} />
          </div>
        </div>
      </section>

      {/* 3 — Empat Dewan */}
      <section className="bg-mint/30 py-16 dark:bg-muted/30 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("orgMaster.councils.eyebrow")}
            title={t("orgMaster.councils.title")}
            subtitle={t("orgMaster.councils.desc")}
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {COUNCILS.map((c, i) => (
              <CouncilCard key={c.id} council={c} delay={0.06 * i} />
            ))}
          </div>
          <Reveal delay={0.2} className="mt-6">
            <p className="mx-auto flex max-w-3xl items-start gap-2 rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-3 text-xs leading-relaxed text-foreground/75">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              {t("orgMaster.disclaimer")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — Pimpinan Inti BKN */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("orgMaster.leadership.eyebrow")}
            title={t("orgMaster.leadership.title")}
            subtitle={t("orgMaster.leadership.desc")}
          />
          {/* Bendahara Umum — kartu penuh (berjajar dengan pilar via hierarki) */}
          <Reveal className="mt-10">
            <h3 className="text-center text-lg font-extrabold">{t("orgMaster.leadership.waketumTitle")}</h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WAKETUM.map((row, i) => (
                <li key={row.key}>
                  <LeaderCard row={row} roleLabel={t(`orgMaster.leader.${row.key}`)} delay={0.04 * i} />
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <h3 className="text-center text-lg font-extrabold">{t("orgMaster.leadership.wasekjenTitle")}</h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Sekjen jadi kartu pertama (kepala sekretariat) */}
              <li>
                <LeaderCard
                  row={{ key: "sekjen", name: SEKJEN.name, portfolio: SEKJEN.bio, icon: SEKJEN.icon, status: "TERPASANG" }}
                  roleLabel={t("pengurus.role.sekjen")}
                  delay={0.02}
                />
              </li>
              {WASEKJEN.map((row, i) => (
                <li key={row.key}>
                  <LeaderCard row={row} roleLabel={t(`orgMaster.leader.${row.key}`)} delay={0.04 * (i + 1)} />
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <h3 className="text-center text-lg font-extrabold">{t("orgMaster.leadership.bendaharaTitle")}</h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENDAHARA.map((row, i) => (
                <li key={row.key}>
                  <LeaderCard row={row} roleLabel={t(`orgMaster.leader.${row.key}`)} delay={0.04 * i} />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 5 — 15 Bidang Strategis */}
      <section className="bg-mint/30 py-16 dark:bg-muted/30 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("orgMaster.bidang.eyebrow")}
            title={t("orgMaster.bidang.title")}
            subtitle={t("orgMaster.bidang.desc")}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BIDANG_STRATEGIS.map((b, i) => (
              <li key={b.key}>
                <BidangCard b={b} delay={0.04 * i} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6 — 3 Bidang Khusus */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("orgMaster.khusus.eyebrow")}
            title={t("orgMaster.khusus.title")}
            subtitle={t("orgMaster.khusus.desc")}
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {BIDANG_KHUSUS.map((k, i) => (
              <BidangKhususCard key={k.key} k={k} delay={0.06 * i} />
            ))}
          </div>
        </div>
      </section>

      {/* 7 — Personalia Tambahan */}
      <section className="bg-mint/30 py-16 dark:bg-muted/30 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("orgMaster.personalia.eyebrow")}
            title={t("orgMaster.personalia.title")}
            subtitle={t("orgMaster.personalia.desc")}
          />
          <Reveal className="mt-10 overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-start text-sm">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold">{t("orgMaster.personalia.colName")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("orgMaster.personalia.colInfo")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("orgMaster.personalia.colAction")}</th>
                  </tr>
                </thead>
                <tbody data-testid="personalia-table">
                  {PERSONALIA_TAMBAHAN.map((p) => (
                    <tr key={p.name} className="border-t transition-colors hover:bg-gold/[0.05]">
                      <td className="px-4 py-3 font-bold">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.info}</td>
                      <td className="px-4 py-3 text-foreground/75">{p.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8 — Register 38 Bakorwil + tingkat organisasi */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("orgMaster.dpw.eyebrow")}
            title={t("orgMaster.dpw.title")}
            subtitle={t("orgMaster.dpw.desc")}
          />
          {/* Tingkat organisasi */}
          <Reveal className="mt-10">
            <div className="grid gap-3 rounded-3xl border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: "landmark", label: t("orgMaster.dpw.tierDpp"), hl: true },
                { icon: "map", label: t("orgMaster.dpw.tierDpw") },
                { icon: "building-2", label: t("orgMaster.dpw.tierDpd") },
                { icon: "home", label: t("orgMaster.dpw.tierDpc") },
              ].map((tier) => (
                <div
                  key={tier.label}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4",
                    tier.hl
                      ? "border-gold/40 bg-gradient-to-br from-forest to-forest-deep text-white shadow-md"
                      : "bg-muted/40"
                  )}
                >
                  <Icon name={tier.icon} className={cn("h-5 w-5 shrink-0", tier.hl ? "text-gold" : "text-primary")} />
                  <span className="text-xs font-bold leading-snug">{tier.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
          {/* Grid 38 provinsi */}
          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="dpw-register">
            {DPW_38.map((w, i) => (
              <Reveal key={w.provinsi} delay={Math.min(0.03 * i, 0.4)}>
                <li className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-extrabold text-primary">
                    {String(w.no).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{w.provinsi}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{w.ibuKota}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300"
                    title={t("orgMaster.dpw.ketuaPending")}
                  >
                    BKW
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
          {/* Struktur standar DPW */}
          <Reveal delay={0.15} className="mt-10">
            <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
              <h3 className="text-lg font-extrabold">{t("orgMaster.dpw.strukturTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("orgMaster.dpw.strukturDesc")}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DPW_STRUKTUR.map((s, i) => (
                  <li key={s} className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground/80">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[10px] font-extrabold text-primary">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9 — Standar Kerja */}
      <section className="bg-mint/30 py-16 dark:bg-muted/30 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("orgMaster.standards.eyebrow")}
            title={t("orgMaster.standards.title")}
            subtitle={t("orgMaster.standards.desc")}
          />
          {/* 5 unsur */}
          <Reveal className="mt-10">
            <h3 className="text-center text-lg font-extrabold">{t("orgMaster.standards.unsurTitle")}</h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {(["mandat", "wewenang", "keluaran", "indikator", "akuntabilitas"] as const).map((u, i) => (
                <li key={u} className="rounded-2xl border bg-card p-4 text-center shadow-sm">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold-deep dark:text-gold">
                    <Icon name="badge-check" className="h-5 w-5" />
                  </span>
                  <p className="mt-2.5 text-xs font-bold leading-snug">
                    {t(`orgMaster.standards.unsur.${u}`)}
                  </p>
                  <span className="sr-only">{i + 1}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {/* Siklus kerja */}
          <Reveal delay={0.1} className="mt-12">
            <h3 className="text-center text-lg font-extrabold">{t("orgMaster.standards.siklusTitle")}</h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {(["mingguan", "bulanan", "triwulan", "semester", "tahunan"] as const).map((s) => (
                <li key={s} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <span className="inline-flex rounded-full bg-primary px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    {t(`orgMaster.standards.siklus.${s}.freq`)}
                  </span>
                  <p className="mt-2.5 text-xs font-bold leading-snug">{t(`orgMaster.standards.siklus.${s}.kegiatan`)}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    → {t(`orgMaster.standards.siklus.${s}.out`)}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
          {/* KPI */}
          <Reveal delay={0.15} className="mt-12">
            <h3 className="text-center text-lg font-extrabold">{t("orgMaster.standards.kpiTitle")}</h3>
            <ul className="mx-auto mt-6 grid max-w-4xl gap-2 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                <li key={n} className="flex items-start gap-2.5 rounded-xl border bg-card px-4 py-2.5 text-xs leading-relaxed text-foreground/80">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-gold/15 text-[10px] font-extrabold text-gold-deep dark:text-gold">
                    {n}
                  </span>
                  {t(`orgMaster.standards.kpi.k${n}`)}
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-5 flex max-w-3xl items-start gap-2 rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-3 text-xs leading-relaxed text-foreground/75">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              {t("orgMaster.standards.kpiNote")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 10 — CTA finale */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-forest-deep p-8 text-center text-white sm:p-12">
              <div aria-hidden className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
              <div aria-hidden className="pointer-events-none absolute -bottom-24 -start-16 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
              <div className="relative">
                <Icon name="handshake" className="mx-auto h-8 w-8 text-gold" />
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {t("orgMaster.cta.title")}
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
                  {t("orgMaster.cta.desc")}
                </p>
                <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-gold sm:text-sm">
                  <Icon name="check-circle-2" className="h-4 w-4 shrink-0" aria-hidden />
                  SATU EKOSISTEM · SATU KOLABORASI · SATU KOMITMEN
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    onClick={() => navigate("daftar")}
                    className="w-full bg-gold text-forest-deep font-bold shadow-md hover:bg-gold/90 sm:w-auto"
                  >
                    {t("orgMaster.cta.btn")}
                    <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("komunitas")}
                    className="w-full border-gold/50 bg-transparent text-gold hover:bg-gold/10 sm:w-auto"
                  >
                    <Icon name="message-circle" className="me-2 h-4 w-4" />
                    {t("orgMaster.cta.wa")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("kontak")}
                    className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    <Icon name="mail" className="me-2 h-4 w-4" />
                    {t("orgMaster.cta.contact")}
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
