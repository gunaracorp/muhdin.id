"use client";

/**
 * PengurusDetail (Task 29, v13.2) — HALAMAN SENDIRI untuk tokoh pilar kepemimpinan.
 * Route: #/pengurus/<id>  (ketum | sekjen)
 *
 * Ketua Umum: Bunda Hj. Inna Hadianala, S.E. (Master Final 2026–2031).
 * Sekretaris Jenderal: H. Gugun Gunara, S.E. — dengan 7 titel profesional
 * resmi (Master Polymath, Universal Sage, The Ultimate Problem Solver,
 * Senior Investigative Researcher, National Institutional Architect,
 * Political & Government Relations Analyst, Global Hajj & Umrah Industry
 * Strategist) + mandat Sekjen dari dokumen master.
 * Data statis dari src/lib/org-master.ts (sumber kebenaran tunggal).
 */

import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { PENGURUS_PERSON, type PengurusId } from "@/lib/pengurus-data";
import { SEKJEN_TITLES, SEKJEN, KETUA_UMUM, BIDANG_STRATEGIS } from "@/lib/org-master";
import { navigate } from "@/hooks/use-hash-route";
import {
  DetailHero, DetailNotFound, DetailSectionHead,
} from "@/components/views/detail-shell";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

const ALL_IDS: PengurusId[] = ["ketum", "sekjen"];

/** Mandat resmi dari dokumen master (Indonesia — proper noun organisasi). */
const MANDAT: Record<PengurusId, string[]> = {
  ketum: [
    "Memimpin organisasi dan bertanggung jawab atas arah strategis.",
    "Menetapkan prioritas program nasional sesuai AD/ART.",
    "Mengkoordinasikan DPP dan mengesahkan penugasan sesuai kewenangan.",
    "Mewakili MUHDIN dalam hubungan kelembagaan.",
    "Memastikan pembentukan DPW, DPD, dan DPC berjalan tertib.",
    "Menjaga integritas, reputasi, dan kesinambungan organisasi.",
  ],
  sekjen: [
    "Menjadi koordinator utama administrasi dan sekretariat DPP.",
    "Mengelola surat-menyurat, keputusan, notulensi, dan arsip.",
    "Menyusun kalender kerja organisasi.",
    "Mengkoordinasikan pelaporan seluruh bidang.",
    "Menyiapkan rapat pimpinan dan rapat koordinasi.",
    "Menjaga konsistensi dokumen dan data kepengurusan.",
    "Mengawal tindak lanjut keputusan Ketua Umum.",
    "Mengembangkan sistem informasi organisasi bersama bidang terkait.",
  ],
};

const FOKUS: Record<PengurusId, string[]> = {
  ketum: ["Arah strategis", "Program nasional", "Koordinasi DPP", "Hubungan kelembagaan", "Kesinambungan organisasi"],
  sekjen: [
    "Arsitektur organisasi dan kelembagaan",
    "Strategi bisnis dan pengembangan ekosistem",
    "Transformasi digital dan integrasi sistem",
    "Pengembangan tata kelola, SOP, dan standar kerja",
    "Konsolidasi organisasi nasional",
    "Pengembangan model kolaborasi dan kemitraan",
    "Pengendalian pelaksanaan program strategis DPP",
  ],
};

export function PengurusDetail({ id }: { id: string }) {
  const { t } = useT();
  const pid = id as PengurusId;
  const person = PENGURUS_PERSON[pid];

  if (!person || (pid !== "ketum" && pid !== "sekjen")) {
    return (
      <DetailNotFound
        message="Tokoh pengurus tidak ditemukan. Lihat susunan lengkap di halaman Pengurus."
        backTo="/pengurus"
        backLabel={t("pengurus.title")}
      />
    );
  }

  const idx = ALL_IDS.indexOf(pid);
  const prev = idx > 0 ? PENGURUS_PERSON[ALL_IDS[idx - 1]] : undefined;
  const next = idx < ALL_IDS.length - 1 ? PENGURUS_PERSON[ALL_IDS[idx + 1]] : undefined;
  const isSekjen = pid === "sekjen";
  const roleLabel = t(`pengurus.role.${pid}`);

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <DetailHero
        eyebrow={t("pengurus.eyebrow")}
        title={person.name}
        subtitle={roleLabel}
        backTo="/pengurus"
        backLabel={t("pengurus.title")}
        badge={
          <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
            <Icon name="star" className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
            {isSekjen ? "MASTER FINAL 2026–2031" : t("orgMaster.eyebrow")}
          </Badge>
        }
      >
        {/* Monogram */}
        <div className="mt-6">
          <span
            aria-hidden
            className="grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-gold-deep to-primary text-4xl font-black text-white shadow-lg ring-2 ring-white/20"
          >
            {person.name.replace(/^(Bunda\s+)?(Prof\.|Dr\.|Drs\.|KH\.|H\.|Hj\.)\s*/gi, "").charAt(0)}
          </span>
        </div>

        {/* Navigasi antar tokoh */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {prev && (
            <button
              type="button"
              onClick={() => navigate(`/pengurus/${prev.id}`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Icon name="chevron-right" className="h-3.5 w-3.5 rotate-180 rtl:rotate-0" aria-hidden />
              {prev.name}
            </button>
          )}
          {next && (
            <button
              type="button"
              onClick={() => navigate(`/pengurus/${next.id}`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              {next.name}
              <Icon name="chevron-right" className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </button>
          )}
        </div>
      </DetailHero>

      {/* ===== TITEL PROFESIONAL (Sekjen) ===== */}
      {isSekjen && (
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <DetailSectionHead
              icon="sparkles"
              title={t("orgMaster.pillars.titlesLabel")}
            />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2" data-testid="sekjen-detail-titles">
              {SEKJEN_TITLES.map((tl, i) => (
                <Reveal
                  key={tl}
                  delay={0.05 * i}
                >
                  <li className="flex items-center gap-3 rounded-2xl border border-gold/35 bg-gold/[0.07] px-5 py-4 shadow-sm">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold text-forest-deep">
                      <Icon name="award" className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-extrabold tracking-wide">{tl}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
              {SEKJEN.bio}
            </p>
          </div>
        </section>
      )}

      {/* ===== MANDAT ===== */}
      <section className={cn("py-14 sm:py-16", !isSekjen && "pt-0")}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <DetailSectionHead icon="scroll-text" title={roleLabel} />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border bg-card p-6 shadow-sm" data-testid="mandat-list">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-gold-deep dark:text-gold">
                {t("orgMaster.standards.unsur.mandat")}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {MANDAT[pid].map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/80">
                    <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/[0.06] to-card p-6 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-gold-deep dark:text-gold">
                {t("orgMaster.pillars.titlesLabel")}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {FOKUS[pid].map((f) => (
                  <li key={f} className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold-deep dark:text-gold">
                    {f}
                  </li>
                ))}
              </ul>
              {/* Konteks struktur */}
              <div className="mt-6 rounded-2xl border bg-card/70 p-4 text-xs leading-relaxed text-muted-foreground">
                <p className="font-bold text-foreground/80">
                  {isSekjen ? KETUA_UMUM.name : SEKJEN.name}
                </p>
                <p className="mt-1">
                  {isSekjen
                    ? `${BIDANG_STRATEGIS.length} bidang strategis + 3 bidang khusus bekerja di bawah koordinasi DPP 2026–2031.`
                    : t("orgMaster.pillars.desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
