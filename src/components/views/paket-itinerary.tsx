"use client";

/**
 * Task 19 (R-009 + R-040) — Itinerary harian interaktif, peta kursi
 * real-time, dan daftar tunggu otomatis pada halaman detail paket.
 *
 * • PaketItinerary   — timeline hari-ke-hari dari /api/packages/[id]/itinerary
 *                      (bila kosong: peta kerangka durasi + catatan menyusul).
 * • SeatMapBoard     — grid kursi terisi/kosong (visual real-time dari slots).
 * • WaitlistPanel    — formulir daftar tunggu saat kursi habis; respons
 *                      menyebut nomor urut antrean.
 */
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ItineraryDayItem {
  id: string;
  day: number;
  title: string;
  plan: string;
  location: string;
}

const LOCATION_CLS: Record<string, string> = {
  Makkah: "border-gold/40 bg-gold/10 text-gold-deep",
  Madinah: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  Jeddah: "border-primary/30 bg-primary/10 text-primary",
};

export function PaketItinerary({ packageId, durationDays }: { packageId: string; durationDays: number }) {
  const { t } = useT();
  const [days, setDays] = useState<ItineraryDayItem[] | null>(null);

  useEffect(() => {
    apiGet<{ days: ItineraryDayItem[] }>(`/api/packages/${packageId}/itinerary`)
      .then((d) => setDays(d.days))
      .catch(() => setDays([]));
  }, [packageId]);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-extrabold">
          <Icon name="map" className="h-4.5 w-4.5 text-primary" aria-hidden />
          {t("iten.title")}
        </h3>
        {days && days.length > 0 ? (
          <Badge>{t("iten.daysCount", { n: days.length })}</Badge>
        ) : null}
      </div>

      {!days ? (
        <div className="mt-4 space-y-2.5" aria-busy="true">
          {Array.from({ length: Math.min(4, durationDays) }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("iten.empty")}</p>
      ) : (
        <ol className="relative mt-5 space-y-0 border-s-2 border-dashed border-primary/25 ps-6">
          {days.map((d, i) => (
            <li key={d.id} className={cn("relative", i < days.length - 1 ? "pb-6" : "")}>
              <span className="absolute -start-[31px] grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-black text-white shadow" aria-hidden>
                {d.day}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-extrabold leading-snug">{d.title}</h4>
                {d.location ? (
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", LOCATION_CLS[d.location] || "border-border text-muted-foreground")}>
                    {d.location}
                  </span>
                ) : null}
              </div>
              {d.plan ? (
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{d.plan}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function SeatMapBoard({ slots, slotsTaken }: { slots: number; slotsTaken: number }) {
  const { t } = useT();
  const total = Math.min(Math.max(slots, 1), 90); // jaga DOM tetap wajar
  const cells = useMemo(() => Array.from({ length: total }, (_, i) => i < slotsTaken), [total, slotsTaken]);
  return (
    <div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(22px,1fr))] gap-1.5" role="img" aria-label={t("iten.seatAria", { taken: slotsTaken, total: slots })}>
        {cells.map((taken, i) => (
          <span
            key={i}
            className={cn(
              "grid aspect-square place-items-center rounded-md border text-[8px] font-black",
              taken ? "border-transparent bg-gradient-to-br from-primary to-forest text-gold-soft" : "border-border bg-muted/40 text-muted-foreground/50"
            )}
            title={taken ? t("iten.seatTaken") : t("iten.seatFree")}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-gradient-to-br from-primary to-forest" aria-hidden /> {t("iten.legendTaken")}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border border-border bg-muted/60" aria-hidden /> {t("iten.legendFree")}</span>
      </div>
    </div>
  );
}

export function WaitlistPanel({ packageId }: { packageId: string }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await apiSend<{ message: string }>(`/api/packages/${packageId}/waitlist`, "POST", {
        name: name.trim(),
        phone: phone.trim(),
        quantity: Math.max(1, parseInt(quantity || "1", 10) || 1),
      });
      setDone(res.message);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm" data-testid="waitlist-success">
        <p className="flex items-center gap-2 font-extrabold text-emerald-800 dark:text-emerald-300">
          <Icon name="check-circle-2" className="h-4.5 w-4.5" aria-hidden /> {t("iten.waitOkTitle")}
        </p>
        <p className="mt-1 text-emerald-900/80 dark:text-emerald-200/80">{done}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5" data-testid="waitlist-panel">
      <h3 className="flex items-center gap-2 text-base font-extrabold">
        <Icon name="clock" className="h-4.5 w-4.5 text-gold-deep" aria-hidden />
        {t("iten.waitTitle")}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("iten.waitDesc")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="wl-name">{t("iten.waitName")}</Label>
          <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-phone">WhatsApp</Label>
          <Input id="wl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-qty">{t("iten.waitQty")}</Label>
          <Input id="wl-qty" type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
      </div>
      {err ? <p className="mt-2.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p> : null}
      <Button onClick={submit} disabled={busy} className="mt-3.5">
        {busy ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="bell-ring" className="h-4 w-4" aria-hidden />}
        <span className="ml-2">{t("iten.waitSubmit")}</span>
      </Button>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary">{children}</span>;
}
