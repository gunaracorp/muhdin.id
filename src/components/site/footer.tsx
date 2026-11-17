"use client";

/**
 * Task 45 — "The World-Class Signature Footer" — evolusi Crown Footer (Task 20).
 *
 * Lapisan kemewahan:
 *  1. Hairline emas beranimasi (divider-flow) + aurora ambient + watermark
 *     raksasa "MUHDIN" outline emas di dasar footer.
 *  2. CTA band bergaya hero — ajakan bergabung + tombol Daftar & WhatsApp resmi.
 *  3. Newsletter (Task 18-c, tetap hidup ke /api/subscribers).
 *  4. 5 kolom: Brand / Tautan Cepat / Navigasi / Ekosistem / Kontak.
 *  5. SIGNATURE PANEL digiman.id — logo SVG hexagon-orbit khusus, wordmark
 *     gradasi, deskripsi studio, chip stack teknologi, tombol kunjungi
 *     digiman.id, kredit JuraganWeb + baris "crafted". Sapuan cahaya (sweep).
 *  6. Bar kepercayaan (PWA, 3 Bahasa, Ter-Audit, Nusuk).
 *  7. Bar bawah: legal (kini i18n ×3), tombol kembali ke atas, chip
 *     "Dirancang oleh digiman.id" + "Bangga Buatan Indonesia".
 *
 * RTL aman penuh (start/end/ms/me + dir="ltr" untuk watermark, wordmark,
 * chip stack & nomor). Semua animasi CSS murni + guard prefers-reduced-motion.
 * Footer tetap tersembunyi di rute admin & menempel di dasar viewport (mt-auto).
 */

import { useEffect, useState } from "react";
import { useHashRoute, navigate } from "@/hooks/use-hash-route";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiSend } from "@/lib/client-api";
import { MuhdinBrand } from "@/components/site/logo";
import { Icon } from "@/components/site/icon";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

const NAV_LINKS: [path: string, key: string][] = [
  ["beranda", "beranda"],
  ["nusuk", "nusukHub"],
  ["ekosistem", "ekosistem13"],
  ["alur", "alur"],
  ["anggota", "anggota"],
  // Task 30 — deep-link tab verifikasi: #/anggota/verifikasi kini membuka tab Cek Verifikasi langsung.
  ["anggota/verifikasi", "verifikasi"],
  ["tutorial", "tutorial"],
  ["berita", "berita"],
  ["pengurus", "pengurus"],
  ["gabung", "gabung"],
];

/** Task 18-c — tautan cepat ke 5 halaman portal baru.
 *  Task 50 — + Tentang & Kontak (menu navbar kini fokus layanan; halaman ini
 *  tetap terjangkau dari footer). */
const QUICK_LINKS: [path: string, key: string][] = [
  ["lacak", "lacak"],
  ["galeri", "galeri"],
  ["agenda", "agenda"],
  ["unduhan", "unduhan"],
  ["lapor", "lapor"],
  ["tentang", "tentang"],
  ["kontak", "kontak"],
  // v4.1 — halaman baru: pusat bantuan, jaringan daerah, peta situs
  ["faq", "faq"],
  ["dpd", "dpd"],
  ["peta-situs", "sitemap"],
  // v5.0 — marketplace, forum, kartu jamaah
  ["paket", "paket"],
  ["forum", "forum"],
  ["kartu", "kartu"],
  // v6.0 — pusat bisnis B2B + brankas jamaah
  ["bisnis", "bisnis"],
  ["vault", "vault"],
  // v7.0 — Pindai Izin 360°
  ["pindai", "pindai"],
];

/** Task 52 (P0) — kolom "Tata Kelola & Kepercayaan": infrastruktur kepercayaan + audit 2026. */
const TRUST_LINKS: [path: string, key: string][] = [
  ["regulasi", "trustRegulasi"],
  ["transparansi", "trustTransparansi"],
  ["etik", "trustEtik"],
  ["pdp", "trustPdp"],
  ["darurat", "trustDarurat"],
  ["status", "trustStatus"],
  ["sehat", "trustSehat"],
  ["kalkulator", "trustKalkulator"],
  ["widget", "trustWidget"],
  // Audit 2026 — kemitraan, pembayaran, keamanan, model biaya
  ["kemitraan", "trustKemitraan"],
  ["pembayaran", "trustPembayaran"],
  ["keamanan", "trustKeamanan"],
  ["biaya", "trustBiaya"],
];

