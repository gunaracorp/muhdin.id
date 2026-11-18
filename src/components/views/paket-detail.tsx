"use client";

/**
 * v5.0 — Detail Paket Ibadah + form booking publik.
 * Route: #/paket/<id>
 *
 * Hero DetailShell dengan harga, ringkasan fasilitas (hotel, maskapai, durasi),
 * progres slot, kartu penyelenggara, dan form booking yang mengurangi slot
 * secara atomik di server (transaksi Prisma).
 */

import { useEffect, useMemo, useState } from "react";
import { trackFunnel } from "@/lib/funnel-client"; // R-093
import { apiGet, apiSend, formatDate } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TourPackageItem } from "@/lib/types";
import {
  DetailHero, DetailSectionHead, InfoRow, DetailLoading, DetailNotFound, WaCtaButton,
} from "@/components/views/detail-shell";
// v6.0 — Ulasan jamaah terverifikasi (hilir)
import { ReviewsSection } from "@/components/views/reviews-section";
// v12.4 «LUNAS» — Checkout langsung (R-010) + payment gateway (R-038)
import { CheckoutPanel } from "@/components/views/checkout-panel";
import { PaketItinerary, SeatMapBoard, WaitlistPanel } from "@/components/views/paket-itinerary";

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function PaketDetail({ id }: { id: string }) {
  const { t } = useT();
  const [pkg, setPkg] = useState<TourPackageItem | null>(null);
  const [failed, setFailed] = useState(false);
  // R-093 — track funnel "lihat paket" (anonim, sekali per sesi).
  useEffect(() => {
    trackFunnel("VIEW_PAKET", id);
  }, [id]);

  // form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pilgrims, setPilgrims] = useState("1");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState<null | { message: string }>(null);

  useEffect(() => {
    apiGet<TourPackageItem>(`/api/packages/${id}`)
      .then(setPkg)
      .catch(() => setFailed(true));
  }, [id]);

  const left = pkg ? Math.max(0, pkg.slots - pkg.slotsTaken) : 0;
  const pct = pkg && pkg.slots > 0 ? Math.min(100, Math.round((pkg.slotsTaken / pkg.slots) * 100)) : 0;
  const total = pkg ? pkg.price * Math.max(1, parseInt(pilgrims || "1", 10) || 1) : 0;
  const canBook = useMemo(() => !!pkg && pkg.status === "PUBLISHED" && left > 0, [pkg, left]);

  const typeLabel = (tp: string) => t(`paket.type${tp}`);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (name.trim().length < 3) return setFormError(t("paket.nameErr"));
    if (!/^[+\-\s()0-9]{8,20}$/.test(phone.trim())) return setFormError(t("paket.phoneErr"));
    const p = parseInt(pilgrims, 10) || 1;
    if (p < 1 || p > Math.max(1, left)) return setFormError(t("paket.slotErr"));

    setSending(true);
    try {
      const res = await apiSend<{ message: string }>("/api/package-bookings", "POST", {
        packageId: id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        pilgrims: p,
        note: note.trim() || undefined,
      });
      setDone({ message: res.message || t("paket.bookSuccessDesc") });
      setPkg({ ...pkg!, slotsTaken: pkg!.slotsTaken + p });
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (failed) {
    return (
      <DetailNotFound
        message={t("paket.empty")}
        backTo="/paket"
        backLabel={t("paket.title")}
      />
    );
  }
  if (!pkg) return <DetailLoading />;

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("paket.eyebrow")}
        title={pkg.title}
        backTo="/paket"
        backLabel={t("paket.title")}
        badge={
          <span className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="bg-white/10 text-[11px] font-bold text-gold border-gold/40">
              {typeLabel(pkg.type)}
            </Badge>
            {pkg.featured && (
              <Badge variant="outline" className="bg-gold/20 text-[11px] font-bold text-gold border-gold/50">
                <Icon name="star" className="h-3 w-3" aria-hidden /> {t("paket.featured")}
              </Badge>
            )}
            {pkg.status !== "PUBLISHED" && (
              <Badge variant="outline" className="bg-destructive/20 text-[11px] font-bold text-red-200 border-red-300/40">
                {pkg.status === "CLOSED" ? t("paket.closed") : t("paket.draft")}
              </Badge>
            )}
          </span>
        }
      >
        <p className="mt-3 text-3xl font-extrabold text-gold-gradient">
          {rupiah(pkg.price)}
          <span className="text-sm font-semibold text-emerald-50/80"> {t("paket.perPax")}</span>
        </p>
      </DetailHero>

      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-5">
          {/* Kolom kiri — informasi paket */}
          <div className="space-y-8 lg:col-span-3">
            <div>
              <DetailSectionHead icon="info" title={t("paket.includeTitle")} />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{pkg.description}</p>
            </div>

            {/* R-009 — itinerary harian interaktif */}
            <PaketItinerary packageId={id} durationDays={pkg.durationDays} />

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <DetailSectionHead icon="clipboard-list" title={t("paket.statPackages")} />
              <div className="grid gap-1 sm:grid-cols-2">
                <InfoRow icon="clock" label={t("paket.duration")} value={`${pkg.durationDays} ${t("paket.days")}`} />
                <InfoRow
                  icon="plane-takeoff"
                  label={t("paket.depart")}
                  value={
                    pkg.departureDate
                      ? formatDate(pkg.departureDate)
                      : t("paket.departFlexible")
                  }
                />
                <InfoRow icon="map-pin" label={t("paket.city")} value={pkg.city || pkg.member?.city || "—"} />
                <InfoRow icon="plane" label={t("paket.airline")} value={pkg.airline || "—"} />
                <InfoRow icon="building" label={t("paket.hotelMakkah")} value={pkg.hotelMakkah || "—"} />
                <InfoRow icon="building-2" label={t("paket.hotelMadinah")} value={pkg.hotelMadinah || "—"} />
              </div>
            </div>

            {/* Slot */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <DetailSectionHead icon="users" title={t("paket.statSlots")} />
                <span className={cn("text-sm font-extrabold", left <= 5 ? "text-destructive" : "text-primary")}>
                  {left} / {pkg.slots}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={cn("h-full rounded-full", left <= 5 ? "bg-destructive" : "bg-gradient-to-r from-primary to-forest")}
                  style={{ width: `${Math.max(4, pct)}%` }}
                />
              </div>
              {left <= 5 && left > 0 && canBook && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-destructive">
                  <Icon name="alert-triangle" className="h-3.5 w-3.5" aria-hidden />
                  {t("paket.bookAlmostFull")}
                </p>
              )}
              <div className="mt-4">
                {/* R-040 — peta kursi visual */}
                <SeatMapBoard slots={pkg.slots} slotsTaken={pkg.slotsTaken} />
              </div>
              {left <= 0 && (
                <div className="mt-4">
                  <WaitlistPanel packageId={id} />
                </div>
              )}
            </div>

            {/* Penyelenggara */}
            <div
              role="link"
              tabIndex={0}
              onClick={() => navigate(`anggota/${pkg.member.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`anggota/${pkg.member.id}`);
                }
              }}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-forest grid place-items-center text-xl font-extrabold text-gold-soft">
                {pkg.member?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-extrabold">
                  {pkg.member?.name ?? "—"}
                  {pkg.member?.status === "TERVERIFIKASI" && (
                    <Icon name="badge-check" className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pkg.member?.type ?? ""} · {pkg.member?.city ?? ""} · Izin {pkg.member?.licenseNo ?? "—"}
                </p>
              </div>
              <Icon name="chevron-right" className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          </div>

          {/* Kolom kanan — checkout v12.4 + form booking sticky */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {canBook && (
                <div className="mb-6">
                  <CheckoutPanel packageId={id} price={pkg.price} slotsLeft={left} />
                </div>
              )}
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-extrabold">
                  <Icon name="send" className="h-5 w-5 text-primary" aria-hidden />
                  {t("paket.bookTitle")}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("paket.bookDesc")}</p>
                {done ? (
                  <div className="py-6 text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15">
                      <Icon name="check-circle-2" className="h-7 w-7 text-primary" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-base font-extrabold">{t("paket.bookSuccessTitle")}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{done.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("paket.bookSuccessDesc")}</p>
                    <div className="mt-5 flex flex-col gap-2">
                      <WaCtaButton
                        message={`Assalamu'alaikum, saya baru mengajukan booking paket "${pkg.title}". Mohon konfirmasinya. Terima kasih.`}
                        className="w-full justify-center"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDone(null);
                          setName("");
                          setPhone("");
                          setEmail("");
                          setPilgrims("1");
                          setNote("");
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {t("paket.bookAnother")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {canBook ? (
                      <form onSubmit={submit} className="mt-5 space-y-3.5">
                        <div className="space-y-1.5">
                          <Label htmlFor="bk-name">{t("paket.bookName")} *</Label>
                          <Input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} required className="h-10" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="bk-phone">{t("paket.bookPhone")} *</Label>
                            <Input id="bk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812…" required className="h-10" inputMode="tel" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="bk-pax">{t("paket.bookPilgrims")} *</Label>
                            <Input
                              id="bk-pax"
                              type="number"
                              min={1}
                              max={Math.max(1, left)}
                              value={pilgrims}
                              onChange={(e) => setPilgrims(e.target.value)}
                              required
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="bk-email">{t("paket.bookEmail")}</Label>
                          <Input id="bk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="bk-note">{t("paket.bookNote")}</Label>
                          <Textarea id="bk-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t("paket.bookNotePlaceholder")} />
                        </div>

                        <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-3">
                          <span className="text-xs font-semibold text-muted-foreground">{t("paket.total")}</span>
                          <span className="text-base font-extrabold text-gold-deep">{rupiah(total)}</span>
                        </div>

                        {formError && (
                          <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            <Icon name="alert-triangle" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {formError}
                          </p>
                        )}

                        <Button
                          type="submit"
                          disabled={sending}
                          className="h-12 w-full bg-gradient-to-r from-primary to-forest text-base text-white shadow-lg"
                        >
                          {sending ? (
                            <>
                              <Icon name="loader-2" className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                              {t("paket.bookSubmitting")}
                            </>
                          ) : (
                            <>
                              <Icon name="send" className="mr-2 h-4 w-4" aria-hidden />
                              {t("paket.bookSubmit")}
                            </>
                          )}
                        </Button>
                      </form>
                    ) : (
                      <div className="mt-5 rounded-xl bg-muted/60 p-5 text-center">
                        <Icon name="ban" className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
                        <p className="mt-2 text-sm font-semibold text-muted-foreground">{t("paket.bookClosed")}</p>
                        <div className="mt-4">
                          <WaCtaButton message={`Assalamu'alaikum, saya tertarik dengan paket "${pkg.title}". Apakah ada jadwal berikutnya?`} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                <Icon name="shield-check" className="me-1 inline h-3 w-3 text-primary" aria-hidden />
                {t("paket.verifiedOnly")}
              </p>
            </div>
          </div>
        </div>

        {/* v6.0 — Ulasan jamaah terverifikasi */}
        <ReviewsSection packageId={id} />
      </section>
    </div>
  );
}
