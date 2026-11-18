"use client";

/**
 * Task 48 — JamaahDashboard: portal personal Tamu Allah (#/dashboard/jamaah).
 *
 * Widget (semua data personal TIDAK ke server — localStorage saja):
 *  1. Hero sapaan waktu-nyata + kalender Hijriah (islamic-umalqura) + jam hidup
 *  2. Jadwal sholat Jakarta/Makkah + hitung mundur ke sholat berikutnya
 *  3. Progres manasik 8 tahapan interaktif (ring SVG animasi)
 *  4. Tabungan Umrah/Haji (target vs terkumpul + bar progres)
 *  5. Hitung mundur keberangkatan (date picker)
 *  6. Kartu izin Nusuk + aplikasi resmi
 *  7. Checklist perlengkapan 8 item
 *  8. Panduan/doa + akses cepat
 *
 * Hydration aman: semua hasil berbasis waktu/literal localStorage dihitung
 * SETELAH mount (state kosong saat SSR → skeleton → terisi di client).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, formatNumberL10n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import { FamilyGuardianCard, BadgeShowcaseCard } from "@/components/site/family-badges-cards";

/* ================= KONSTANTA ================= */

const KEY_STAGES = "muhdin-jamaah-manasik";
const KEY_KIT = "muhdin-jamaah-kit";
const KEY_SAV = "muhdin-jamaah-sav";
const KEY_DEP = "muhdin-jamaah-dep";
const KEY_CITY = "muhdin-jamaah-city";

/** Jadwal sholat perkiraan (HH:MM lokal) — statis & deterministik. */
const PRAYERS: Record<string, { id: string; time: string }[]> = {
  jakarta: [
    { id: "pSubuh", time: "04:45" },
    { id: "pTerbit", time: "06:00" },
    { id: "pDzuhur", time: "12:05" },
    { id: "pAshar", time: "15:20" },
    { id: "pMaghrib", time: "18:05" },
    { id: "pIsya", time: "19:20" },
  ],
  makkah: [
    { id: "pSubuh", time: "05:35" },
    { id: "pTerbit", time: "07:00" },
    { id: "pDzuhur", time: "12:25" },
    { id: "pAshar", time: "15:45" },
    { id: "pMaghrib", time: "18:55" },
    { id: "pIsya", time: "20:25" },
  ],
};

const STAGE_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
const KIT_KEYS = ["ck1", "ck2", "ck3", "ck4", "ck5", "ck6", "ck7", "ck8"];

/* ================= UTIL ================= */

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, val: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

function timeToHM(diffMs: number): string {
  const s = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/* ================= RING PROGRES ================= */

function ProgressRing({ pct, size = 132 }: { pct: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-primary/15" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-primary transition-all duration-700 motion-reduce:transition-none"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r - 14}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          className="stroke-gold/60 transition-all duration-700 motion-reduce:transition-none"
          strokeDasharray={2 * Math.PI * (r - 14)}
          strokeDashoffset={2 * Math.PI * (r - 14) * (1 - Math.min(100, Math.max(0, pct)) / 100)}
        />
      </svg>
      <span className="absolute text-2xl font-black text-foreground" dir="ltr">
        {Math.round(pct)}%
      </span>
    </span>
  );
}

/* ================= KOMPONEN UTAMA ================= */