/** Task 30 — tiap layanan footer kini deep-link ke detail ekosistemnya (dialog auto-terbuka). */
const EKOSISTEM_LINKS: [key: string, num: number][] = [
  ["visa", 1],
  ["handling", 2],
  ["akomodasi", 6],
  ["raudah", 9],
  ["retail", 11],
  ["command", 13],
];

/** Task 30 — ikon sosmed memakai URL resmi dari Pengaturan Situs (CMS), bukan placeholder. */
const SOCIALS: [key: string, icon: string, settingKey: string][] = [
  ["instagram", "instagram", "instagram"],
  ["facebook", "facebook", "facebook"],
  ["twitter", "twitter", "twitter"],
  ["youtube", "youtube", "youtube"],
  ["whatsapp", "message-circle", "whatsapp"],
];

/** Task 45 — tautan legal kini terlokalisasi penuh (dulunya hardcoded ID). */
const LEGAL_LINKS: [path: string, key: string][] = [
  ["anggota/verifikasi", "legalVerify"],
  ["privasi", "legalPrivacy"],
  ["syarat", "legalTerms"],
];

/** Task 45 — chip stack teknologi nyata yang menopang platform (statik, tidak diklaim berlebihan). */
const STACK_CHIPS = ["NEXT.JS 16", "REACT 19", "TAILWIND 4", "PWA", "RTL READY"];

/** URL resmi developer — ditampilkan & ditautkan di signature panel + bar bawah. */
const DIGIMAN_URL = "https://digiman.id";

/** Normalisasi nomor WA menjadi format internasional untuk tautan wa.me. */
function waDigits(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = `62${d.slice(1)}`;
  else if (d.startsWith("8")) d = `62${d}`;
  return d;
}

/** Bar kepercayaan — fitur nyata hasil Task 14–18. */
const TRUST_BADGES: [icon: string, key: string][] = [
  ["badge-check", "trustPwa"],
  ["languages", "trustLang"],
  ["shield-check", "trustSecure"],
  ["satellite", "trustNusuk"],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NewsMsg = { kind: "dup" | "error"; text: string };

/** Form "Berlangganan Kabar" → POST /api/subscribers {email}. Sukses: toast; gagal: inline. */
function NewsletterForm() {
  const { t } = useT();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<NewsMsg | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setMsg({ kind: "error", text: t("footer.newsErrInvalid") });
      return;
    }
    setLoading(true);
    try {
      // Kontrak: 201 {ok:true} / duplikat 201 {ok:true,already:true} / 409 — semuanya ramah.
      const res = await apiSend<{ ok?: boolean; already?: boolean }>("/api/subscribers", "POST", { email: value });
      if (res?.already) {
        setMsg({ kind: "dup", text: t("footer.newsDupMsg") });
      } else {
        toast({ title: t("footer.newsOkTitle"), description: t("footer.newsOkDesc") });
        setEmail("");
      }
    } catch (err) {
      const raw = ((err as Error).message || "").trim();
      if (/sudah|terdaftar|already|exist|409/i.test(raw)) {
        setMsg({ kind: "dup", text: t("footer.newsDupMsg") });
      } else {
        setMsg({ kind: "error", text: raw || t("footer.newsErrMsg") });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex items-start gap-3 flex-1">
        <span className="shrink-0 h-10 w-10 rounded-xl grid place-items-center bg-gold/15 text-gold ring-1 ring-gold/30">
          <Icon name="bell" className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold text-white text-sm tracking-wide">{t("footer.newsTitle")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-emerald-100/70">{t("footer.newsDesc")}</p>
        </div>
      </div>
      <div className="w-full lg:max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="newsletter-email" className="sr-only">
            {t("footer.newsAria")}
          </label>
          <Input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("footer.newsPlaceholder")}
            aria-label={t("footer.newsAria")}
            aria-invalid={msg?.kind === "error"}
            autoComplete="email"
            dir="ltr"
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-emerald-100/40"
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-gold text-forest-deep font-bold hover:bg-gold/90 shrink-0"
          >
            {loading ? (
              <Icon name="loader-2" className="h-4 w-4 me-1.5 animate-spin" />
            ) : (
              <Icon name="send" className="h-4 w-4 me-1.5" />
            )}
            {t("footer.newsBtn")}
          </Button>
        </form>
        {msg && (
          <p
            role="status"
            className={
              msg.kind === "dup"
                ? "mt-2 text-xs font-semibold text-emerald-100/80"
                : "mt-2 text-xs font-semibold text-gold"
            }
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Elemen mewah Task 20 (dipertahankan) ---------- */

/** Heading kolom: belahan berlian emas + garis rambut gradien. */
function ColHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-5 flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.18em] text-white">
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rotate-45 bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"
      />
      <span>{children}</span>
      <span aria-hidden className="h-px w-6 bg-gradient-to-r from-gold/60 to-transparent" />
    </h3>
  );
}

/** Link footer: garis emas merambat masuk + underline sweep saat hover. */
function FootLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex max-w-full items-center text-start text-sm text-emerald-100/70 outline-none transition-colors hover:text-gold focus-visible:text-gold"
    >
      <span
        aria-hidden
        className="h-px w-0 shrink-0 bg-gold/80 transition-all duration-300 group-hover:w-3 group-hover:me-2"
      />
      <span className="relative break-words">
        {children}
        <span
          aria-hidden
          className="absolute -bottom-0.5 start-0 h-px w-0 bg-gold/50 transition-all duration-300 group-hover:w-full"
        />
      </span>
    </button>
  );
}

