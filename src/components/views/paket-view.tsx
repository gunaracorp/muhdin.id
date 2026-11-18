"use client";

/**
 * v5.0 — Marketplace Paket Ibadah (listing).
 * Route: #/paket
 *
 * Katalog paket umrah/haji/ziarah dari anggota terverifikasi: filter jenis,
 * pencarian, pengurutan, statistik ringkas, kartu harga + progres slot,
 * dan CTA menuju halaman detail untuk booking.
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TourPackageItem } from "@/lib/types";
import { DetailHero, WaCtaButton } from "@/components/views/detail-shell";
import { SmartImage } from "@/components/site/smart-image";
// v6.0 — AI Trip Composer (diferensiasi)
import { TripComposer } from "@/components/views/trip-composer";

const TYPES = ["UMROH", "HAJI", "ZIARAH", "WISATA_ISLAMI"] as const;

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function PaketView() {
  const { t } = useT();
  const [pkgs, setPkgs] = useState<TourPackageItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [sort, setSort] = useState<string>("default");

  useEffect(() => {
    apiGet<TourPackageItem[]>("/api/packages")
      .then(setPkgs)
      .catch(() => setPkgs([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = (pkgs ?? []).filter((p) => {
      const okType = type === "ALL" || p.type === type;
      const hay = `${p.title} ${p.city} ${p.description} ${p.member?.name ?? ""}`.toLowerCase();
      return okType && (!q || hay.includes(q));
    });
    if (sort === "price") rows = [...rows].sort((a, b) => a.price - b.price);
    else if (sort === "depart")
      rows = [...rows].sort((a, b) => {
        const da = a.departureDate ? new Date(a.departureDate).getTime() : Infinity;
        const db = b.departureDate ? new Date(b.departureDate).getTime() : Infinity;
        return da - db;
      });
    return rows;
  }, [pkgs, query, type, sort]);

  const totalSlotsLeft = (pkgs ?? []).reduce((acc, p) => acc + Math.max(0, p.slots - p.slotsTaken), 0);
  const memberCount = new Set((pkgs ?? []).map((p) => p.member?.id)).size;

  const typeLabel = (tp: string) => t(`paket.type${tp}`);

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
      : null;

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("paket.eyebrow")}
        title={t("paket.title")}
        subtitle={t("paket.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
      >
        <div className="mt-6 grid max-w-lg grid-cols-3 gap-3">
          {[
            { icon: "package", value: pkgs ? String(filtered.length) : "—", label: t("paket.statPackages") },
            { icon: "building-2", value: pkgs ? String(memberCount) : "—", label: t("paket.statMembers") },
            { icon: "users", value: pkgs ? totalSlotsLeft.toLocaleString("id-ID") : "—", label: t("paket.statSlots") },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
              <Icon name={s.icon} className="h-4 w-4 text-gold" aria-hidden />
              <p className="mt-1.5 text-xl font-extrabold tabular-nums">{s.value}</p>
              <p className="text-[11px] font-semibold text-emerald-50/80">{s.label}</p>
            </div>
          ))}
        </div>
      </DetailHero>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Pencarian + pengurutan */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Icon name="search" className="pointer-events-none absolute start-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("paket.searchPlaceholder")}
                aria-label={t("paket.searchAria")}
                className="h-12 rounded-2xl border-border ps-11 text-sm shadow-sm focus-visible:ring-gold/40"
              />
            </div>
            <div className="relative sm:w-56">
              <Icon name="arrow-up" className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label={t("paket.sort")}
                className="h-12 w-full appearance-none rounded-2xl border border-border bg-card ps-10 pe-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              >
                <option value="default">{t("paket.sortDefault")}</option>
                <option value="price">{t("paket.sortPrice")}</option>
                <option value="depart">{t("paket.sortDepart")}</option>
              </select>
            </div>
          </div>

          {/* Filter jenis */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("paket.allTypes")}>
            <button
              type="button"
              onClick={() => setType("ALL")}
              aria-pressed={type === "ALL"}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                type === "ALL" ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
              )}
            >
              {t("paket.allTypes")}
            </button>
            {TYPES.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setType(tp)}
                aria-pressed={type === tp}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  type === tp ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
                )}
              >
                {typeLabel(tp)}
              </button>
            ))}
          </div>

          {/* Daftar paket */}
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {!pkgs ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
            ) : filtered.length === 0 ? (
              <div className="col-span-full rounded-2xl border bg-muted/30 p-10 text-center">
                <Icon name="package" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">{t("paket.empty")}</p>
              </div>
            ) : (
              filtered.map((p) => {
                const left = Math.max(0, p.slots - p.slotsTaken);
                const pct = p.slots > 0 ? Math.min(100, Math.round((p.slotsTaken / p.slots) * 100)) : 0;
                return (
                  <Reveal key={p.id}>
                    <article
                      role="link"
                      tabIndex={0}
                      aria-label={`${p.title} — ${t("paket.viewDetail")}`}
                      onClick={() => navigate(`paket/${p.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`paket/${p.id}`);
                        }
                      }}
                      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-lg hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      {/* R-057/R-058 — band gambar paket (lazy + WebP), fallback gradient */}
                      {p.image ? (
                        <SmartImage
                          src={p.image}
                          alt={p.title}
                          className="h-28 w-full shrink-0"
                        />
                      ) : null}
                      <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="bg-primary/10 text-[10px] font-bold text-primary border-primary/30">
                            {typeLabel(p.type)}
                          </Badge>
                          {p.featured && (
                            <Badge variant="outline" className="bg-gold/15 text-[10px] font-bold text-gold-deep border-gold/40">
                              <Icon name="star" className="h-3 w-3" aria-hidden /> {t("paket.featured")}
                            </Badge>
                          )}
                          {p.status !== "PUBLISHED" && (
                            <Badge variant="outline" className="bg-destructive/10 text-[10px] font-bold text-destructive border-destructive/30">
                              {p.status === "CLOSED" ? t("paket.closed") : t("paket.draft")}
                            </Badge>
                          )}
                        </div>
                        <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft text-xs font-extrabold" aria-hidden>
                          {(p.member?.name ?? "?").charAt(0).toUpperCase()}
                        </div>
                      </div>

                      <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-snug group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Icon name="building-2" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{p.member?.name ?? "—"} · {p.city || p.member?.city}</span>
                      </p>

                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Icon name="clock" className="h-3.5 w-3.5" aria-hidden /> {p.durationDays} {t("paket.days")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Icon name="plane-takeoff" className="h-3.5 w-3.5" aria-hidden />
                          {fmtDate(p.departureDate) ?? t("paket.departFlexible")}
                        </span>
                      </div>

                      {/* Progres slot */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className={cn(left <= 5 ? "text-destructive" : "text-primary")}>
                            {left <= 5 && <Icon name="alert-triangle" className="me-1 inline h-3 w-3" aria-hidden />}
                            {left > 0 ? `${left} ${t("paket.slotsLeft")}` : t("paket.slotsFull")}
                          </span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                          <div
                            className={cn("h-full rounded-full", left <= 5 ? "bg-destructive" : "bg-gradient-to-r from-primary to-forest")}
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-end justify-between border-t pt-4">
                        <div>
                          <p className="text-[11px] text-muted-foreground">{t("paket.byMember")}</p>
                          <p className="text-lg font-extrabold text-gold-deep">
                            {rupiah(p.price)}
                            <span className="text-xs font-semibold text-muted-foreground"> {t("paket.perPax")}</span>
                          </p>
                          {/* R-043 — badge promo harga musiman/early bird */}
                          {(p.promos ?? []).map((promo: string) => (
                            <p key={promo} className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              <Icon name="ticket-percent" className="h-3 w-3" aria-hidden />
                              {promo}
                            </p>
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary transition group-hover:bg-primary group-hover:text-white">
                          {t("paket.viewDetail")}
                          <Icon name="chevron-right" className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </div>
                      </div>{/* /inner p-5 */}
                    </article>
                  </Reveal>
                );
              })
            )}
          </div>

          {/* v6.0 — AI Trip Composer: budget → rekomendasi paket + rencana */}
          <TripComposer />

          {/* Jaminan verified-only */}
          <div className="mt-12 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6 sm:p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold">
                  <Icon name="shield-check" className="h-5 w-5 text-primary" aria-hidden />
                  {t("paket.verifiedOnly")}
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t("detail.verify.title")} — {t("detail.faq.subtitle")}
                </p>
              </div>
              <WaCtaButton message="Assalamu'alaikum, saya melihat halaman Paket Ibadah MUHDIN dan ingin bertanya tentang paket yang tersedia." />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
