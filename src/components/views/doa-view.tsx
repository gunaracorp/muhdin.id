"use client";

/**
 * R-016 (v14.1) — Panduan Doa & Dzikir Audio → Portal #/doa.
 * Kumpulan doa perangkat ibadah (lib/doa.ts): teks Arab (font Amiri),
 * latin, terjemahan dua bahasa + sumber riwayat jujur. Audio diputar via
 * Web Speech API perangkat (speechSynthesis, lafal ar) — tanpa aset
 * eksternal, tetap bekerja offline. Dzikir hitung tasbih disertakan.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { DOA_LIST, DOA_KATEGORI, doaNo, type DoaKategori } from "@/lib/doa";
import { cn } from "@/lib/utils";

export function DoaView() {
  const { t, locale } = useT();
  const k = (key: string) => t(`doa.${key}`);

  const [kategori, setKategori] = useState<DoaKategori | "SEMUA">("SEMUA");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [arVoiceReady, setArVoiceReady] = useState<boolean | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const filtered = useMemo(
    () => (kategori === "SEMUA" ? DOA_LIST : DOA_LIST.filter((d) => d.kategori === kategori)),
    [kategori]
  );

  // Cek ketersediaan suara Arab di perangkat (jujur ditampilkan).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // dipindah ke microtask agar tidak setState sinkron di effect body
      Promise.resolve().then(() => setArVoiceReady(false));
      return;
    }
    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      setArVoiceReady(voices.some((v) => v.lang?.toLowerCase().startsWith("ar")));
    };
    // panggilan pertama via microtask (getVoices kosong di frame pertama)
    Promise.resolve().then(check);
    window.speechSynthesis.onvoiceschanged = check;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  function stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    utterRef.current = null;
    setPlayingId(null);
  }

  function play(id: string, arabic: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (playingId === id) {
      stop();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(arabic);
    utter.lang = "ar-SA";
    utter.rate = 0.72; // lafal perlahan agar mudah diikuti
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("ar"));
    if (voice) utter.voice = voice;
    utter.onend = () => setPlayingId(null);
    utter.onerror = () => setPlayingId(null);
    utterRef.current = utter;
    setPlayingId(id);
    window.speechSynthesis.speak(utter);
  }

  const stats = [
    { label: k("statTotal"), value: String(DOA_LIST.length) },
    { label: k("statKategori"), value: String(DOA_KATEGORI.length) },
    { label: k("statAudio"), value: arVoiceReady === true ? k("audioSiap") : arVoiceReady === false ? k("audioTidakAda") : "…" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {k("eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight" data-testid="doa-title">{k("title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{k("subtitle")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3" data-testid="doa-stats">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gold">{s.label}</p>
                  <p className="mt-1 text-sm font-extrabold">{s.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-2xl text-xs text-emerald-50/60">{k("audioNote")}</p>
          </Reveal>
        </div>
      </section>

      {/* Filter kategori */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap gap-2" data-testid="doa-filter">
            <button
              onClick={() => setKategori("SEMUA")}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-bold transition",
                kategori === "SEMUA" ? "border-primary bg-primary text-white" : "bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {k("semua")}
            </button>
            {DOA_KATEGORI.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setKategori(cat.key)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-bold transition",
                  kategori === cat.key ? "border-primary bg-primary text-white" : "bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                {locale === "en" ? cat.labelEn : cat.labelId}
              </button>
            ))}
          </div>

          {/* Kartu doa */}
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((d, i) => (
              <Reveal key={d.id} delay={Math.min(i * 0.04, 0.3)}>
                <div className="h-full rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md" data-testid={`doa-card-${d.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-gold-deep dark:text-gold">
                        {doaNo(d)} · {DOA_KATEGORI.find((c) => c.key === d.kategori)?.[locale === "en" ? "labelEn" : "labelId"]}
                      </p>
                      <h3 className="mt-1 text-lg font-extrabold">{locale === "en" ? d.titleEn : d.title}</h3>
                    </div>
                    <Button
                      size="sm"
                      variant={playingId === d.id ? "destructive" : "default"}
                      className="shrink-0"
                      onClick={() => play(d.id, d.arabic)}
                      data-testid={`doa-play-${d.id}`}
                    >
                      <Icon name={playingId === d.id ? "square" : "volume-2"} className="mr-1 h-3.5 w-3.5" aria-hidden />
                      {playingId === d.id ? k("stop") : k("putar")}
                    </Button>
                  </div>
                  <p dir="rtl" lang="ar" className="mt-4 text-right font-serif text-2xl leading-[2.2] text-foreground/90">
                    {d.arabic}
                  </p>
                  <p className="mt-3 rounded-xl bg-muted/60 px-4 py-2 text-[13px] italic leading-relaxed text-muted-foreground">
                    {d.latin}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed">{locale === "en" ? d.translationEn : d.translationId}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                    <Icon name="book-open" className="h-3 w-3" aria-hidden />
                    {d.source}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">{k("kosong")}</p>
          )}

          {/* Disclaimer jujur */}
          <div className="mt-10 rounded-2xl border border-gold/40 bg-gold/10 p-5 text-sm leading-relaxed" data-testid="doa-disclaimer">
            <p className="font-extrabold text-gold-deep dark:text-gold">{k("adabTitle")}</p>
            <p className="mt-2 text-foreground/80">{k("adabBody")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