export function JamaahDashboard() {
  const { t, locale } = useT();
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [city, setCity] = useState<"jakarta" | "makkah">("jakarta");
  const [stages, setStages] = useState<boolean[]>(Array(8).fill(false));
  const [kit, setKit] = useState<boolean[]>(Array(8).fill(false));
  const [sav, setSav] = useState<{ target: number; cur: number }>({ target: 35_000_000, cur: 12_500_000 });
  const [savIn, setSavIn] = useState<{ target: string; cur: string }>({ target: "", cur: "" });
  const [dep, setDep] = useState<string>("");

  /* Boot: localStorage + waktu setelah mount (hydration aman). */
  const boot = useCallback(() => {
    setStages(readLS(KEY_STAGES, Array(8).fill(false) as boolean[]));
    setKit(readLS(KEY_KIT, Array(8).fill(false) as boolean[]));
    const s = readLS(KEY_SAV, { target: 35_000_000, cur: 12_500_000 });
    setSav(s);
    setSavIn({ target: s.target ? String(s.target) : "", cur: s.cur ? String(s.cur) : "" });
    try {
      setDep(window.localStorage.getItem(KEY_DEP) || "");
    } catch {
      /* ignore */
    }
    try {
      const c = window.localStorage.getItem(KEY_CITY);
      if (c === "makkah") setCity("makkah");
    } catch {
      /* ignore */
    }
    setNow(new Date());
    setReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(boot, 0);
    return () => window.clearTimeout(timer);
  }, [boot]);

  /* Tick 1 detik — jam hidup + countdown sholat. */
  useEffect(() => {
    if (!ready) return;
    const iv = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(iv);
  }, [ready]);

  /* Toggle stage/kit — tulis LS instan. */
  const toggleStage = (i: number) => {
    setStages((prev) => {
      const next = prev.map((v, idx) => (idx === i ? !v : v));
      writeLS(KEY_STAGES, next);
      return next;
    });
  };
  const toggleKit = (i: number) => {
    setKit((prev) => {
      const next = prev.map((v, idx) => (idx === i ? !v : v));
      writeLS(KEY_KIT, next);
      return next;
    });
  };

  const pickCity = (c: "jakarta" | "makkah") => {
    setCity(c);
    try {
      window.localStorage.setItem(KEY_CITY, c);
    } catch {
      /* ignore */
    }
  };

  const saveSav = () => {
    const target = Math.max(0, Number(savIn.target.replace(/\D/g, "")) || 0);
    const cur = Math.max(0, Number(savIn.cur.replace(/\D/g, "")) || 0);
    const next = { target: target || sav.target, cur };
    setSav(next);
    writeLS(KEY_SAV, next);
  };

  const saveDep = (iso: string) => {
    setDep(iso);
    try {
      window.localStorage.setItem(KEY_DEP, iso);
    } catch {
      /* ignore */
    }
  };

  /* ===== Turunan waktu (aman: hanya dijalankan saat now != null) ===== */
  const greet = useMemo(() => {
    if (!now) return "";
    const h = now.getHours();
    if (h < 11) return t("dash.greetMorning");
    if (h < 15) return t("dash.greetAfternoon");
    if (h < 19) return t("dash.greetEvening");
    return t("dash.greetNight");
  }, [now, t]);

  const hijri = useMemo(() => {
    if (!now) return "";
    try {
      const loc = locale === "id" ? "id-u-ca-islamic-umalqura" : locale === "ar" ? "ar-SA-u-ca-islamic-umalqura" : "en-u-ca-islamic-umalqura";
      return new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric" }).format(now);
    } catch {
      return "";
    }
  }, [now, locale]);

  const greg = useMemo(() => {
    if (!now) return "";
    try {
      const loc = locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-GB";
      return new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
    } catch {
      return "";
    }
  }, [now, locale]);

  const clock = useMemo(() => {
    if (!now) return "--:--:--";
    try {
      return now.toLocaleTimeString(locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-GB", { hour12: false });
    } catch {
      return now.toTimeString().slice(0, 8);
    }
  }, [now, locale]);

  /* Sholat berikutnya + countdown. */
  const nextPrayer = useMemo(() => {
    if (!now) return null;
    const list = PRAYERS[city];
    const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    for (const p of list) {
      if (toMin(p.time) > nowMin) {
        return { ...p, eta: timeToHM((toMin(p.time) - nowMin) * 60_000) };
      }
    }
    const subuh = list[0];
    return { ...subuh, eta: timeToHM((24 * 60 - nowMin + toMin(subuh.time)) * 60_000) };
  }, [now, city]);

  /* Progres. */
  const stagesDone = stages.filter(Boolean).length;
  const stagePct = (stagesDone / 8) * 100;
  const kitDone = kit.filter(Boolean).length;
  const savPct = sav.target > 0 ? Math.min(100, (sav.cur / sav.target) * 100) : 0;
  const savLeft = Math.max(0, sav.target - sav.cur);

  /* Countdown keberangkatan. */
  const depDays = useMemo(() => {
    if (!dep || !now) return null;
    const target = new Date(`${dep}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const a = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((a.getTime() - b.getTime()) / 86_400_000);
  }, [dep, now]);

  const num = (n: number) => formatNumberL10n(n, locale);

  return (
    <div className="flex flex-col">
      {/* ============ HERO ============ */}
      <section aria-label={t("dash.jCardTitle")} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div aria-hidden className="absolute -top-20 -end-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl animate-float-soft" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
              <Icon name="moon-star" className="h-3.5 w-3.5" aria-hidden />
              {t("dash.jEyebrow")}
            </span>
            {ready ? (
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {greet}
                <span className="text-gold-gradient">{t("dash.greetPost")}</span>
              </h1>
            ) : (
              <Skeleton className="mt-4 h-10 w-72 rounded-xl" />
            )}
            <p className="mt-2 max-w-xl text-sm text-emerald-50/85 sm:text-base">{t("dash.greetSub")}</p>

            {/* strip tanggal & jam */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white">
                <Icon name="moon-star" className="h-3.5 w-3.5 text-gold" aria-hidden />
                {t("dash.hijriToday")}
                {ready && hijri ? (
                  <span className="font-extrabold text-gold-soft">{hijri}</span>
                ) : (
                  <Skeleton className="h-3.5 w-28 rounded bg-white/20" />
                )}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white">
                <Icon name="calendar" className="h-3.5 w-3.5 text-gold" aria-hidden />
                {ready && greg ? greg : <Skeleton className="h-3.5 w-40 rounded bg-white/20" />}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white">
                <Icon name="clock" className="h-3.5 w-3.5 text-gold" aria-hidden />
                <span className="font-mono font-extrabold tracking-wider text-gold-soft" dir="ltr">
                  {ready ? clock : "--:--:--"}
                </span>
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ GRID UTAMA ============ */}
      <section aria-label={t("dash.quickTitle")} className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          {/* --- Baris 0 (v15): Pengampu Keluarga (R-018) + Lencana Capaian (R-032) --- */}
          <div className="grid gap-5 lg:grid-cols-2" data-testid="family-badges-row">
            <FamilyGuardianCard />
            <BadgeShowcaseCard />
          </div>
          {/* --- Baris 1: sholat + keberangkatan + izin --- */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* JADWAL SHOLAT */}
            <Reveal>
              <div className="h-full rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-extrabold">
                    <Icon name="clock" className="h-5 w-5 text-primary" aria-hidden />
                    {t("dash.prayerTitle")}
                  </h2>
                  <div className="flex rounded-full border bg-muted/50 p-0.5" role="group" aria-label={t("dash.prayerDesc")}>
                    {(["jakarta", "makkah"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => pickCity(c)}
                        aria-pressed={city === c}
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-extrabold transition-colors",
                          city === c ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        {t(`dash.city${c === "jakarta" ? "Jakarta" : "Makkah"}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* sholat berikutnya */}
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-primary to-forest p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/80">
                    {t("dash.nextPrayer")}
                  </p>
                  {nextPrayer ? (
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <p className="text-xl font-black">{t(`dash.${nextPrayer.id}`)}</p>
                      <p className="font-mono text-lg font-extrabold text-gold-soft" dir="ltr">
                        {nextPrayer.time}
                      </p>
                    </div>
                  ) : (
                    <Skeleton className="mt-1 h-7 w-40 rounded bg-white/20" />
                  )}
                  {nextPrayer && (
                    <p className="mt-1 text-xs text-emerald-100/85" dir="ltr">
                      − {nextPrayer.eta}
                    </p>
                  )}
                </div>

                {/* daftar waktu */}
                <ul className="mt-4 space-y-1.5">
                  {PRAYERS[city].map((p) => (
                    <li
                      key={p.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3.5 py-2 text-sm",
                        nextPrayer?.id === p.id ? "bg-primary/10 font-extrabold text-primary" : "text-foreground/85"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon name="moon-star" className={cn("h-3.5 w-3.5", nextPrayer?.id === p.id ? "text-primary" : "text-muted-foreground/50")} aria-hidden />
                        {t(`dash.${p.id}`)}
                      </span>
                      <span className="font-mono font-bold" dir="ltr">
                        {p.time}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{t("dash.prayerNote")}</p>
              </div>
            </Reveal>

            {/* KEBERANGKATAN */}
            <Reveal delay={0.08}>
              <div className="flex h-full flex-col rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="flex items-center gap-2 font-extrabold">
                  <Icon name="plane-takeoff" className="h-5 w-5 text-gold-deep" aria-hidden />
                  {t("dash.depTitle")}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t("dash.depDesc")}</p>

                <div className="mt-5 grid flex-1 place-items-center">
                  {depDays === null ? (
                    <div className="text-center">
                      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-gold/50 bg-gold/5 text-gold-deep">
                        <Icon name="calendar" className="h-8 w-8" aria-hidden />
                      </span>
                      <p className="mt-3 text-sm font-bold text-muted-foreground">{t("dash.depNone")}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p
                        className={cn(
                          "text-6xl font-black leading-none tracking-tight",
                          depDays <= 7 ? "text-gold-deep" : "text-primary"
                        )}
                        dir="ltr"
                      >
                        {num(depDays)}
                      </p>
                      <p className="mt-2 text-sm font-extrabold text-foreground">
                        {depDays <= 1 ? t("dash.depDay") : t("dash.depDays", { n: num(depDays) })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  <Label htmlFor="dep-date" className="text-xs">
                    {t("dash.depPick")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="dep-date"
                      type="date"
                      value={dep}
                      onChange={(e) => saveDep(e.target.value)}
                      className="h-10"
                      dir="ltr"
                    />
                    {dep && (
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={t("dash.depClear")}
                        onClick={() => saveDep("")}
                        className="h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10"
                      >
                        <Icon name="rotate" className="h-4 w-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* IZIN NUSUK + APP */}
            <Reveal delay={0.16}>
              <div className="flex h-full flex-col gap-4">
                <div className="rounded-3xl border border-gold/40 bg-gold/5 p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-extrabold">
                    <Icon name="badge-check" className="h-5 w-5 text-gold-deep" aria-hidden />
                    {t("dash.permitTitle")}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/80">{t("dash.permitDesc")}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate("nusuk")}
                      className="bg-gradient-to-r from-gold-deep to-gold text-forest-deep shadow hover:shadow-lg"
                    >
                      <Icon name="shield-check" className="me-1.5 h-4 w-4" aria-hidden />
                      {t("dash.permitCta")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate("nusuk")} className="font-bold">
                      <Icon name="scroll-text" className="me-1.5 h-4 w-4" aria-hidden />
                      {t("dash.permitRules")}
                    </Button>
                  </div>
                </div>
                <div className="flex-1 rounded-3xl bg-gradient-to-br from-forest-deep to-forest p-6 text-white shadow-sm">
                  <h3 className="flex items-center gap-2 font-extrabold">
                    <Icon name="smartphone" className="h-5 w-5 text-gold" aria-hidden />
                    {t("dash.appTitle")}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-emerald-100/85">{t("dash.appDesc")}</p>
                  <a
                    href="https://www.nusuk.sa/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
                  >
                    {t("dash.appCta")}
                    <Icon name="external-link" className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          {/* --- Baris 2: MANASIK PROGRES --- */}
          <Reveal>
            <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
                <div className="flex items-center gap-6">
                  <ProgressRing pct={stagePct} />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep">{t("dash.msEyebrow")}</p>
                    <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">{t("dash.msTitle")}</h2>
                    <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {t("dash.msDesc")}
                    </p>
                    <Badge variant="outline" className="mt-3 border-primary/40 bg-primary/10 text-xs font-extrabold text-primary">
                      {stagesDone === 8
                        ? t("dash.msComplete")
                        : t("dash.msDone", { done: num(stagesDone), total: num(8) })}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => {
                        setStages(Array(8).fill(false));
                        writeLS(KEY_STAGES, Array(8).fill(false));
                      }}
                      className="mt-2 block text-[11px] font-bold text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                    >
                      {t("dash.reset")}
                    </button>
                  </div>
                </div>
              </div>
              <Stagger className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger={0.05}>
                {STAGE_KEYS.map((k, i) => {
                  const done = stages[i];
                  return (
                    <StaggerItem key={k}>
                      <button
                        type="button"
                        onClick={() => toggleStage(i)}
                        aria-pressed={done}
                        className={cn(
                          "group h-full w-full rounded-2xl border p-4 text-start transition-all hover:shadow-md",
                          done ? "border-primary/50 bg-primary/5" : "bg-muted/20 hover:border-gold/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "grid h-8 w-8 place-items-center rounded-full border-2 font-mono text-xs font-black",
                              done ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"
                            )}
                            dir="ltr"
                          >
                            {done ? "✓" : i + 1}
                          </span>
                          <Icon
                            name={done ? "check-circle-2" : "circle"}
                            className={cn("h-4.5 w-4.5", done ? "text-primary" : "text-muted-foreground/40 group-hover:text-gold")}
                            aria-hidden
                          />
                        </div>
                        <p className={cn("mt-2.5 text-sm font-extrabold leading-snug", done && "text-primary")}>
                          {t(`dash.${k}`)}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t(`dash.${k}d`)}</p>
                      </button>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </div>
          </Reveal>

          {/* --- Baris 3: TABUNGAN + CHECKLIST --- */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* TABUNGAN */}
            <Reveal>
              <div className="h-full rounded-3xl border bg-card p-6 shadow-sm sm:p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep">{t("dash.savEyebrow")}</p>
                <h2 className="mt-1 flex items-center gap-2 text-xl font-extrabold">
                  <Icon name="wallet" className="h-5 w-5 text-gold-deep" aria-hidden />
                  {t("dash.savTitle")}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t("dash.savDesc")}</p>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-black tracking-tight text-foreground" dir="ltr">
                      Rp {num(sav.cur)}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-extrabold",
                        savPct >= 100 ? "border-primary/50 bg-primary/10 text-primary" : "border-gold/50 bg-gold/10 text-gold-deep"
                      )}
                    >
                      {savPct >= 100 ? t("dash.savDone") : t("dash.savPct", { pct: num(Math.round(savPct)) })}
                    </Badge>
                  </div>
                  <div className="mt-2.5 h-3.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(savPct)} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 motion-reduce:transition-none",
                        savPct >= 100 ? "bg-gradient-to-r from-primary to-forest" : "bg-gradient-to-r from-gold-deep via-gold to-gold-soft"
                      )}
                      style={{ width: `${savPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {savPct >= 100 ? (
                      t("dash.savDone")
                    ) : (
                      t("dash.savLeft", { left: `Rp ${num(savLeft)}` })
                    )}
                    {" · "}
                    <span dir="ltr">Rp {num(sav.target)}</span>
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sav-target" className="text-xs">
                      {t("dash.savTargetLabel")}
                    </Label>
                    <Input
                      id="sav-target"
                      inputMode="numeric"
                      value={savIn.target}
                      onChange={(e) => setSavIn((p) => ({ ...p, target: e.target.value }))}
                      className="h-10 font-mono"
                      dir="ltr"
                      placeholder="35000000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sav-cur" className="text-xs">
                      {t("dash.savCurLabel")}
                    </Label>
                    <Input
                      id="sav-cur"
                      inputMode="numeric"
                      value={savIn.cur}
                      onChange={(e) => setSavIn((p) => ({ ...p, cur: e.target.value }))}
                      className="h-10 font-mono"
                      dir="ltr"
                      placeholder="12500000"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] leading-snug text-muted-foreground">{t("dash.savHint")}</p>
                  <Button size="sm" onClick={saveSav} className="shrink-0 bg-gradient-to-r from-gold-deep to-gold text-forest-deep font-extrabold shadow hover:shadow-lg">
                    {t("dash.savUpdate")}
                  </Button>
                </div>
              </div>
            </Reveal>

            {/* CHECKLIST */}
            <Reveal delay={0.08}>
              <div className="h-full rounded-3xl border bg-card p-6 shadow-sm sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-extrabold">
                      <Icon name="clipboard-list" className="h-5 w-5 text-primary" aria-hidden />
                      {t("dash.ckTitle")}
                    </h2>
                    <p className="mt-1.5 text-xs text-muted-foreground">{t("dash.ckDesc")}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-primary/40 bg-primary/10 text-xs font-extrabold text-primary">
                    {t("dash.ckDone", { done: num(kitDone), total: num(8) })}
                  </Badge>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {KIT_KEYS.map((k, i) => {
                    const done = kit[i];
                    return (
                      <li key={k}>
                        <button
                          type="button"
                          onClick={() => toggleKit(i)}
                          aria-pressed={done}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl border p-3 text-start text-xs font-semibold transition-all hover:shadow-sm",
                            done ? "border-primary/40 bg-primary/5 text-primary" : "bg-muted/20 text-foreground/85 hover:border-gold/50"
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2",
                              done ? "border-primary bg-primary text-white" : "border-border"
                            )}
                            aria-hidden
                          >
                            {done && <Icon name="check-circle-2" className="h-3.5 w-3.5" />}
                          </span>
                          <span className={cn("leading-snug", done && "line-through opacity-75")}>{t(`dash.${k}`)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setKit(Array(8).fill(false));
                    writeLS(KEY_KIT, Array(8).fill(false));
                  }}
                  className="mt-3 text-[11px] font-bold text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                >
                  {t("dash.ckReset")}
                </button>
              </div>
            </Reveal>
          </div>

          {/* --- Baris 4: PANDUAN + AKSES CEPAT --- */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-forest-deep to-forest p-7 text-white shadow-sm">
                <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
                <div className="relative">
                  <h2 className="flex items-center gap-2 text-xl font-extrabold">
                    <Icon name="graduation-cap" className="h-5 w-5 text-gold" aria-hidden />
                    {t("dash.doaTitle")}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-100/85">{t("dash.doaDesc")}</p>
                  <Button
                    onClick={() => navigate("tutorial")}
                    className="mt-4 bg-gradient-to-r from-gold-deep to-gold font-extrabold text-forest-deep shadow hover:shadow-lg"
                  >
                    {t("dash.doaCta")}
                    <Icon name="arrow-right" className="ms-1.5 h-4 w-4 rtl:rotate-180" aria-hidden />
                  </Button>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-3xl border bg-card p-7 shadow-sm">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">{t("dash.quickTitle")}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: "shield-alert", label: t("dash.quickLapor"), desc: t("dash.quickLaporDesc"), go: () => navigate("lapor") },
                    { icon: "keyround", label: t("dash.quickTrack"), desc: t("dash.quickTrackDesc"), go: () => navigate("dashboard/mitra") },
                    { icon: "phone", label: t("dash.quickKontak"), desc: t("dash.quickKontakDesc"), go: () => navigate("kontak") },
                  ].map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={q.go}
                      className="rounded-2xl border bg-muted/20 p-4 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <Icon name={q.icon} className="h-5 w-5 text-primary" aria-hidden />
                      <p className="mt-2 text-xs font-extrabold leading-snug">{q.label}</p>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{q.desc}</p>
                    </button>
                  ))}
                </div>
                <a
                  href={`https://wa.me/${BRAND.whatsappIntl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Icon name="message-circle" className="h-3.5 w-3.5" aria-hidden />
                  {t("dash.waHelp")}
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <Icon name="shield-check" className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {t("dash.jFooterNote")}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