/* ---------- Elemen Task 45 ---------- */

/**
 * Logo digiman.id — hexagon emerald (saudara hexagon MUHDIN) + huruf "D"
 * emas + node emas di verteks + orbit dashed berputar pelan (.sig-orbit).
 * SVG statis & deterministik — aman hydration.
 */
function DigimanMark({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Logo digiman.id">
      <defs>
        <linearGradient id="digiman-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0D98A" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="digiman-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F7A50" />
          <stop offset="100%" stopColor="#0A4A30" />
        </linearGradient>
      </defs>
      {/* Orbit dashed — berputar pelan via CSS */}
      <circle
        cx="32"
        cy="32"
        r="27.5"
        fill="none"
        stroke="url(#digiman-gold)"
        strokeWidth="0.9"
        strokeDasharray="2.5 5"
        opacity="0.55"
        className="sig-orbit"
      />
      {/* Hexagon frame (bahasa bentuk yang sama dengan logo MUHDIN) */}
      <polygon
        points="32,4.5 56,18 56,46 32,59.5 8,46 8,18"
        fill="url(#digiman-green)"
        stroke="url(#digiman-gold)"
        strokeWidth="2.4"
      />
      <polygon
        points="32,9 51.5,20.2 51.5,43.8 32,55 12.5,43.8 12.5,20.2"
        fill="none"
        stroke="url(#digiman-gold)"
        strokeWidth="0.8"
        opacity="0.55"
      />
      {/* Huruf D — identitas Digiman */}
      <path d="M23.5 19.5 h9.5 a12.5 12.5 0 0 1 0 25 h-9.5 z" fill="url(#digiman-gold)" />
      {/* Node digital di verteks kiri & kanan */}
      <circle cx="8" cy="18" r="1.9" fill="url(#digiman-gold)" />
      <circle cx="56" cy="18" r="1.9" fill="url(#digiman-gold)" />
      <circle cx="8" cy="46" r="1.9" fill="url(#digiman-gold)" />
      <circle cx="56" cy="46" r="1.9" fill="url(#digiman-gold)" />
    </svg>
  );
}

