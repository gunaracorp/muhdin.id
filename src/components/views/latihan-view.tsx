"use client";

/**
 * R-023 (v13.3) — Bank Soal Manasik Berjenjang → Portal Latihan.
 * Route: #/latihan
 *
 * Alur: pilih jenjang (DASAR/LANJUTAN/MENTOR) → sesi 10 soal teracak
 * server-side (opsi ikut teracak, kunci jawaban tidak dikirim ke klien) →
 * jawab → koreksi server-side → skor + pembahasan per butir → ulangi.
 *
 * Bank soal hidup di model SoalManasik; CMS menambah butir via /api/soal-manasik.
 */

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SoalLatihan {
  id: string;
  level: string;
  category: string;
  question: string;
  options: string[];
}

interface HasilButir {
  id: string;
  question: string;
  chosenIdx: number;
  correctIdx: number;
  correctText: string;
  isCorrect: boolean;
  explanation: string;
}

interface HasilSesi {
  level: string;
  total: number;
  correct: number;
  score: number;
  detail?: HasilButir[];
}

const LEVEL_META: { key: string; icon: string; ring: string }[] = [
  { key: "DASAR", icon: "sprout", ring: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" },
  { key: "LANJUTAN", icon: "trending-up", ring: "bg-primary/10 text-primary border-primary/30" },
  { key: "MENTOR", icon: "crown", ring: "bg-gold/15 text-gold-deep border-gold/40" },
];

type Tahap = "pilih" | "ujian" | "hasil";

export function LatihanView() {
  const { t } = useT();
  const [tahap, setTahap] = useState<Tahap>("pilih");
  const [level, setLevel] = useState<string>("DASAR");
  const [soal, setSoal] = useState<SoalLatihan[] | null>(null);
  const [jawaban, setJawaban] = useState<Record<string, number>>({});
  const [indeks, setIndeks] = useState(0);
  const [hasil, setHasil] = useState<HasilSesi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // bank counts per level (ditampilkan pada kartu pemilihan)
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (tahap !== "pilih") return;
    apiGet<{ level: string; total: number }>("/api/soal-manasik?level=DASAR&n=1")
      .then((d) => setCounts((p) => ({ ...(p ?? {}), DASAR: d.total })))
      .catch(() => undefined);
    apiGet<{ level: string; total: number }>("/api/soal-manasik?level=LANJUTAN&n=1")
      .then((d) => setCounts((p) => ({ ...(p ?? {}), LANJUTAN: d.total })))
      .catch(() => undefined);
    apiGet<{ level: string; total: number }>("/api/soal-manasik?level=MENTOR&n=1")
      .then((d) => setCounts((p) => ({ ...(p ?? {}), MENTOR: d.total })))
      .catch(() => undefined);
  }, [tahap]);

  const mulai = async (lv: string) => {
    setLevel(lv);
    setLoading(true);
    setError("");
    try {
      const d = await apiGet<{ level: string; total: number; soal: SoalLatihan[] }>(`/api/soal-manasik?level=${lv}&n=10`);
      if (!d.soal?.length) {
        setError(t("latihan.empty"));
        setLoading(false);
        return;
      }
      setSoal(d.soal);
      setJawaban({});
      setIndeks(0);
      setHasil(null);
      setTahap("ujian");
    } catch {
      setError(t("latihan.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  const kumpulkan = async () => {
    if (!soal) return;
    setLoading(true);
    try {
      const answers = soal.map((s) => ({ id: s.id, idx: jawaban[s.id] ?? -1 }));
      const d = await apiSend<HasilSesi>("/api/soal-manasik", "POST", { mode: "submit", level, answers });
      setHasil(d);
      setTahap("hasil");
    } catch {
      setError(t("latihan.submitFail"));
    } finally {
      setLoading(false);
    }
  };

  const mata = (s: number) => {
    if (s >= 85) return { label: t("latihan.great"), icon: "trophy", cls: "text-emerald-600 dark:text-emerald-400" };
    if (s >= 70) return { label: t("latihan.good"), icon: "thumbs-up", cls: "text-primary" };
    return { label: t("latihan.again"), icon: "repeat", cls: "text-gold-deep" };
  };

  return (
    <div className="min-h-[70vh] bg-background pb-20">
      {/* ===== HERO ===== */}
      <section className="border-b bg-gradient-to-br from-forest via-forest-deep to-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold-soft">
              <Icon name="book-open" className="h-3.5 w-3.5" aria-hidden /> R-023 · v13.3
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{t("latihan.heroTitle")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">{t("latihan.heroDesc")}</p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {error && (
          <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</div>
        )}

        {/* ===== TAHAP 1: PILIH JENJANG ===== */}
        {tahap === "pilih" && (
          <section className="pt-12">
            <SectionHeading eyebrow="R-023 · Bank Soal" title={t("latihan.chooseTitle")} subtitle={t("latihan.chooseDesc")} />
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {LEVEL_META.map((m, i) => (
                <Reveal key={m.key} delay={0.06 * i} className="h-full">
                  <article className="flex h-full flex-col rounded-3xl border bg-card p-6 shadow-sm">
                    <span className={cn("grid h-12 w-12 place-items-center rounded-2xl border", m.ring)}>
                      <Icon name={m.icon} className="h-6 w-6" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold">{t(`latihan.level_${m.key}`)}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t(`latihan.levelDesc_${m.key}`)}</p>
                    <p className="mt-3 text-xs font-bold tabular-nums text-muted-foreground">
                      {counts?.[m.key] != null ? t("latihan.bankCount").replace("{n}", String(counts[m.key])) : "…"}
                    </p>
                    <Button
                      onClick={() => mulai(m.key)}
                      disabled={loading}
                      className="mt-4 w-full bg-gradient-to-r from-primary to-forest text-white"
                    >
                      {loading ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />…</> : <><Icon name="play" className="h-4 w-4 mr-1.5" aria-hidden />{t("latihan.start")}</>}
                    </Button>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ===== TAHAP 2: SESI UJIAN ===== */}
        {tahap === "ujian" && soal && (
          <section className="pt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BadgeLike level={level} />
                <span className="text-sm font-bold text-muted-foreground">
                  {t("latihan.progress").replace("{a}", String(indeks + 1)).replace("{b}", String(soal.length))}
                </span>
              </div>
              <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted sm:w-auto sm:flex-1">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all" style={{ width: `${((indeks + 1) / soal.length) * 100}%` }} />
              </div>
            </div>

            <Reveal key={soal[indeks].id} className="mt-6">
              <article className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep">{t(`latihan.cat_${soal[indeks].category}`) !== `latihan.cat_${soal[indeks].category}` ? t(`latihan.cat_${soal[indeks].category}`) : soal[indeks].category}</p>
                <h2 className="mt-2 text-lg font-extrabold leading-snug sm:text-xl">{soal[indeks].question}</h2>
                <div className="mt-5 space-y-2.5">
                  {soal[indeks].options.map((opt, oi) => {
                    const active = jawaban[soal[indeks].id] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setJawaban((p) => ({ ...p, [soal[indeks].id]: oi }))}
                        aria-pressed={active}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                          active ? "border-primary bg-primary/10 text-primary shadow-sm" : "bg-muted/30 text-foreground/85 hover:border-primary/40 hover:text-primary"
                        )}
                      >
                        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-extrabold", active ? "border-primary bg-primary text-white" : "border-border bg-card")}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Button variant="outline" size="sm" disabled={indeks === 0} onClick={() => setIndeks((i) => Math.max(0, i - 1))}>
                    <Icon name="chevron-left" className="h-4 w-4 mr-1" aria-hidden /> {t("latihan.prev")}
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {soal.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-label={`Soal ${i + 1}`}
                        onClick={() => setIndeks(i)}
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition",
                          i === indeks ? "scale-125 bg-gold" : jawaban[s.id] != null ? "bg-primary/70" : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  {indeks < soal.length - 1 ? (
                    <Button size="sm" onClick={() => setIndeks((i) => Math.min(soal.length - 1, i + 1))} className="bg-gradient-to-r from-primary to-forest text-white">
                      {t("latihan.next")} <Icon name="chevron-right" className="h-4 w-4 ml-1" aria-hidden />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={kumpulkan} disabled={loading} className="bg-gradient-to-r from-gold to-gold-deep text-forest-deep">
                      {loading ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />…</> : <><Icon name="check-circle-2" className="h-4 w-4 mr-1.5" aria-hidden />{t("latihan.submit")}</>}
                    </Button>
                  )}
                </div>
              </article>
            </Reveal>
            <p className="mt-3 text-center text-xs text-muted-foreground">{t("latihan.autosaveHint")}</p>
          </section>
        )}

        {/* ===== TAHAP 3: HASIL ===== */}
        {tahap === "hasil" && hasil && (
          <section className="pt-10">
            <Reveal>
              <div className="rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
                <span className="inline-grid h-20 w-20 place-items-center rounded-full border-4 border-gold/40 bg-gold/10">
                  <span className="text-3xl font-extrabold tabular-nums text-gold-deep">{hasil.score}</span>
                </span>
                <h2 className="mt-4 text-2xl font-extrabold">
                  {mata(hasil.score).label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("latihan.scoreLine").replace("{c}", String(hasil.correct)).replace("{b}", String(hasil.total))}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={() => { setTahap("pilih"); setSoal(null); setHasil(null); }}>
                    <Icon name="layers" className="h-4 w-4 mr-1.5" aria-hidden /> {t("latihan.backToLevels")}
                  </Button>
                  <Button onClick={() => mulai(level)} className="bg-gradient-to-r from-primary to-forest text-white">
                    <Icon name="repeat" className="h-4 w-4 mr-1.5" aria-hidden /> {t("latihan.retry")}
                  </Button>
                </div>
              </div>
            </Reveal>

            <div className="mt-8 space-y-4">
              {(hasil.detail ?? []).map((d, i) => (
                <Reveal key={d.id} delay={Math.min(0.3, 0.04 * i)}>
                  <article className={cn("rounded-2xl border p-5", d.isCorrect ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-destructive/30 bg-destructive/[0.04]")}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-extrabold leading-snug sm:text-base">{i + 1}. {d.question}</h3>
                      <Icon
                        name={d.isCorrect ? "check-circle-2" : "x-circle"}
                        className={cn("h-5 w-5 shrink-0", d.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}
                        aria-hidden
                      />
                    </div>
                    <p className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {t("latihan.correctAnswer")}: {d.correctText}
                    </p>
                    {!d.isCorrect && d.chosenIdx >= 0 && (
                      <p className="mt-1 text-xs font-semibold text-destructive/90">{t("latihan.yourAnswer")} #{d.chosenIdx + 1}</p>
                    )}
                    {d.explanation && (
                      <p className="mt-2 border-t pt-2 text-xs leading-relaxed text-muted-foreground">{d.explanation}</p>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/** Lencana jenjang kecil (dipakai di ujian & hasil). */
function BadgeLike({ level }: { level: string }) {
  const meta = LEVEL_META.find((m) => m.key === level) ?? LEVEL_META[0];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold", meta.ring)}>
      <Icon name={meta.icon} className="h-3.5 w-3.5" aria-hidden />
      {level}
    </span>
  );
}
