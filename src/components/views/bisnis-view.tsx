"use client";

/**
 * v6.0 — Pusat Bisnis PPIU/PIHK/BPW (#/bisnis).
 * Ekosistem B2B hulu: Bursa Kursi antar penyelenggara, Kolam Muthowif,
 * Jaringan Vendor terverifikasi, dan Compliance Hub (skor kepatuhan publik).
 * Semua data nyata dari API publik — bukan mock.
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailHero, WaCtaButton } from "@/components/views/detail-shell";
import { LapakMitraSection } from "@/components/site/lapak-mitra";
import { cn } from "@/lib/utils";
import type { VendorItem, MuthowifItem, SeatListingItem } from "@/lib/types";

interface ComplianceSummaryMember {
  memberId: string;
  name: string;
  type: string;
  city: string;
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  verified: number;
  score: number;
}
interface ComplianceSummary {
  members: ComplianceSummaryMember[];
  totals: { docs: number; valid: number; expiring: number; expired: number; members: number };
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating ${rating.toFixed(1)} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          className={cn("h-3.5 w-3.5", i <= Math.round(rating) ? "text-gold" : "text-muted-foreground/30")}
          aria-hidden
        />
      ))}
      <span className="ms-1 text-xs font-bold tabular-nums">{rating.toFixed(1)}</span>
    </span>
  );
}

/** R-021 v13.3 — lencana jenjang tertinggi yang lulus dari catatan sertifikasi. */
function certBadge(certs?: { level: string; status: string }[]): { label: string; cls: string } | null {
  if (!certs?.length) return null;
  const passed = certs.filter((c) => c.status === "PASSED").map((c) => c.level);
  if (passed.includes("MENTOR")) return { label: "Mentor", cls: "bg-gradient-to-r from-gold/25 to-gold/10 text-gold-deep border-gold/50" };
  if (passed.includes("LANJUTAN")) return { label: "Lanjutan", cls: "bg-primary/10 text-primary border-primary/35" };
  if (passed.includes("DASAR")) return { label: "Dasar", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" };
  return null;
}

export function BisnisView() {
  const { t } = useT();
  const [vendors, setVendors] = useState<VendorItem[] | null>(null);
  const [muthowifs, setMuthowifs] = useState<MuthowifItem[] | null>(null);
  const [seats, setSeats] = useState<SeatListingItem[] | null>(null);
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);

  // filter state
  const [seatSide, setSeatSide] = useState("ALL");
  const [lang, setLang] = useState("ALL");
  const [cat, setCat] = useState("ALL");

  useEffect(() => {
    apiGet<SeatListingItem[]>("/api/seat-exchange").then(setSeats).catch(() => setSeats([]));
    apiGet<MuthowifItem[]>("/api/muthowif").then(setMuthowifs).catch(() => setMuthowifs([]));
    apiGet<VendorItem[]>("/api/vendors").then(setVendors).catch(() => setVendors([]));
    apiGet<ComplianceSummary>("/api/compliance-docs?mode=summary").then(setCompliance).catch(() => setCompliance(null));
  }, []);

  const seatList = useMemo(
    () => (seats ?? []).filter((s) => seatSide === "ALL" || s.side === seatSide),
    [seats, seatSide]
  );
  const muthowifList = useMemo(
    () => (muthowifs ?? []).filter((m) => lang === "ALL" || m.languages.split(",").map((x) => x.trim()).includes(lang)),
    [muthowifs, lang]
  );
  const vendorList = useMemo(
    () => (vendors ?? []).filter((v) => cat === "ALL" || v.category === cat),
    [vendors, cat]
  );

  const CATS = ["HOTEL_MAKKAH", "HOTEL_MADINAH", "TRANSPORT", "CATERING", "HANDLER", "AVIATION", "TPA", "FINANCE"];

  const lifecycleBadge = (lc: string) =>
    lc === "VALID"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
      : lc === "EXPIRING"
        ? "bg-gold/15 text-gold-deep border-gold/40"
        : "bg-destructive/10 text-destructive border-destructive/30";

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("bisnis.eyebrow")}
        title={t("bisnis.title")}
        subtitle={t("bisnis.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
      >
        <div className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: "boxes", value: vendors ? String(vendors.length) : "—", label: t("bisnis.statVendors") },
            { icon: "file-check", value: compliance ? String(compliance.totals.docs) : "—", label: t("bisnis.statDocs") },
            { icon: "git-merge", value: seats ? String(seats.reduce((a, s) => a + s.seats, 0)) : "—", label: t("bisnis.statSeats") },
            { icon: "moon-star", value: muthowifs ? String(muthowifs.length) : "—", label: t("bisnis.statMuthowif") },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
              <Icon name={s.icon} className="h-4 w-4 text-gold" aria-hidden />
              <p className="mt-1.5 text-xl font-extrabold tabular-nums">{s.value}</p>
              <p className="text-[11px] font-semibold text-emerald-50/80">{s.label}</p>
            </div>
          ))}
        </div>
      </DetailHero>

      {/* v7.0 — CTA Pindai Izin 360°: pintu masuk fitur pembeda dari pusat bisnis */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 -mt-6 relative z-10">
        <a
          href="#/pindai"
          className="group flex flex-col gap-3 rounded-2xl border border-gold/50 bg-gradient-to-r from-gold/15 via-card to-card p-5 shadow-lg shadow-black/5 transition hover:border-gold sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold-deep">
              <Icon name="scan" className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black tracking-tight text-gold-deep">{t("scan.bisnisCard.title")}</p>
              <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">{t("scan.bisnisCard.desc")}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-[11px] font-extrabold tracking-widest text-forest-deep transition group-hover:bg-gold-soft">
            <Icon name="chevron-right" className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            {t("scan.bisnisCard.cta")}
          </span>
        </a>
      </section>

      <LapakMitraSection />

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Tabs defaultValue="seats">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="seats" className="gap-1.5">
                <Icon name="git-merge" className="h-3.5 w-3.5" aria-hidden /> {t("bisnis.tabSeats")}
              </TabsTrigger>
              <TabsTrigger value="muthowif" className="gap-1.5">
                <Icon name="moon-star" className="h-3.5 w-3.5" aria-hidden /> {t("bisnis.tabMuthowif")}
              </TabsTrigger>
              <TabsTrigger value="vendors" className="gap-1.5">
                <Icon name="boxes" className="h-3.5 w-3.5" aria-hidden /> {t("bisnis.tabVendors")}
              </TabsTrigger>
              <TabsTrigger value="compliance" className="gap-1.5">
                <Icon name="file-check" className="h-3.5 w-3.5" aria-hidden /> {t("bisnis.tabCompliance")}
              </TabsTrigger>
            </TabsList>

            {/* ===== BURSA KURSI ===== */}
            <TabsContent value="seats">
              <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("bisnis.seatsIntro")}</p>
              <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t("bisnis.filterAll")}>
                {[
                  { v: "ALL", label: t("bisnis.filterAll") },
                  { v: "OFFER", label: t("bisnis.sideOffer") },
                  { v: "WANTED", label: t("bisnis.sideWanted") },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setSeatSide(o.v)}
                    aria-pressed={seatSide === o.v}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      seatSide === o.v ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {!seats ? (
                <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
              ) : seatList.length === 0 ? (
                <div className="rounded-2xl border bg-muted/30 p-10 text-center">
                  <Icon name="git-merge" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                  <p className="mt-3 text-sm text-muted-foreground">{t("bisnis.seatsEmpty")}</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {seatList.map((s) => (
                    <Reveal key={s.id}>
                      <article className={cn(
                        "flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm",
                        s.status === "DEAL" && "opacity-70",
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold",
                              s.side === "OFFER"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                                : "bg-gold/15 text-gold-deep border-gold/40"
                            )}
                          >
                            <Icon name={s.side === "OFFER" ? "arrow-right" : "arrow-up"} className="h-3 w-3" aria-hidden />
                            {s.side === "OFFER" ? t("bisnis.sideOffer") : t("bisnis.sideWanted")}
                          </Badge>
                          <Badge variant="outline" className={cn("text-[10px] font-bold", lifecycleBadge(s.status === "OPEN" ? "VALID" : s.status === "RESERVED" ? "EXPIRING" : "EXPIRED"))}>
                            {t(`bisnis.status${s.status}`)}
                          </Badge>
                        </div>
                        <p className="mt-3 text-2xl font-extrabold text-gold-deep">
                          {s.seats} <span className="text-sm font-bold text-muted-foreground">{t("bisnis.seatsUnit")}</span>
                          {s.side === "OFFER" && s.pricePerSeat > 0 && (
                            <span className="ms-2 text-sm font-extrabold text-primary">{rupiah(s.pricePerSeat)}<span className="text-xs font-semibold text-muted-foreground">{t("bisnis.perSeat")}</span></span>
                          )}
                          {s.side === "OFFER" && s.pricePerSeat === 0 && (
                            <span className="ms-2 text-xs font-bold text-muted-foreground">{t("bisnis.priceNego")}</span>
                          )}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1"><Icon name="building-2" className="h-3.5 w-3.5" aria-hidden /> {s.member?.name ?? "—"}</span>
                          <span className="flex items-center gap-1"><Icon name="plane-takeoff" className="h-3.5 w-3.5" aria-hidden /> {s.route || "—"} · {fmtDate(s.departureDate) ?? t("bisnis.departFlexible")}</span>
                        </p>
                        {s.note && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.note}</p>}
                        {s.pkg && (
                          <p className="mt-2 text-xs font-semibold text-primary flex items-center gap-1">
                            <Icon name="package" className="h-3.5 w-3.5" aria-hidden /> {s.pkg.title}
                          </p>
                        )}
                      </article>
                    </Reveal>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ===== KOLAM MUTHOWIF ===== */}
            <TabsContent value="muthowif">
              <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("bisnis.muthowifIntro")}</p>
              <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t("bisnis.filterAll")}>
                {[
                  { v: "ALL", label: t("bisnis.filterAll") },
                  { v: "ID", label: t("bisnis.langID") },
                  { v: "AR", label: t("bisnis.langAR") },
                  { v: "EN", label: t("bisnis.langEN") },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setLang(o.v)}
                    aria-pressed={lang === o.v}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      lang === o.v ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {!muthowifs ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
              ) : muthowifList.length === 0 ? (
                <div className="rounded-2xl border bg-muted/30 p-10 text-center">
                  <Icon name="moon-star" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                  <p className="mt-3 text-sm text-muted-foreground">{t("bisnis.muthowifEmpty")}</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {muthowifList.map((m) => (
                    <Reveal key={m.id}>
                      <article className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-forest text-lg font-extrabold text-gold-soft" aria-hidden>
                            {m.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Stars rating={m.rating} />
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold",
                                m.availability === "AVAILABLE"
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                                  : m.availability === "ASSIGNED"
                                    ? "bg-gold/15 text-gold-deep border-gold/40"
                                    : "bg-muted text-muted-foreground border-border"
                              )}
                            >
                              {t(`bisnis.avail${m.availability}`)}
                            </Badge>
                          </div>
                        </div>
                        <h3 className="mt-3 font-extrabold leading-snug">{m.fullName}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("bisnis.agency")}: {m.agency || "—"} · {m.experienceYears} {t("bisnis.expYears")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {m.languages.split(",").map((l) => (
                            <Badge key={l} variant="outline" className="bg-primary/5 text-[10px] font-bold text-primary border-primary/25">
                              {t(`bisnis.lang${l.trim()}`) !== `bisnis.lang${l.trim()}` ? t(`bisnis.lang${l.trim()}`) : l.trim()}
                            </Badge>
                          ))}
                          {/* R-021 v13.3 — lencana jenjang tertinggi yang lulus */}
                          {certBadge(m.certs) && (
                            <Badge variant="outline" className={cn("text-[10px] font-extrabold", certBadge(m.certs)!.cls)}>
                              <Icon name="award" className="h-3 w-3" aria-hidden /> {certBadge(m.certs)!.label}
                            </Badge>
                          )}
                        </div>
                        {m.specialties && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.specialties}</p>}
                        {m.certNo && (
                          <p className="mt-3 border-t pt-3 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Icon name="badge-check" className="h-3.5 w-3.5 text-primary" aria-hidden />
                            {t("bisnis.cert")}: {m.certNo}
                          </p>
                        )}
                      </article>
                    </Reveal>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ===== JARINGAN VENDOR ===== */}
            <TabsContent value="vendors">
              <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("bisnis.vendorsIntro")}</p>
              <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t("bisnis.filterAll")}>
                <button
                  type="button"
                  onClick={() => setCat("ALL")}
                  aria-pressed={cat === "ALL"}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    cat === "ALL" ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
                  )}
                >
                  {t("bisnis.filterAll")}
                </button>
                {CATS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCat(c)}
                    aria-pressed={cat === c}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      cat === c ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
                    )}
                  >
                    {t(`bisnis.cat${c}`)}
                  </button>
                ))}
              </div>

              {!vendors ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
              ) : vendorList.length === 0 ? (
                <div className="rounded-2xl border bg-muted/30 p-10 text-center">
                  <Icon name="boxes" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                  <p className="mt-3 text-sm text-muted-foreground">{t("bisnis.vendorsEmpty")}</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {vendorList.map((v) => (
                    <Reveal key={v.id}>
                      <article className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-[10px] font-bold text-primary border-primary/30">
                            {t(`bisnis.cat${v.category}`)}
                          </Badge>
                          {v.verified && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-[10px] font-bold text-emerald-700 border-emerald-500/30 dark:text-emerald-400">
                              <Icon name="badge-check" className="h-3 w-3" aria-hidden /> {t("bisnis.verified")}
                            </Badge>
                          )}
                        </div>
                        <h3 className="mt-3 font-extrabold leading-snug">{v.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                          <Icon name="map-pin" className="h-3.5 w-3.5" aria-hidden /> {v.city || "—"} · {v.country}
                        </p>
                        <div className="mt-2"><Stars rating={v.rating} /></div>
                        {v.services && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{v.services}</p>}
                        {v.contact && (
                          <p className="mt-3 border-t pt-3 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Icon name="at-sign" className="h-3.5 w-3.5" aria-hidden />
                            {t("bisnis.contact")}: {v.contact}{v.phone ? ` · ${v.phone}` : ""}
                          </p>
                        )}
                      </article>
                    </Reveal>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ===== COMPLIANCE HUB ===== */}
            <TabsContent value="compliance">
              <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("bisnis.complianceIntro")}</p>

              {compliance && (
                <div className="mb-6 grid gap-3 sm:grid-cols-4">
                  {[
                    { v: compliance.totals.valid, label: t("bisnis.lcVALID"), cls: "text-emerald-600 dark:text-emerald-400" },
                    { v: compliance.totals.expiring, label: t("bisnis.lcEXPIRING"), cls: "text-gold-deep" },
                    { v: compliance.totals.expired, label: t("bisnis.lcEXPIRED"), cls: "text-destructive" },
                    { v: compliance.totals.members, label: t("bisnis.scoreTitle"), cls: "text-primary" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border bg-card p-4 text-center shadow-sm">
                      <p className={cn("text-3xl font-extrabold tabular-nums", s.cls)}>{s.v}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {!compliance ? (
                <Skeleton className="h-64 rounded-2xl" />
              ) : compliance.members.length === 0 ? (
                <div className="rounded-2xl border bg-muted/30 p-10 text-center">
                  <Icon name="file-check" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                  <p className="mt-3 text-sm text-muted-foreground">{t("bisnis.complianceEmpty")}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="divide-y">
                    {compliance.members.map((m) => (
                      <div key={m.memberId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.type} · {m.city} · {m.total} dokumen ({m.verified} {t("bisnis.docVerified")})</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {m.valid > 0 && <Badge variant="outline" className={cn("text-[10px] font-bold", lifecycleBadge("VALID"))}>{m.valid} {t("bisnis.lcVALID")}</Badge>}
                            {m.expiring > 0 && <Badge variant="outline" className={cn("text-[10px] font-bold", lifecycleBadge("EXPIRING"))}>{m.expiring} {t("bisnis.lcEXPIRING")}</Badge>}
                            {m.expired > 0 && <Badge variant="outline" className={cn("text-[10px] font-bold", lifecycleBadge("EXPIRED"))}>{m.expired} {t("bisnis.lcEXPIRED")}</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:w-44">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", m.score >= 80 ? "bg-emerald-500" : m.score >= 50 ? "bg-gold" : "bg-destructive")}
                              style={{ width: `${Math.max(4, m.score)}%` }}
                            />
                          </div>
                          <span className="text-lg font-extrabold tabular-nums">{m.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">{t("bisnis.scoreDesc")}</p>
            </TabsContent>
          </Tabs>

          {/* CTA gabung */}
          <Reveal>
            <div className="mt-12 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6 sm:p-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-extrabold">
                    <Icon name="heart-handshake" className="h-5 w-5 text-primary" aria-hidden />
                    {t("bisnis.ctaJoin")}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("bisnis.ctaJoinDesc")}</p>
                </div>
                <WaCtaButton message="Assalamu'alaikum, saya ingin mendaftarkan perusahaan (PPIU/PIHK/BPW) ke jaringan Pusat Bisnis MUHDIN." />
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground/70">{t("bisnis.disclaimer")}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
