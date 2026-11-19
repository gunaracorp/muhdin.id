"use client";

/* Task 33-b — Rebuild homepage MUHDIN INDONESIA.
   Task 35 — Sinkron manifesto: hero 4 CTA, "SIAPA YANG BISA BERGABUNG?" (12),
   Verified 3 CTA + legal bold, MUHDIN+MHUTU, One Record, Supply Passport,
   Academy 8 program, Control Tower, finale "Powered by MHUTU Global Sistem".
   SPA hash-routing publik; animasi via Reveal/Stagger + CSS murni di
   indonesia.css (reduced-motion aman). Tanpa API fetch kecuali news strip. */
import "@/components/site/indonesia.css";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading, Stagger, StaggerItem, CountUp } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND } from "@/lib/constants";
import { PromoSlotLine, PromoSlotPill } from "@/components/site/slot-counter"; // Task 44 — counter kuota live
import {
  HERO_FLOW,
  PILLARS,
  JOIN_CATEGORIES,
  ONBOARDING_STEPS,
  NETWORK_NODES,
  MEMBERSHIP_TIERS,
  MHUTU_ROLES,
  MHUTU_DOMAINS,
  SUPPLY_PASSPORT_FIELDS,
  CONTROL_TOWER_ITEMS,
  ACADEMY_TOPICS,
} from "@/lib/indonesia";
import { useT, formatDateL10n } from "@/lib/i18n";
import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------- Pemetaan konstanta indonesia.ts → ikon & key kamus ---------- */

const FLOW_META: Record<string, { icon: string; key: string }> = {
  INDONESIA: { icon: "map-pin", key: "indonesia" },
  MUHDIN: { icon: "hexagon", key: "muhdin" },
  PPIU_PIHK: { icon: "plane-takeoff", key: "ppiuPihk" },
  SAUDI: { icon: "building-2", key: "saudi" },
  JAMAAH: { icon: "heart-handshake", key: "jamaah" },
};

const PILLAR_META: Record<string, { icon: string; key: string }> = {
  CONNECT: { icon: "network", key: "connect" },
  VERIFY: { icon: "shield-check", key: "verify" },
  COLLABORATE: { icon: "handshake", key: "collaborate" },
  INTEGRATE: { icon: "workflow", key: "integrate" },
};

const JOIN_KEY: Record<string, string> = {
  PPIU: "ppiu",
  PIHK: "pihk",
  KBIHU: "kbihu",
  SAUDI_PROVIDER: "saudiProvider",
  HOTEL: "hotel",
  TRANSPORT: "transport",
  TICKETING: "ticketing",
  VISA_DOC: "visaDoc",
  HEALTH_INSURANCE: "healthInsurance",
  PROFESSIONAL: "professional",
  TECHNOLOGY: "technology",
  STRATEGIC_PARTNER: "strategicPartner",
};

const MHUTU_ROLE_KEY: Record<string, string> = {
  MUHDIN: "muhdin",
  MHUTU: "mhutu",
  AROFAH: "arofah",
  PPIU_PIHK: "ppiuPihk",
  SAUDI_PROVIDER: "saudiProvider",
  JAMAAH: "jamaah",
};

const MHUTU_DOMAIN_KEY: Record<string, string> = {
  IDENTITY: "identity",
  ORGANIZATION: "organization",
  MEMBERSHIP: "membership",
  VERIFICATION: "verification",
  PROVIDER: "provider",
  PACKAGE: "package",
  BOOKING: "booking",
  JAMAAH: "jamaah",
  DOCUMENTS: "documents",
  JOURNEY: "journey",
  CONTRACTS: "contracts",
  PAYMENTS: "payments",
  COMPLAINT: "complaint",
  AUDIT: "audit",
  JOURNEY_RECORD: "journeyRecord",
};

const SUPPLY_FIELD_KEY: Record<string, string> = {
  IDENTITY: "identity",
  SERVICE_CATEGORIES: "serviceCategories",
  CAPACITY: "capacity",
  DOCUMENTS: "documents",
  VERIFICATION: "verification",
  PARTNERSHIP: "partnership",
};

const TOWER_KEY: Record<string, string> = {
  MEMBERS: "members",
  VERIFICATION: "verification",
  PROVIDER: "provider",
  SUPPLY: "supply",
  JAMAAH: "jamaah",
  JOURNEY: "journey",
  DOCUMENTS: "documents",
  CONTRACTS: "contracts",
  COMPLAINT: "complaint",
  READINESS: "readiness",
  ALERTS: "alerts",
};

const STEP_META: Record<string, { icon: string; key: string }> = {
  REGISTER: { icon: "user-plus", key: "register" },
  COMPLETE_PROFILE: { icon: "clipboard-list", key: "completeProfile" },
  DOCUMENT_REVIEW: { icon: "file-text", key: "documentReview" },
  VERIFICATION: { icon: "shield-check", key: "verification" },
  MUHDIN_ID: { icon: "fingerprint", key: "muhdinId" },
  CONNECT: { icon: "network", key: "connect" },
  COLLABORATE: { icon: "handshake", key: "collaborate" },
};

const NODE_META: Record<string, string> = {
  PPIU: "plane-takeoff",
  PIHK: "landmark",
  KBIHU: "users",
  SUPPLIER: "boxes",
  SAUDI: "building-2",
  PROFESSIONAL: "graduation-cap",
  TECHNOLOGY: "brain-circuit",
  PARTNER: "handshake",
  JAMAAH: "heart-handshake",
};

const NODE_KEY: Record<string, string> = {
  PPIU: "ppiu",
  PIHK: "pihk",
  KBIHU: "kbihu",
  SUPPLIER: "supplier",
  SAUDI: "saudi",
  PROFESSIONAL: "professional",
  TECHNOLOGY: "technology",
  PARTNER: "partner",
  JAMAAH: "jamaah",
};

const TIER_KEY: Record<string, string> = {
  INDIVIDUAL: "individual",
  PROFESSIONAL: "professional",
  ORGANIZATION: "organization",
  PPIU_PIHK: "ppiuPihk",
  STRATEGIC_PARTNER: "strategicPartner",
};

const TOPIC_META: Record<string, { icon: string; key: string }> = {
  PPIU_ACADEMY: { icon: "plane-takeoff", key: "ppiu" },
  PIHK_ACADEMY: { icon: "landmark", key: "pihk" },
  SAUDI_OPERATIONS: { icon: "building-2", key: "saudiOps" },
  TOUR_LEADER: { icon: "compass", key: "tourLeader" },
  MUTAWWIF: { icon: "tent-tree", key: "mutawwif" },
  DIGITAL_HAJJ: { icon: "brain-circuit", key: "digitalHajj" },
  COMPLIANCE: { icon: "scale", key: "compliance" },
  MHUTU_ACADEMY: { icon: "cpu", key: "mhutu" },
};

const NOT_KEYS = ["govt", "accredit", "departure", "visa", "transaction"] as const;

/* Posisi radial 9 node jaringan (dihitung sekali, aman SSR). */
const NODE_POS = NETWORK_NODES.map((code, i) => {
  const angle = (i / NETWORK_NODES.length) * Math.PI * 2 - Math.PI / 2;
  return { code, x: 50 + 41 * Math.cos(angle), y: 50 + 39 * Math.sin(angle) };
});