/** Tombol melayang kembali ke atas — sentuhan premium di bar bawah. */
function BackToTop({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold outline-none transition-all hover:-translate-y-0.5 hover:bg-gold/20 hover:shadow-[0_8px_20px_-6px_rgba(212,175,55,0.45)] focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      <Icon name="arrow-up" className="h-4 w-4" />
    </button>
  );
}

/** CTA band bergaya hero — ajakan bergabung + aksi Daftar & WhatsApp resmi. */
function CtaBand({ go }: { go: (path: string) => void }) {
  const { t } = useT();
  const waHref = `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(BRAND.waGreeting)}`;
  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-gold/50 via-primary/30 to-gold/15 p-px shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
      <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-6 py-8 sm:px-10 sm:py-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -end-16 h-52 w-52 rounded-full bg-gold/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -start-10 h-52 w-52 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
              <Icon name="sparkles" className="h-3.5 w-3.5" aria-hidden />
              {BRAND.name} ✦ {new Date().getFullYear()}
            </p>
            <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">
              {t("footer.ctaTitle")}{" "}
              <span className="text-gold-gradient">{t("footer.ctaAccent")}</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-emerald-100/70">{t("footer.ctaDesc")}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button
              onClick={() => go("daftar")}
              className="h-11 bg-gold px-6 text-sm font-bold text-forest-deep hover:bg-gold/90"
            >
              <Icon name="arrow-right" className="me-2 h-4 w-4 icon-flip" aria-hidden />
              {t("footer.ctaBtn")}
            </Button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
            >
              <Icon name="message-circle" className="h-4 w-4" aria-hidden />
              {t("footer.ctaWa")}
              <span dir="ltr" className="hidden text-xs text-emerald-100/60 md:inline">
                {BRAND.whatsappDisplay}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SIGNATURE PANEL — panggung developer: digiman.id (PT Digital Bisnis
 * Manajemen). Logo + wordmark gradasi + chip stack + tombol kunjungi situs,
 * ditutup baris kredit "crafted" & support system JuraganWeb.
 */
function SignaturePanel() {
  const { t } = useT();
  return (
    <section aria-label={t("footer.colTech")} className="mt-14">
      <div className="mb-5 flex items-center gap-4" aria-hidden>
        <span className="gold-divider flex-1" />
        <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
          {t("footer.colTech")}
        </p>
        <span className="gold-divider flex-1" />
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/45 via-primary/25 to-gold/10 p-px shadow-[0_34px_90px_-32px_rgba(0,0,0,0.75)]">
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-white/[0.04] px-6 py-8 sm:px-10">
          {/* Sapuan cahaya + aurora */}
          <div
            aria-hidden
            className="sig-sweep pointer-events-none absolute inset-y-0 start-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -end-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl"
          />
          <div
            aria-hidden
            className="animate-float-soft pointer-events-none absolute -bottom-28 -start-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
          />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            {/* Identitas developer */}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold/80">
                {t("footer.develLabel")}
              </p>
              <div className="mt-4 flex items-center gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-2xl bg-gold/25 blur-xl"
                  />
                  <DigimanMark className="relative h-16 w-16 sm:h-20 sm:w-20" />
                </div>
                <div className="min-w-0">
                  <p dir="ltr" className="text-3xl font-black leading-none tracking-tight sm:text-4xl">
                    <span className="text-white">digiman</span>
                    <span className="text-gold-gradient">.id</span>
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-100/80">
                    {t("footer.develName")}
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-emerald-100/60">
                {t("footer.develDesc")}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                  {t("footer.develTag")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-emerald-100/70">
                  <Icon name="map-pin" className="h-3 w-3 text-gold" aria-hidden />
                  {t("footer.madeIn")}
                </span>
              </div>
            </div>

            {/* Stack teknologi + CTA ke situs developer */}
            <div className="space-y-4 lg:w-64 lg:border-s lg:border-white/10 lg:ps-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/70">
                {t("footer.stackLabel")}
              </p>
              <ul dir="ltr" className="flex flex-wrap gap-1.5">
                {STACK_CHIPS.map((s) => (
                  <li
                    key={s}
                    className="rounded-md border border-gold/25 bg-gold/10 px-2 py-1 font-mono text-[10px] tracking-wider text-gold/90"
                  >
                    {s}
                  </li>
                ))}
              </ul>
              <a
                href={DIGIMAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-forest-deep transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-8px_rgba(212,175,55,0.55)]"
              >
                {t("footer.visitSite")}
                <Icon
                  name="external-link"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  aria-hidden
                />
              </a>
            </div>
          </div>

          {/* Baris kredit: crafted + support system */}
          <div className="relative mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-center sm:flex-row sm:text-start">
            <p className="flex items-center gap-2 text-xs text-emerald-100/60">
              <Icon name="heart-handshake" className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              {t("footer.crafted")}
            </p>
            <p className="flex items-center gap-2 text-xs text-emerald-100/60">
              <Icon name="server" className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              {t("footer.supportLabel")}{" "}
              <span className="font-bold text-emerald-100/85">{t("footer.supportName")}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const route = useHashRoute();
  const { t } = useT();
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<Record<string, string>>("/api/settings")
      .then((s) => alive && setSettings(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (route[0] === "admin") return null;

  const go = (path: string) => navigate(path);

  /** URL sosmed asli dari CMS; fallback ke halaman kontak bila belum diisi. */
  const socialHref = (settingKey: string): string => {
    const raw = settings?.[settingKey]?.trim();
    if (!raw) return "#/kontak";
    if (settingKey === "whatsapp") return `https://wa.me/${waDigits(raw)}`;
    return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  };

  return (
    <footer className="relative mt-auto overflow-hidden bg-forest-deep text-emerald-50/90">
      {/* 1 — Hairline emas beranimasi + watermark raksasa + glow ambient */}
      <div className="gold-divider-animated relative z-10" aria-hidden />
      <div
        aria-hidden
        dir="ltr"
        className="footer-watermark pointer-events-none absolute inset-x-0 bottom-0 z-0 translate-y-[22%] text-center font-black leading-[0.78] tracking-tight text-[clamp(5.5rem,19vw,15rem)]"
      >
        MUHDIN
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -start-[10%] h-72 w-72 rounded-full bg-gold/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -end-[8%] h-80 w-80 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="bg-islamic-pattern-gold relative z-10">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14">
          {/* 2 — CTA band */}
          <CtaBand go={go} />

          {/* 3 — Newsletter — Task 18-c */}
          <div className="mb-12">
            <NewsletterForm />
          </div>

          {/* 4 — Kolom utama */}
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* Brand */}
            <div className="space-y-4">
              <div className="footer-brand-light">
                <MuhdinBrand light />
              </div>
              <p className="text-sm leading-relaxed text-emerald-100/70">{t("footer.desc")}</p>
              <p className="font-arabic text-2xl text-gold" dir="rtl">
                {BRAND.arabic}
              </p>
              <p className="text-gold-gradient inline-block text-sm font-extrabold tracking-wide">
                ✦ {t("footer.tagline")}
              </p>
              <div className="flex gap-2 pt-1">
                {SOCIALS.map(([key, icon, settingKey]) => {
                  const href = socialHref(settingKey);
                  const external = href.startsWith("http");
                  return (
                    <a
                      key={key}
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      aria-label={key.charAt(0).toUpperCase() + key.slice(1)}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-emerald-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/15 hover:text-gold hover:shadow-[0_8px_20px_-6px_rgba(212,175,55,0.4)]"
                    >
                      <Icon name={icon} className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Tautan cepat — Task 18-c */}
            <nav aria-label={t("footer.colQuick")}>
              <ColHead>{t("footer.colQuick")}</ColHead>
              <ul className="space-y-2.5 text-sm">
                {QUICK_LINKS.map(([path, key]) => (
                  <li key={key}>
                    <FootLink onClick={() => go(path)}>{t(`footer.quick.${key}`)}</FootLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Navigasi */}
            <nav aria-label={t("footer.colNav")}>
              <ColHead>{t("footer.colNav")}</ColHead>
              <ul className="space-y-2.5 text-sm">
                {NAV_LINKS.map(([path, key], i) => (
                  <li key={`${path}-${i}`}>
                    <FootLink onClick={() => go(path)}>{t(`footer.nav.${key}`)}</FootLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Ekosistem */}
            <nav aria-label={t("footer.colEcosystem")}>
              <ColHead>{t("footer.colEcosystem")}</ColHead>
              <ul className="space-y-2.5 text-sm">
                {EKOSISTEM_LINKS.map(([k, num]) => (
                  <li key={k}>
                    <FootLink onClick={() => go(`ekosistem/${num}`)}>{t(`footer.eco.${k}`)}</FootLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Tata kelola & kepercayaan — Task 52 (P0) */}
            <nav aria-label={t("footer.trustTitle")}>
              <ColHead>{t("footer.trustTitle")}</ColHead>
              <ul className="space-y-2.5 text-sm">
                {TRUST_LINKS.map(([path, key]) => (
                  <li key={key}>
                    <FootLink onClick={() => go(path)}>{t(`footer.${key}`)}</FootLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Kontak */}
            <div>
              <ColHead>{t("footer.colContact")}</ColHead>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <Icon name="mail" className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                  <a
                    href={`mailto:${settings?.email?.trim() || "info@muhdin.web.id"}`}
                    className="text-emerald-100/70 break-all transition-colors hover:text-gold"
                  >
                    {settings?.email?.trim() || "info@muhdin.web.id"}
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="phone" className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                  <a
                    href={`tel:${(settings?.phone?.trim() || "+62 21 1234 5678").replace(/[^+\d]/g, "")}`}
                    className="text-emerald-100/70 transition-colors hover:text-gold"
                    dir="ltr"
                  >
                    {settings?.phone?.trim() || "+62 21 1234 5678"}
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="map-pin" className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                  <span className="text-emerald-100/70">{t("footer.addr")}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="globe" className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                  <a
                    href="https://www.muhdin.web.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-100/70 transition-colors hover:text-gold"
                    dir="ltr"
                  >
                    www.muhdin.web.id
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Audit 2026 — strip keberlanjutan (pengganti klaim "gratis selamanya") + disclaimer kepatuhan */}
          <div className="mt-12 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-center">
            <p className="inline-flex flex-wrap items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-gold sm:text-sm">
              <Icon name="check-circle-2" className="h-4 w-4 shrink-0" aria-hidden />
              {t("footer.freeBadge")}
            </p>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 text-xs leading-relaxed text-emerald-100/75">
              <Icon name="scale" className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              {t("footer.complianceNote")}
            </p>
          </div>

          {/* 5 — Signature panel digiman.id */}
          <SignaturePanel />

          {/* 6 — Bar kepercayaan */}
          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {TRUST_BADGES.map(([icon, key]) => (
              <div
                key={key}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] font-semibold text-emerald-100/80 transition-colors hover:border-gold/30 hover:text-white sm:text-xs"
              >
                <Icon name={icon} className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate">{t(`footer.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7 — Bar bawah */}
      <div className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mb-4 flex items-center justify-between gap-3">
            {/* Task 33/45 — tautan legal (kini i18n ×3) */}
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs"
            >
              {LEGAL_LINKS.map(([path, key]) => (
                <button
                  key={path}
                  onClick={() => go(path)}
                  className="text-emerald-100/60 outline-none transition-colors hover:text-gold focus-visible:text-gold"
                >
                  {t(`footer.${key}`)}
                </button>
              ))}
            </nav>
            <BackToTop label={t("footer.backTop")} />
          </div>
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-emerald-100/60 sm:flex-row">
            <p className="text-center sm:text-start">
              {t("footer.copyright", { year: new Date().getFullYear(), brand: BRAND.fullName })}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={DIGIMAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/20"
              >
                <Icon name="sparkles" className="h-3 w-3" aria-hidden />
                {t("footer.credit")}{" "}
                <span dir="ltr" className="font-extrabold">
                  digiman.id
                </span>
              </a>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-emerald-100/70">
                <Icon name="map-pin" className="h-3 w-3 text-gold" aria-hidden />
                {t("footer.madeIn")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