/* ---------- Hook ringan: viewport sekali (pemicu kelas .is-inview) ---------- */
function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Fallback env tanpa IO: tampilkan animasi via rAF (hindari setState sinkron).
      const raf = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "-40px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

/* Task 46 — Brand promise DIPERBESAR (permintaan owner): kini tampil sebagai
   pernyataan headline dalam frame emas bercahaya + teks gradasi emas berkilau
   (text-gold-gradient) — bukan lagi pill 11px. Versi compact utk Final CTA.
   Catatan RTL: letter-spacing dinonaktifkan di rtl (rtl:tracking-normal) agar
   huruf Arab tetap tersambung. */
function BrandPromise({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  return (
    <p className="mx-auto mt-6 max-w-4xl rounded-2xl border border-gold/50 bg-gold/10 px-4 py-4 text-center shadow-[0_0_55px_-12px_rgba(212,175,55,0.5)] sm:px-8 sm:py-5">
      <span
        className={cn(
          "text-gold-gradient block font-black uppercase leading-[1.2] tracking-[0.05em] rtl:tracking-normal",
          compact ? "text-lg sm:text-2xl lg:text-3xl" : "text-lg sm:text-3xl lg:text-4xl"
        )}
      >
        {t("nusHome.hero.promise")}
      </span>
    </p>
  );
}

/* ================= S01 — HERO ================= */
function HeroSection() {
  const { t } = useT();
  const ctas = [
    { key: "ctaPrimary", to: "daftar", primary: true },
    { key: "ctaPartner", to: "daftar", primary: false },
    { key: "ctaProvider", to: "daftar", primary: false },
    { key: "ctaVerified", to: "anggota/verifikasi", primary: false },
  ] as const;
  return (
    <section
      aria-label={t("nusHome.aria.hero")}
      className="relative overflow-hidden bg-gradient-to-br from-forest-deep via-forest-deep to-forest"
    >
      {/* Latar foto Kaaba + overlay forest gelap → transparan (gradient jadi fallback) */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-kaaba.jpg"
          alt={t("nusHome.hero.imgAlt")}
          className="nus-kenburns h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/95 via-forest-deep/70 to-forest-deep/90" aria-hidden />
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <Reveal>
          <Badge className="border border-gold/40 bg-gold/15 px-4 py-1.5 text-[10px] font-bold tracking-[0.25em] text-gold-soft sm:text-xs">
            {BRAND.positioning.toUpperCase()}
          </Badge>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {BRAND.fullName}
          </h1>
        </Reveal>

        <Reveal delay={0.14}>
          <p className="mt-4 text-base font-semibold italic text-gold sm:text-lg">
            {BRAND.taglineId}
          </p>
        </Reveal>

        {/* Task 35-b/46 — Branding utama DIPERBESAR: EKOSISTEM UMROH HAJI DIGITAL TERMURAH BERGARANSI */}
        <Reveal delay={0.17}>
          <BrandPromise />
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-emerald-100/85 sm:text-base">
            {t("nusHome.hero.subtitle")}
          </p>
        </Reveal>

        {/* Task 35 — 4 CTA sesuai manifesto */}
        <Reveal delay={0.26}>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {ctas.map(({ key, to, primary }) => (
              <Button
                key={key}
                size="lg"
                onClick={() => navigate(to)}
                className={cn(
                  "h-12 px-6 text-xs font-extrabold tracking-widest sm:text-sm",
                  primary
                    ? "bg-gold text-forest-deep hover:bg-gold-soft"
                    : "border-gold/50 bg-white/5 text-white hover:border-gold hover:bg-white/10 hover:text-gold"
                )}
              >
                {t(`nusHome.hero.${key}`)}
              </Button>
            ))}
          </div>
        </Reveal>

        {/* Alur ekosistem animasi: 5 node + konektor "pulse mengalir" */}
        {/* Task 36 — freeNote hero · Task 40 — highlighter lime ala sgl.web.id */}
        <Reveal delay={0.3}>
          <p className="mt-5 inline-flex -rotate-1 items-center gap-1.5 rounded-lg bg-lime-300 px-3 py-1.5 text-xs font-extrabold text-forest-deep shadow-[0_6px_18px_-6px_oklch(0.9_0.19_130/0.6)]">
            <Icon name="check-circle-2" className="h-4 w-4" aria-hidden />
            {t("nusHome.hero.freeNote")}
          </p>
        </Reveal>

        {/* Task 44→52 — penghitung pendaftar GRATIS live (naik tiap pendaftar) */}
        <Reveal delay={0.34}>
          <div className="mt-3 flex justify-center">
            <PromoSlotPill />
          </div>
        </Reveal>

        <div className="mt-14 sm:mt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft/80">
            {t("nusHome.hero.flowTitle")}
          </p>
          <div className="mx-auto mt-5 flex max-w-3xl flex-col items-center gap-1 md:flex-row md:justify-between md:gap-0">
            {HERO_FLOW.map((code, i) => {
              const meta = FLOW_META[code];
              const isHub = code === "MUHDIN";
              return (
                <Fragment key={code}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "nus-float flex h-14 w-14 items-center justify-center border backdrop-blur-sm sm:h-16 sm:w-16",
                        isHub
                          ? "nus-glow rounded-full border-gold/60 bg-gold/15 text-gold"
                          : "rounded-2xl border-white/15 bg-white/5 text-emerald-100"
                      )}
                      style={{ animationDelay: `${i * 0.4}s` }}
                    >
                      <Icon name={meta.icon} className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/80 sm:text-[11px]">
                      {t(`nusHome.hero.flow.${meta.key}`)}
                    </span>
                  </div>
                  {i < HERO_FLOW.length - 1 && (
                    <span
                      aria-hidden
                      className="nus-connector block h-8 w-[2px] shrink-0 md:h-[2px] md:w-12 lg:w-16"
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= S02 — THE IDEA ================= */
function IdeaSection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.idea")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusHome.idea.eyebrow")}
          title={t("nusHome.idea.title")}
          subtitle={t("nusHome.idea.sub")}
        />
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {PILLARS.map((code) => {
            const meta = PILLAR_META[code];
            return (
              <StaggerItem key={code} className="h-full">
                <div className="nus-pillar group h-full rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-xl">
                  <div className="nus-pillar-icon flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gold/15 group-hover:text-gold-deep">
                    <Icon name={meta.icon} className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-foreground">
                    {t(`nusHome.idea.pillars.${meta.key}.label`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`nusHome.idea.pillars.${meta.key}.desc`)}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* ================= S03 — MUHDIN VERIFIED ================= */
function VerifiedSection() {
  const { t } = useT();
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  return (
    <section
      aria-label={t("nusHome.aria.verified")}
      className="bg-mint/30 py-16 sm:py-24 dark:bg-muted/30"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusHome.verified.eyebrow")}
          title={t("nusHome.verified.title")}
        />
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Badge animasi: cincin pulse + centang stroke-draw */}
          <Reveal className="flex justify-center">
            <div ref={ref} className={cn("nus-verified flex flex-col items-center", inView && "is-inview")}>
              <div className="relative flex h-44 w-44 items-center justify-center">
                <span aria-hidden className="nus-ring absolute inset-0 rounded-full border-2 border-gold/50" />
                <span aria-hidden className="nus-ring nus-ring-2 absolute inset-0 rounded-full border-2 border-gold/30" />
                <div className="nus-glow flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft via-gold to-gold-deep shadow-xl">
                  <Icon name="shield-check" className="h-14 w-14 text-forest-deep" strokeWidth={1.6} />
                </div>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="absolute bottom-0 end-0 h-11 w-11 rounded-full bg-forest-deep p-2 shadow-lg"
                  fill="none"
                  stroke="oklch(0.84 0.09 90)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path className="nus-check-path" d="M4 12.5l5 5L20 7" />
                </svg>
              </div>
              <p className="mt-5 text-lg font-extrabold tracking-[0.18em] text-foreground">
                {t("nusHome.verified.badge")}
              </p>
            </div>
          </Reveal>

          {/* Penjelasan + garis legal tebal + 3 CTA + panel BUKAN + disclaimer */}
          <Reveal delay={0.1}>
            <div>
              <p className="text-base leading-relaxed text-foreground/85 sm:text-lg">
                {t("nusHome.verified.meaning")}
              </p>
              <p className="mt-4 border-s-4 border-destructive/60 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive sm:text-base">
                {t("nusHome.verified.legalBold")}
              </p>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <Button
                  onClick={() => navigate("anggota")}
                  className="h-11 bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
                >
                  <Icon name="search" className="me-2 h-4 w-4" />
                  {t("nusHome.verified.ctaOrg")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("verifikasi")}
                  className="h-11 border-primary px-5 font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon name="badge-check" className="me-2 h-4 w-4" />
                  {t("nusHome.verified.ctaProvider")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("anggota/verifikasi")}
                  className="h-11 px-5 font-bold text-primary hover:bg-primary/10"
                >
                  <Icon name="help-circle" className="me-2 h-4 w-4" />
                  {t("nusHome.verified.ctaLearn")}
                </Button>
              </div>

              <div className="mt-7 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
                <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-destructive">
                  <Icon name="ban" className="h-4 w-4" />
                  {t("nusHome.verified.notTitle")}
                </p>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {NOT_KEYS.map((k) => (
                    <li key={k} className="flex items-start gap-2 text-sm text-foreground/85">
                      <Icon name="ban" className="mt-0.5 h-4 w-4 shrink-0 text-destructive/80" />
                      {t(`nusHome.verified.not.${k}`)}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {t("nusHome.verified.disclaimer")}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= S04 — SIAPA YANG BISA BERGABUNG (12 kategori) ================= */
function JoinSection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.join")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusHome.join.eyebrow")}
          title={t("nusHome.join.title")}
          subtitle={t("nusHome.join.sub")}
        />
        <Stagger
          className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
          stagger={0.045}
        >
          {JOIN_CATEGORIES.map((cat) => {
            const key = JOIN_KEY[cat.code];
            return (
              <StaggerItem key={cat.code} className="h-full">
                <div className="group flex h-full flex-col rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-lg">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-gold/15 group-hover:text-gold-deep">
                    <Icon name={cat.icon} className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-3 text-xs font-extrabold uppercase tracking-wide text-foreground sm:text-sm">
                    {t(`nusHome.join.items.${key}.name`)}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`nusHome.join.items.${key}.desc`)}
                  </p>
                  <button
                    onClick={() => navigate("daftar")}
                    className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-gold-deep transition-colors hover:text-primary"
                    aria-label={`${t("nusHome.join.cta")} — ${t(`nusHome.join.items.${key}.name`)}`}
                  >
                    {t("nusHome.join.cta")}
                    <Icon name="arrow-right" className="h-3.5 w-3.5 icon-flip" />
                  </button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* ================= S05 — HOW IT WORKS (timeline 7 langkah) ================= */
function HowItWorksSection() {
  const { t } = useT();
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  return (
    <section
      aria-label={t("nusHome.aria.how")}
      className="bg-mint/30 py-16 sm:py-24 dark:bg-muted/30"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusHome.how.eyebrow")}
          title={t("nusHome.how.title")}
          subtitle={t("nusHome.how.sub")}
        />
        <div ref={ref} className={cn("relative mt-12 md:pb-12", inView && "nus-inview")}>
          {/* Garis dasar + garis progres (vertikal HP, horizontal desktop) */}
          <span
            aria-hidden
            className="absolute bottom-2 start-[27px] top-2 w-[2px] rounded-full bg-border md:bottom-auto md:start-0 md:top-7 md:h-[2px] md:w-full"
          />
          <span
            aria-hidden
            className="nus-vprogress absolute bottom-2 start-[27px] top-2 w-[2px] rounded-full bg-gradient-to-b from-gold via-gold-soft to-gold md:bottom-auto md:start-0 md:top-7 md:h-[2px] md:w-full md:bg-gradient-to-r md:from-gold md:via-gold-soft md:to-gold rtl:md:bg-gradient-to-l"
          />
          <ol className="relative space-y-10 md:grid md:grid-cols-7 md:gap-4 md:space-y-0">
            {ONBOARDING_STEPS.map((code, i) => {
              const meta = STEP_META[code];
              return (
                <li key={code} className="relative flex gap-4 md:flex-col md:items-center md:gap-0 md:text-center">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold/50 bg-card shadow-sm">
                    <span className="text-sm font-extrabold text-gold-deep">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className={cn("flex-1 pt-1 md:pt-5", i % 2 === 1 && "md:translate-y-8")}>
                    <div className="flex items-center gap-2 md:flex-col md:items-center md:gap-1.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary md:bg-gold/10 md:text-gold-deep">
                        <Icon name={meta.icon} className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <h3 className="text-sm font-bold text-foreground">
                        {t(`nusHome.how.steps.${meta.key}.title`)}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t(`nusHome.how.steps.${meta.key}.desc`)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ================= S06 — MUHDIN NETWORK ================= */
function NetworkSection() {
  const { t } = useT();
  return (
    <section
      aria-label={t("nusHome.aria.network")}
      className="relative overflow-hidden bg-forest-deep py-16 sm:py-24"
    >
      <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          light
          eyebrow={t("nusHome.network.eyebrow")}
          title={t("nusHome.network.title")}
          subtitle={t("nusHome.network.sub")}
        />

        {/* Desktop ≥md: radial absolut — node pusat + 9 node + garis SVG "data mengalir" */}
        <div className="relative mx-auto mt-14 hidden h-[440px] w-full max-w-2xl md:block lg:h-[480px]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {NODE_POS.map(({ code, x, y }) => (
              <line
                key={code}
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                className="nus-netline"
                stroke="oklch(0.72 0.135 85 / 0.55)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="nus-glow flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft via-gold to-gold-deep shadow-2xl">
              <Icon name="hexagon" className="h-10 w-10 text-forest-deep" strokeWidth={1.8} />
            </div>
            <p className="mt-2 text-center text-xs font-extrabold tracking-[0.25em] text-gold">
              {t("nusHome.network.center")}
            </p>
          </div>

          {NODE_POS.map(({ code, x, y }, i) => (
            <div
              key={code}
              className="absolute w-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className="nus-float mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-white/5 text-gold-soft backdrop-blur-sm"
                style={{ animationDelay: `${i * 0.45}s` }}
              >
                <Icon name={NODE_META[code]} className="h-6 w-6" strokeWidth={1.7} />
              </div>
              <p className="mt-1.5 text-center text-[10px] font-bold tracking-wider text-emerald-100/75">
                {t(`nusHome.network.nodes.${NODE_KEY[code]}`)}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile <md: MUHDIN di atas + grid 3x3 dengan garis konektor dekoratif */}
        <div className="mt-10 md:hidden">
          <div className="flex flex-col items-center">
            <div className="nus-glow flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft via-gold to-gold-deep shadow-xl">
              <Icon name="hexagon" className="h-9 w-9 text-forest-deep" strokeWidth={1.8} />
            </div>
            <p className="mt-2 text-xs font-extrabold tracking-[0.25em] text-gold">
              {t("nusHome.network.center")}
            </p>
            <span aria-hidden className="nus-connector mt-3 block h-8 w-[2px]" />
          </div>
          <div className="relative mt-3">
            <span
              aria-hidden
              className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/25 to-transparent"
            />
            <span
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-gold/25 to-transparent"
            />
            <ul className="relative grid grid-cols-3 gap-3">
              {NETWORK_NODES.map((code) => (
                <li
                  key={code}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center backdrop-blur-sm"
                >
                  <Icon name={NODE_META[code]} className="h-5 w-5 text-gold-soft" strokeWidth={1.7} />
                  <span className="text-[10px] font-bold tracking-wide text-emerald-100/75">
                    {t(`nusHome.network.nodes.${NODE_KEY[code]}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= S07 — FOUNDING ECOSYSTEM 2026 ================= */
function FoundingSection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.founding")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/50 bg-gradient-to-br from-forest-deep via-forest-deep to-forest p-8 text-center shadow-[0_0_80px_-20px_oklch(0.72_0.135_85/0.45)] sm:p-14">
            <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
            <div className="relative">
              <Badge className="border border-gold/40 bg-gold/15 px-4 py-1.5 text-[10px] font-bold tracking-[0.3em] text-gold-soft sm:text-xs">
                {t("nusHome.founding.badge")}
              </Badge>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {t("nusHome.founding.title")}
              </h2>
              <div className="gold-divider mx-auto mt-6 w-40" aria-hidden />
              <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-emerald-100/85 sm:text-base">
                {t("nusHome.founding.message")}
              </p>
              <Button
                size="lg"
                onClick={() => navigate("daftar")}
                className="mt-8 h-12 bg-gold px-8 text-sm font-extrabold tracking-widest text-forest-deep hover:bg-gold-soft"
              >
                {t("nusHome.founding.cta")}
                <Icon name="arrow-right" className="ms-2 h-4 w-4 icon-flip" />
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S08 — MEMBERSHIP ================= */
function MembershipSection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.membership")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusHome.membership.eyebrow")}
          title={t("nusHome.membership.title")}
          subtitle={t("nusHome.membership.sub")}
        />
        <Stagger
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          stagger={0.07}
        >
          {MEMBERSHIP_TIERS.map((tier) => {
            const key = TIER_KEY[tier.code];
            const popular = tier.code === "PPIU_PIHK";
            return (
              <StaggerItem key={tier.code} className="h-full">
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl",
                    popular ? "border-gold shadow-[0_0_30px_-10px_oklch(0.72_0.135_85/0.5)] ring-2 ring-gold/60" : "hover:border-gold/40"
                  )}
                >
                  {popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap border-none bg-gold px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-forest-deep">
                      {t("nusHome.membership.popular")}
                    </Badge>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={tier.icon} className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold uppercase tracking-wide text-foreground">
                    {t(`nusHome.membership.tiers.${key}`)}
                  </h3>
                  <p className="mt-2">
                    <span className="text-2xl font-extrabold tracking-tight text-foreground">
                      {tier.price === "BY_AGREEMENT"
                        ? t("nusHome.membership.byAgreement")
                        : t(`nusHome.membership.prices.${key}`)}
                    </span>
                    {tier.period && (
                      <span className="ms-1 text-xs text-muted-foreground">
                        {t("nusHome.membership.perYear")}
                      </span>
                    )}
                  </p>
                  {tier.price !== "BY_AGREEMENT" && (
                    <p className="mt-1 text-[11px] font-semibold text-gold-deep">
                      {t("nusHome.membership.signupFee")}
                    </p>
                  )}
                  <ul className="mt-4 space-y-2 border-t pt-4">
                    {["benefit1", "benefit2", "benefit3"].map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Icon name="check-circle-2" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" />
                        {t(`nusHome.membership.${b}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Task 43→52 — strip DUA KEUNGGULAN di bawah grid tier */}
        <Reveal className="mt-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-gold/25 to-gold/15 p-4 text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground sm:text-sm">
              {t("nusHome.membership.freeStrip")}
            </p>
            <PromoSlotLine className="mt-2" />
          </div>
        </Reveal>

        {/* Footer wajib (ROLE 25) — klarifikasi iuran keanggotaan */}
        <Reveal className="mt-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-2xl border bg-card p-5 text-start sm:flex-row sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              {t("nusHome.membership.footer")}
            </p>
            <Button
              onClick={() => navigate("daftar")}
              className="shrink-0 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              {t("nusHome.membership.cta")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S09 — MUHDIN + MHUTU (TRUST MEETS TECHNOLOGY) ================= */
function MhutuSection() {
  const { t } = useT();
  return (
    <section
      aria-label={t("nusHome.aria.mhutu")}
      className="relative overflow-hidden bg-forest-deep py-16 sm:py-24"
    >
      <div className="absolute inset-0 bg-islamic-pattern opacity-70" aria-hidden />
      <div
        className="absolute end-0 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          light
          eyebrow={t("nusHome.mhutu.eyebrow")}
          title={t("nusHome.mhutu.title")}
          subtitle={t("nusHome.mhutu.sub")}
        />

        {/* 6 blok peran — identitas terpisah & tidak digabung */}
        <Stagger className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3" stagger={0.06}>
          {MHUTU_ROLES.map(({ code, icon }) => {
            const key = MHUTU_ROLE_KEY[code];
            const hub = code === "MUHDIN" || code === "MHUTU";
            return (
              <StaggerItem key={code} className="h-full">
                <div
                  className={cn(
                    "group flex h-full flex-col items-center rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1",
                    hub
                      ? "border-gold/60 bg-gold/10 shadow-[0_0_30px_-12px_oklch(0.72_0.135_85/0.6)]"
                      : "border-white/10 bg-white/5 hover:border-gold/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                      hub ? "bg-gold/20 text-gold" : "bg-white/10 text-gold-soft"
                    )}
                  >
                    <Icon name={icon} className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="mt-3 text-sm font-extrabold tracking-wide text-white">
                    {t(`nusHome.mhutu.roles.${key}.name`)}
                  </span>
                  <span
                    className={cn(
                      "mt-1 text-[10px] font-bold uppercase tracking-[0.2em]",
                      hub ? "text-gold" : "text-emerald-100/70"
                    )}
                  >
                    {t(`nusHome.mhutu.roles.${key}.role`)}
                  </span>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Task 41 — CTA arsitektur ekosistem lengkap */}
        <Reveal className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate("ekosistem-global")}
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-6 py-3 text-xs font-bold tracking-wide text-gold shadow transition hover:bg-gold/20"
          >
            <Icon name="network" className="h-4 w-4" strokeWidth={1.8} />
            {t("ecoGlobal.ctaEcoPage")}
          </button>
        </Reveal>

        {/* 15 domain yang dikelola MHUTU */}
        <Reveal className="mt-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-soft/80">
            {t("nusHome.mhutu.domainsTitle")}
          </p>
          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2">
            {MHUTU_DOMAINS.map((d) => (
              <span
                key={d}
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-emerald-100/85"
              >
                {t(`nusHome.mhutu.domains.${MHUTU_DOMAIN_KEY[d]}`)}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S10 — ONE PILGRIM. ONE JOURNEY. ONE RECORD. ================= */
function OneRecordSection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.oneRecord")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            <span className="block bg-gradient-to-r from-gold-deep via-gold to-gold-soft bg-clip-text text-transparent">
              {t("nusHome.oneRecord.l1")}
            </span>
            <span className="block bg-gradient-to-r from-gold-deep via-gold to-gold-soft bg-clip-text text-transparent">
              {t("nusHome.oneRecord.l2")}
            </span>
            <span className="block bg-gradient-to-r from-gold-deep via-gold to-gold-soft bg-clip-text text-transparent">
              {t("nusHome.oneRecord.l3")}
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-foreground/80 sm:text-base">
            {t("nusHome.oneRecord.body")}
          </p>
        </Reveal>
        <Reveal delay={0.14}>
          <div className="mt-7 space-y-2 text-sm font-semibold sm:text-base">
            <p className="flex items-center justify-center gap-2 text-muted-foreground">
              <Icon name="eye-off" className="h-4 w-4 shrink-0 text-gold-deep" />
              {t("nusHome.oneRecord.note1")}
            </p>
            <p className="flex items-center justify-center gap-2 text-foreground">
              <Icon name="check-circle-2" className="h-4 w-4 shrink-0 text-gold-deep" />
              {t("nusHome.oneRecord.note2")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S11 — MUHDIN SUPPLY PASSPORT ================= */
function SupplySection() {
  const { t } = useT();
  return (
    <section
      aria-label={t("nusHome.aria.supply")}
      className="bg-mint/30 py-16 sm:py-24 dark:bg-muted/30"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-card p-8 shadow-sm sm:p-12">
            <div className="absolute inset-0 bg-islamic-pattern-gold opacity-20" aria-hidden />
            <div className="relative">
              <SectionHeading
                eyebrow={t("nusHome.supply.eyebrow")}
                title={t("nusHome.supply.title")}
                subtitle={t("nusHome.supply.sub")}
              />
              <p className="mt-8 text-center text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
                {t("nusHome.supply.fieldsTitle")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SUPPLY_PASSPORT_FIELDS.map(({ code, icon }) => (
                  <div
                    key={code}
                    className="flex items-center gap-3 rounded-xl border bg-background/70 p-3.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold-deep">
                      <Icon name={icon} className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="text-xs font-bold leading-snug sm:text-sm">
                      {t(`nusHome.supply.fields.${SUPPLY_FIELD_KEY[code]}`)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-9 text-center">
                <p className="text-lg font-extrabold tracking-[0.14em] text-gold-deep sm:text-2xl">
                  {t("nusHome.supply.slogan")}
                </p>
                <div className="gold-divider mx-auto mt-4 w-40" aria-hidden />
                <Button
                  size="lg"
                  onClick={() => navigate("daftar")}
                  className="mt-6 h-12 bg-gold px-8 text-sm font-extrabold tracking-widest text-forest-deep hover:bg-gold-soft"
                >
                  {t("nusHome.supply.cta")}
                  <Icon name="arrow-right" className="ms-2 h-4 w-4 icon-flip" />
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S12 — ACADEMY (8 program) ================= */
function AcademySection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.academy")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusHome.academy.eyebrow")}
          title={t("nusHome.academy.title")}
          subtitle={t("nusHome.academy.sub")}
        />
        <Stagger className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4" stagger={0.05}>
          {ACADEMY_TOPICS.map((code) => {
            const meta = TOPIC_META[code];
            return (
              <StaggerItem key={code}>
                <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold-deep transition-colors group-hover:bg-gold/20">
                    <Icon name={meta.icon} className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="text-xs font-bold leading-snug text-foreground sm:text-sm">
                    {t(`nusHome.academy.topics.${meta.key}`)}
                  </span>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
        <Reveal className="mt-9 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("tutorial")}
            className="h-11 border-primary px-6 font-bold text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {t("nusHome.academy.cta")}
            <Icon name="arrow-right" className="ms-2 h-4 w-4 icon-flip" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S13 — MUHDIN CONTROL TOWER ================= */
function ControlTowerSection() {
  const { t } = useT();
  return (
    <section
      aria-label={t("nusHome.aria.controlTower")}
      className="bg-mint/30 py-16 sm:py-24 dark:bg-muted/30"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("nusHome.controlTower.eyebrow")}
          title={t("nusHome.controlTower.title")}
          subtitle={t("nusHome.controlTower.sub")}
        />
        <Stagger
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          stagger={0.045}
        >
          {CONTROL_TOWER_ITEMS.map(({ code, icon }, i) => (
            <StaggerItem key={code}>
              <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    code === "ALERTS"
                      ? "bg-destructive/10 text-destructive group-hover:bg-destructive/15"
                      : "bg-primary/10 text-primary group-hover:bg-gold/15 group-hover:text-gold-deep"
                  )}
                >
                  <Icon name={icon} className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="text-xs font-bold leading-snug text-foreground sm:text-sm">
                  <span className="me-1.5 text-[10px] font-extrabold text-gold-deep/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {t(`nusHome.controlTower.items.${TOWER_KEY[code]}`)}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-9 text-center">
          <p className="mx-auto flex max-w-2xl items-center justify-center gap-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <Icon name="radar" className="h-4 w-4 shrink-0 text-gold-deep" />
            {t("nusHome.controlTower.note")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S14 — PARTNERSHIP (3 CTA) ================= */
function PartnershipSection() {
  const { t } = useT();
  const ctas = [
    { key: "ctaJoin", primary: true },
    { key: "ctaPartner", primary: false },
    { key: "ctaProvider", primary: false },
  ] as const;
  return (
    <section
      aria-label={t("nusHome.aria.partnership")}
      className="relative overflow-hidden bg-forest-deep py-16 sm:py-24"
    >
      <div className="absolute inset-0 bg-islamic-pattern opacity-70" aria-hidden />
      <div
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <SectionHeading
          light
          eyebrow={t("nusHome.partnership.eyebrow")}
          title={t("nusHome.partnership.title")}
          subtitle={t("nusHome.partnership.sub")}
        />
        <Reveal className="mt-9">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            {ctas.map(({ key, primary }) => (
              <Button
                key={key}
                size="lg"
                onClick={() => navigate("daftar")}
                className={cn(
                  "h-12 px-7 text-xs font-extrabold tracking-widest sm:text-sm",
                  primary
                    ? "bg-gold text-forest-deep hover:bg-gold-soft"
                    : "border-white/30 bg-white/5 text-white hover:border-gold/60 hover:bg-white/10 hover:text-gold"
                )}
              >
                {t(`nusHome.partnership.${key}`)}
              </Button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= NEWS STRIP (sebelum S16) ================= */
function NewsSection() {
  const { t, locale } = useT();
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<Article[]>("/api/articles?limit=3")
      .then((data) => {
        if (alive) setArticles(data);
      })
      .catch(() => {
        if (alive) setArticles([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Gagal / kosong → section hilang dengan anggun */
  if (articles !== null && articles.length === 0) return null;

  return (
    <section aria-label={t("nusHome.aria.news")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("nusHome.news.eyebrow")} title={t("nusHome.news.title")} />
        {articles === null ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border bg-card">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="space-y-2 p-5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Stagger className="mt-10 grid gap-5 md:grid-cols-3" stagger={0.09}>
            {articles.map((a) => (
              <StaggerItem key={a.id} className="h-full">
                <button
                  onClick={() => navigate(`berita/${a.slug}`)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card text-start shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={a.cover || "/images/hero-kaaba.jpg"}
                      alt={a.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge className="absolute start-3 top-3 border-none bg-forest-deep/90 text-gold-soft">
                      {a.category}
                    </Badge>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon name="calendar" className="h-3.5 w-3.5" />
                      {formatDateL10n(a.createdAt, locale)}
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-bold leading-snug transition-colors group-hover:text-primary">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-gold-deep">
                      {t("nusHome.news.readMore")}
                      <Icon name="arrow-right" className="h-3.5 w-3.5 icon-flip" />
                    </span>
                  </div>
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}

/* ================= S16 — FINAL CTA + POWERED BY MHUTU ================= */
function FinalCtaSection() {
  const { t } = useT();
  const buttons = [
    { label: "b1", primary: true },
    { label: "b2", primary: false },
    { label: "b3", primary: false },
    { label: "b4", primary: false },
  ] as const;
  return (
    <section
      aria-label={t("nusHome.aria.final")}
      className="relative overflow-hidden bg-gradient-to-b from-forest-deep to-forest py-16 sm:py-24"
    >
      <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft">
            {t("nusHome.final.sub")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {t("nusHome.final.title")}
          </h2>
          <p className="mt-4 text-sm font-semibold italic text-gold sm:text-base">
            {t("nusHome.final.tagline")}
          </p>
          {/* Task 46 — promise DIPERBESAR (versi compact utk finale) */}
          <BrandPromise compact />
        </Reveal>
        <Reveal delay={0.14}>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3">
            {buttons.map(({ label, primary }) => (
              <Button
                key={label}
                size="lg"
                onClick={() => navigate("daftar")}
                className={cn(
                  "h-12 px-4 text-xs font-extrabold tracking-wider sm:text-sm",
                  primary
                    ? "bg-gold text-forest-deep hover:bg-gold-soft"
                    : "border-white/30 bg-white/5 text-white hover:border-gold/60 hover:bg-white/10 hover:text-gold"
                )}
              >
                {t(`nusHome.final.${label}`)}
              </Button>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.17}>
          <p className="mt-8 text-xs font-bold text-gold-soft">
            {t("nusHome.final.freeNote")}
          </p>
          <p className="mt-8 text-xs font-semibold tracking-wide text-emerald-100/60">
            {t("nusHome.final.poweredBy")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S02-a — VALUES (Task 38, ala Nusuk “عزّنا برؤيتنا”) ================= */
const VALUES: ReadonlyArray<{ key: string; icon: string }> = [
  { key: "v1", icon: "shield-check" },
  { key: "v2", icon: "heart-handshake" },
  { key: "v3", icon: "target" },
  { key: "v4", icon: "users" },
  { key: "v5", icon: "sparkles" },
  { key: "v6", icon: "scale" },
];

function ValuesSection() {
  const { t } = useT();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % VALUES.length), 4500);
    return () => clearInterval(id);
  }, [paused]);

  const current = VALUES[active];
  return (
    <section
      aria-label={t("nusHome.aria.values")}
      className="relative overflow-hidden bg-gradient-to-b from-forest-deep via-forest to-forest-deep py-16 sm:py-24"
    >
      <div className="absolute inset-0 bg-islamic-pattern-gold opacity-25" aria-hidden />
      <div
        className="relative mx-auto max-w-6xl px-4 sm:px-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <SectionHeading light eyebrow={t("nusHome.values.eyebrow")} title={t("nusHome.values.title")} subtitle={t("nusHome.values.sub")} />

        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* Kartu nilai aktif — transisi fade/slide ala carousel Nusuk */}
          <div className="relative min-h-[220px] overflow-hidden rounded-3xl border border-gold/30 bg-white/5 p-8 backdrop-blur-sm sm:min-h-[260px] sm:p-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex h-full flex-col"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.25em] text-gold-soft">
                    {String(active + 1).padStart(2, "0")} / {String(VALUES.length).padStart(2, "0")}
                  </span>
                  <span className="nus-flex flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold/15 text-gold" aria-hidden>
                    <Icon name={current.icon} className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                </div>
                <h3 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {t(`nusHome.values.${current.key}Label`)}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100/85 sm:text-base">
                  {t(`nusHome.values.${current.key}Text`)}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Rail pemilih nilai — chip vertikal ala pilihan “nilai” Nusuk */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2" role="tablist" aria-label={t("nusHome.aria.values")}>
            {VALUES.map((v, i) => (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  "flex min-h-[44px] items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-extrabold uppercase tracking-wider transition-all",
                  i === active
                    ? "border-gold bg-gold text-forest-deep shadow-[0_8px_24px_-10px_oklch(0.72_0.135_85/0.8)]"
                    : "border-white/15 bg-white/5 text-emerald-100/80 hover:border-gold/50 hover:text-gold"
                )}
              >
                <Icon name={v.icon} className="h-4 w-4 shrink-0" aria-hidden />
                {t(`nusHome.values.${v.key}Label`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= S02-b — LIVE STRIP MAKKAH (Task 38, ala widget Nusuk) ================= */
const TICKER_KEYS = ["ticker1", "ticker2", "ticker3", "ticker4", "ticker5"] as const;

function LiveStripSection() {
  const { t, locale } = useT();
  // Aman SSR: server & render awal keduanya null ("--:--"), baru berdetak setelah mount.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Via rAF (bukan setState sinkron di body effect) agar tidak memicu
    // cascading render — sekaligus tetap hidup segera setelah paint pertama.
    const raf = requestAnimationFrame(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  const clockText = useMemo(() => {
    if (!now) return null;
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
    } catch {
      return null;
    }
  }, [now, locale]);

  const hijriText = useMemo(() => {
    if (!now) return null;
    const tags = [
      locale === "ar" ? "ar-SA-u-ca-islamic-umalqura" : locale === "id" ? "id-u-ca-islamic-umalqura" : "en-u-ca-islamic-umalqura",
      "en-u-ca-islamic-umalqura",
    ];
    for (const tag of tags) {
      try {
        return new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric" }).format(now);
      } catch {
        /* coba tag berikutnya */
      }
    }
    return null;
  }, [now, locale]);

  return (
    <section
      aria-label={t("nusHome.aria.live")}
      className="relative overflow-hidden border-b border-gold/20 bg-gradient-to-r from-forest-deep via-forest to-forest-deep"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        {/* Jam Makkah live + tanggal Hijriah */}
        <div className="flex shrink-0 items-center gap-4">
          <span className="inline-flex items-center gap-2" dir="ltr">
            <span className="nus-live-dot h-2 w-2 rounded-full bg-gold" aria-hidden />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-soft">
              {t("nusHome.live.clockLabel")}
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-white">
              {clockText ?? "--:--"}
            </span>
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex" dir="auto">
            <Icon name="moon-star" className="h-4 w-4 text-gold" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-soft">{t("nusHome.live.hijriLabel")}</span>
            <span className="text-xs font-semibold text-emerald-100">{hijriText ?? "—"}</span>
          </span>
        </div>

        {/* Ticker mutiara hikmah — loop mulus, berhenti saat hover */}
        <div className="relative min-w-0 flex-1 overflow-hidden" aria-label={t("nusHome.live.tickerLabel")}>
          <div className="nus-ticker-track items-center gap-10">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center gap-10" aria-hidden={dup === 1}>
                {TICKER_KEYS.map((k) => (
                  <span key={k} className="flex items-center gap-2 whitespace-nowrap text-xs text-emerald-100/90" dir="auto">
                    <Icon name="sparkles" className="h-3.5 w-3.5 shrink-0 text-gold/80" aria-hidden />
                    {t(`nusHome.live.${k}`)}
                  </span>
                ))}
              </div>
            ))}
          </div>
          {/* Tepi pudar agar ticker terasa menghilang ke dua sisi */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-0 w-12"
            style={{ background: "linear-gradient(to right, #07281B, transparent)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 end-0 w-12"
            style={{ background: "linear-gradient(to left, #07281B, transparent)" }}
          />
        </div>
      </div>
    </section>
  );
}

/* ================= S01-d — JOURNEY CARDS (Task 38, ala “رحلتك مع نسك”) ================= */
const JOURNEYS = [
  { img: "/images/journey-hajj.png", icon: "tent-tree", titleKey: "hajjTitle", descKey: "hajjDesc", ctaKey: "hajjCta", altKey: "hajjAlt", to: "alur" },
  { img: "/images/journey-umrah.png", icon: "moon-star", titleKey: "umrahTitle", descKey: "umrahDesc", ctaKey: "umrahCta", altKey: "umrahAlt", to: "nusuk" },
  { img: "/images/journey-rawdah.png", icon: "landmark", titleKey: "rawdahTitle", descKey: "rawdahDesc", ctaKey: "rawdahCta", altKey: "rawdahAlt", to: "nusuk" },
] as const;

function JourneySection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.journey")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("nusHome.journey.eyebrow")} title={t("nusHome.journey.title")} subtitle={t("nusHome.journey.sub")} />
        <Stagger className="mt-10 grid gap-5 md:grid-cols-3" stagger={0.1}>
          {JOURNEYS.map((j) => (
            <StaggerItem key={j.titleKey}>
              <button
                type="button"
                onClick={() => navigate(j.to)}
                className="group block h-full w-full overflow-hidden rounded-3xl border border-border bg-card text-start shadow-sm transition-all hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden sm:h-56">
                  <img
                    src={j.img}
                    alt={t(`nusHome.journey.${j.altKey}`)}
                    loading="lazy"
                    className="nus-zoomimg h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/15 to-transparent" aria-hidden />
                  <span className="absolute bottom-3 start-4 inline-flex items-center gap-2 text-sm font-extrabold text-white">
                    <Icon name={j.icon} className="h-4 w-4 text-gold" aria-hidden />
                    {t(`nusHome.journey.${j.titleKey}`)}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {t(`nusHome.journey.${j.descKey}`)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-gold-deep transition-colors group-hover:text-gold">
                    {t(`nusHome.journey.${j.ctaKey}`)}
                    <Icon name="chevron-right" className="icon-flip h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ================= S02-c — EVERYTHING (Task 38, ala “كل مايحتاجه ضيف الرحمن”) ================= */
const EVERYTHING = [
  { key: "t1", icon: "tent-tree" },
  { key: "t2", icon: "moon-star" },
  { key: "t3", icon: "landmark" },
  { key: "t4", icon: "map" },
  { key: "t5", icon: "book-open" },
  { key: "t6", icon: "users" },
] as const;

function EverythingSection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.everything")} className="relative overflow-hidden bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("nusHome.everything.eyebrow")} title={t("nusHome.everything.title")} subtitle={t("nusHome.everything.sub")} />
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {EVERYTHING.map((e) => (
            <StaggerItem key={e.key}>
              <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold-deep transition-colors group-hover:bg-gold group-hover:text-forest-deep">
                  <Icon name={e.icon} className="h-6 w-6" strokeWidth={1.7} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-extrabold tracking-tight text-foreground">
                  {t(`nusHome.everything.${e.key}Title`)}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t(`nusHome.everything.${e.key}Desc`)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal delay={0.15} className="mt-8 text-center">
          <Button
            size="lg"
            onClick={() => navigate("daftar")}
            className="h-13 bg-gold px-10 text-sm font-extrabold tracking-widest text-forest-deep hover:bg-gold-soft"
          >
            {t("nusHome.everything.cta")}
            <Icon name="arrow-right" className="icon-flip ms-2 h-5 w-5" aria-hidden />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= S05-b — PERMITS (Task 38, ala “استكشف جميع خدماتنا”) ================= */
const PERMITS = [
  { key: "p1", icon: "qr-code", detailTo: "nusuk" },
  { key: "p2", icon: "calendar", detailTo: "nusuk" },
  { key: "p3", icon: "fingerprint", detailTo: "anggota/verifikasi" },
] as const;

function PermitsSection() {
  const { t } = useT();
  return (
    <section aria-label={t("nusHome.aria.permits")} className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("nusHome.permits.eyebrow")} title={t("nusHome.permits.title")} subtitle={t("nusHome.permits.sub")} />
        <Stagger className="mt-10 grid gap-5 md:grid-cols-3" stagger={0.1}>
          {PERMITS.map((p) => (
            <StaggerItem key={p.key}>
              <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-gold/60 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold-deep">
                    <Icon name={p.icon} className="h-6 w-6" strokeWidth={1.7} aria-hidden />
                  </span>
                  <Badge className="border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    <span className="nus-live-dot me-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    {t(`nusHome.permits.${p.key}Badge`)}
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight text-foreground">
                  {t(`nusHome.permits.${p.key}Title`)}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t(`nusHome.permits.${p.key}Desc`)}
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(p.detailTo)}
                    className="h-10 border-border px-4 text-xs font-bold"
                  >
                    {t("nusHome.permits.detail")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("daftar")}
                    className="h-10 bg-gold px-4 text-xs font-extrabold tracking-wide text-forest-deep hover:bg-gold-soft"
                  >
                    {t("nusHome.permits.start")}
                    <Icon name="chevron-right" className="icon-flip ms-1 h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ================= S06-b — HARAMAIN (Task 38, ala “اكتشف جمال الحرمين”) ================= */
const HARAMAIN_PLACES = [
  "Masjidil Haram", "Ka'bah", "Maqam Ibrahim", "Hijr Ismail", "Shafa & Marwah",
  "Gua Hira", "Jabal Thaur", "Mina", "Padang Arafah", "Muzdalifah", "Jamarat",
  "Masjid Aisyah", "Jabal Nur", "Makkah Clock Tower", "Jannatul Mualla", "Masjid Jin",
  "Masjid Nabawi", "Raudhah", "Kubah Hijau", "Jabal Uhud", "Masjid Quba",
  "Masjid Qiblatain", "Masjid Jumu'ah", "Jannatul Baqi", "Masjid Ghamamah",
  "Pasar Kurma", "Museum Uhud", "Dar Al Madinah",
];

function HaramainSection() {
  const { t } = useT();
  const cities = [
    { img: "/images/city-makkah.png", nameKey: "makkahName", latinKey: "makkahLatin", descKey: "makkahDesc" },
    { img: "/images/city-madinah.png", nameKey: "madinahName", latinKey: "madinahLatin", descKey: "madinahDesc" },
  ] as const;
  return (
    <section aria-label={t("nusHome.aria.haramain")} className="relative overflow-hidden bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("nusHome.haramain.eyebrow")} title={t("nusHome.haramain.title")} subtitle={t("nusHome.haramain.sub")} />

        <Stagger className="mt-10 grid gap-5 md:grid-cols-2" stagger={0.12}>
          {cities.map((c) => (
            <StaggerItem key={c.nameKey}>
              <div className="group relative h-72 overflow-hidden rounded-3xl border border-border shadow-sm sm:h-80">
                <img
                  src={c.img}
                  alt={t(`nusHome.haramain.${c.nameKey}`)}
                  loading="lazy"
                  className="nus-zoomimg h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/25 to-transparent" aria-hidden />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gold-soft">
                    {t(`nusHome.haramain.${c.latinKey}`)}
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {t(`nusHome.haramain.${c.nameKey}`)}
                  </h3>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
                    {t(`nusHome.haramain.${c.descKey}`)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("galeri")}
                    className="mt-4 h-10 border-white/40 bg-white/10 px-5 text-xs font-extrabold tracking-wide text-white backdrop-blur-sm hover:border-gold hover:bg-gold hover:text-forest-deep"
                  >
                    {t("nusHome.haramain.cta")}
                    <Icon name="chevron-right" className="icon-flip ms-1 h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Marquee 140+ tempat ikonik — loop mulus dua-dua, tepi pudar */}
      <Reveal className="mt-12">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          {t("nusHome.haramain.marqueeTitle")}
        </p>
      </Reveal>
      <div
        className="relative mt-6 overflow-hidden py-2"
        style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
      >
        <div className="nus-ticker-track items-center gap-3">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-3" aria-hidden={dup === 1}>
              {HARAMAIN_PLACES.map((place) => (
                <span
                  key={place}
                  dir="ltr"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground/80"
                >
                  <Icon name="map-pin" className="h-3.5 w-3.5 text-gold-deep" aria-hidden />
                  {place}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= S15-b — STATS (Task 38, ala “منجزات حققتها نسك”) ================= */
const MUHDIN_STATS = [
  { value: 514, suffix: "", key: "s1" },
  { value: 38, suffix: "", key: "s2" },
  { value: 13, suffix: "", key: "s3" },
  { value: 17, suffix: "", key: "s4" },
  { value: 100, suffix: "+", key: "s5" },
  { value: 3, suffix: "", key: "s6" },
] as const;

function StatsSection() {
  const { t, locale } = useT();
  return (
    <section
      aria-label={t("nusHome.aria.stats")}
      className="relative overflow-hidden bg-gradient-to-b from-forest-deep to-forest py-16 sm:py-20"
    >
      <div className="absolute inset-0 bg-islamic-pattern-gold opacity-25" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading light eyebrow={t("nusHome.stats.eyebrow")} title={t("nusHome.stats.title")} subtitle={t("nusHome.stats.sub")} />
        <Stagger className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-6" stagger={0.08}>
          {MUHDIN_STATS.map((s) => (
            <StaggerItem key={s.key} className="text-center">
              <p className="nus-shimmer-text text-4xl font-extrabold tracking-tight sm:text-5xl" dir="ltr">
                <CountUp value={s.value} suffix={s.suffix} locale={locale} />
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-emerald-100/75">
                {t(`nusHome.stats.${s.key}Label`)}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ================= S15-c — APP / PWA (Task 38, ala unduh aplikasi Nusuk) ================= */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function AppSection() {
  const { t } = useT();
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onInstall = async () => {
    if (installEvt) {
      try {
        await installEvt.prompt();
      } finally {
        setInstallEvt(null);
      }
    } else {
      toast({ title: t("nusHome.app.installHint") });
    }
  };

  const chips = [
    { key: "chip1", icon: "sparkles" },
    { key: "chip2", icon: "download" },
    { key: "chip3", icon: "shield-check" },
  ] as const;

  return (
    <section aria-label={t("nusHome.aria.app")} className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow={t("nusHome.app.eyebrow")} title={t("nusHome.app.title")} subtitle={t("nusHome.app.sub")} />
          <Reveal delay={0.12}>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={onInstall}
                className="h-13 bg-gold px-8 text-sm font-extrabold tracking-widest text-forest-deep hover:bg-gold-soft"
              >
                <Icon name="download" className="me-2 h-5 w-5" aria-hidden />
                {t("nusHome.app.installBtn")}
              </Button>
              {chips.map((c) => (
                <span key={c.key} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground/80">
                  <Icon name={c.icon} className="h-3.5 w-3.5 text-gold-deep" aria-hidden />
                  {t(`nusHome.app.${c.key}`)}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t("nusHome.app.installHint")}</p>
          </Reveal>
        </div>

        {/* Kartu QR — pintu masuk PWA, ala kartu unduh aplikasi Nusuk */}
        <Reveal delay={0.1}>
          <div className="relative mx-auto max-w-sm rounded-3xl bg-gradient-to-b from-forest-deep to-forest p-8 text-center shadow-xl">
            <div className="absolute inset-0 bg-islamic-pattern-gold opacity-25" aria-hidden />
            <div className="relative">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold/15 text-gold">
                <Icon name="smartphone" className="h-7 w-7" strokeWidth={1.6} aria-hidden />
              </div>
              <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4 shadow-lg">
                <img src="/images/qr-muhdin-web.png" alt={t("nusHome.app.qrAlt")} className="h-40 w-40" loading="lazy" />
              </div>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold tracking-widest text-gold-soft" dir="ltr">
                <Icon name="scan" className="h-4 w-4" aria-hidden />
                muhdin.web.id
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= HOME VIEW (dipakai muhdin-app.tsx) ================= */
export function HomeView() {
  return (
    <div>
      <HeroSection />
      {/* Task 38 — strip live ala Nusuk: jam Makkah + Hijriah + mutiara hikmah */}
      <LiveStripSection />
      {/* Task 38 — kartu perjalanan iman ala “رحلتك مع نسك” */}
      <JourneySection />
      <IdeaSection />
      {/* Task 38 — carousel nilai ala “عزّنا برؤيتنا” */}
      <ValuesSection />
      {/* Task 38 — semua kebutuhan tamu Allah ala “كل مايحتاجه ضيف الرحمن” */}
      <EverythingSection />
      <VerifiedSection />
      <JoinSection />
      <HowItWorksSection />
      {/* Task 38 — layanan instan ala “استكشف جميع خدماتنا” */}
      <PermitsSection />
      <NetworkSection />
      {/* Task 38 — jelajahi Haramain ala “اكتشف جمال الحرمين” + marquee tempat */}
      <HaramainSection />
      <FoundingSection />
      <MembershipSection />
      <MhutuSection />
      <OneRecordSection />
      <SupplySection />
      <AcademySection />
      <ControlTowerSection />
      <PartnershipSection />
      {/* Task 38 — pencapaian dalam angka ala “منجزات حققتها نسك” */}
      <StatsSection />
      <NewsSection />
      {/* Task 38 — unduh aplikasi PWA ala section aplikasi Nusuk */}
      <AppSection />
      <FinalCtaSection />
    </div>
  );
}
