"use client";

/**
 * v11 — BOOKING LAYANAN (pola Nusuk Rawdah: slot waktu + kuota + QR).
 * Kelas manasik · Konsultasi syariah · Klinik vaksin.
 * Pilih slot → isi data → kode BKG + QR → cek status.
 */
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend, formatDateTime } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface Slot {
  id: string; service: string; title: string; city: string; venue: string;
  startsAt: string; durationMin: number; capacity: number; booked: number; remaining: number;
}
interface Booking {
  code: string; name: string; phone: string; pax: number; status: string;
  slot: { service: string; title: string; city: string; venue: string; startsAt: string; durationMin: number };
}

const SERVICES = [
  { id: "KELAS_MANASIK", icon: "moon-star" },
  { id: "KONSULTASI_SYARIAH", icon: "scale" },
  { id: "KLINIK_VAKSIN", icon: "syringe" },
];
const STATUS_TONE: Record<string, string> = {
  BOOKED: "bg-primary/10 text-primary border-primary/30",
  CHECKED_IN: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

export function BookingView() {
  const { t } = useT();
  const [svc, setSvc] = useState("KELAS_MANASIK");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", pax: 1, notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Booking | null>(null);
  const [checkCode, setCheckCode] = useState("");
  const [checkResult, setCheckResult] = useState<Booking | null | "nf">(null);

  useEffect(() => {
    setLoading(true);
    apiGet<{ rows: Slot[] }>(`/api/slots?service=${svc}`)
      .then((r) => setSlots(r.rows))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [svc]);

  const svcMeta = useMemo(() => SERVICES.find((s) => s.id === svc), [svc]);

  async function submit() {
    if (!active) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiSend<{ booking: Booking }>("/api/slots/book", "POST", {
        slotId: active.id, ...form,
      });
      setDone(res.booking);
      setActive(null);
      setForm({ name: "", phone: "", pax: 1, notes: "" });
      setSlots((s) => s.map((x) => (x.id === res.booking.slot.service ? x : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    setCheckResult(null);
    try {
      const res = await apiGet<{ booking: Booking }>(`/api/slots/book?code=${encodeURIComponent(checkCode.trim())}`);
      setCheckResult(res.booking);
    } catch {
      setCheckResult("nf");
    }
  }

  return (
    <div className="flex-1">
      {/* HERO */}
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_20%,rgba(212,175,55,0.16),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Reveal>
            <Badge className="mb-4 bg-gold/20 text-gold border-gold/40 border">
              <Icon name="calendar-check" className="h-3.5 w-3.5 me-1.5" />{t("book.heroBadge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t("book.title")}</h1>
            <p className="mt-3 max-w-2xl text-white/85 md:text-lg">{t("book.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {/* Tab layanan */}
        <div className="mb-6 flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSvc(s.id)}
              className={cn("flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                svc === s.id ? "border-primary bg-primary text-white" : "bg-card hover:bg-muted")}
            >
              <Icon name={s.icon} className="h-4 w-4" />
              {t(`book.svc.${s.id}`)}
            </button>
          ))}
        </div>

        {/* Daftar slot */}
        {loading ? (
          <div className="grid place-items-center py-20"><Icon name="loader-circle" className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {slots.map((s, i) => (
              <Reveal key={s.id} delay={i * 50}>
                <div className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      <Icon name={svcMeta?.icon || "calendar"} className="h-3 w-3 me-1" />{t(`book.svc.${s.service}`)}
                    </Badge>
                    {s.remaining > 0 ? (
                      <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30">
                        {s.remaining}/{s.capacity} {t("book.seats")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">{t("book.full")}</Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-bold leading-snug">{s.title}</h3>
                  <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Icon name="clock" className="h-3.5 w-3.5 shrink-0" />{formatDateTime(s.startsAt)} · {s.durationMin}m</p>
                    <p className="flex items-center gap-2"><Icon name="map-pin" className="h-3.5 w-3.5 shrink-0" />{s.venue}, {s.city}</p>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    disabled={s.remaining <= 0}
                    onClick={() => { setActive(s); setError(""); }}
                  >
                    <Icon name="ticket" className="h-4 w-4 me-2" />{t("book.cta")}
                  </Button>
                </div>
              </Reveal>
            ))}
            {!slots.length && (
              <div className="col-span-full rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
                <Icon name="calendar-x" className="mx-auto mb-2 h-8 w-8 opacity-40" />
                {t("book.empty")}
              </div>
            )}
          </div>
        )}

        {/* Cek status booking */}
        <div className="mt-10 rounded-2xl border bg-card p-6">
          <h3 className="font-bold flex items-center gap-2"><Icon name="search" className="h-4 w-4 text-primary" />{t("book.checkTitle")}</h3>
          <div className="mt-3 flex gap-2">
            <Input value={checkCode} onChange={(e) => setCheckCode(e.target.value)} placeholder="BKG-2026-00000001" className="font-mono" />
            <Button variant="outline" onClick={check} disabled={!checkCode.trim()}>
              {t("book.checkBtn")}
            </Button>
          </div>
          {checkResult === "nf" && <p className="mt-3 text-sm text-destructive">{t("book.notFound")}</p>}
          {checkResult && checkResult !== "nf" && (
            <div className="mt-3 rounded-xl border p-4 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-bold">{checkResult.slot.title}</p>
                <Badge variant="outline" className={STATUS_TONE[checkResult.status]}>{t(`book.st.${checkResult.status}`)}</Badge>
              </div>
              <p className="text-muted-foreground">{formatDateTime(checkResult.slot.startsAt)} · {checkResult.slot.venue}, {checkResult.slot.city}</p>
              <p className="text-muted-foreground">{checkResult.name} · {checkResult.pax} {t("book.pax")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Dialog booking */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>
              {active && `${formatDateTime(active.startsAt)} · ${active.venue}, ${active.city}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bk-name">{t("book.name")}</Label>
              <Input id="bk-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bk-phone">WhatsApp</Label>
              <Input id="bk-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bk-pax">{t("book.pax")}</Label>
              <Input id="bk-pax" type="number" min={1} max={10} value={form.pax} onChange={(e) => setForm({ ...form, pax: Number(e.target.value) || 1 })} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy || !form.name.trim() || !form.phone.trim()} onClick={submit}>
              {busy ? <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> : <Icon name="ticket" className="h-4 w-4 me-2" />}
              {t("book.submit")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog sukses */}
      <Dialog open={!!done} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="max-w-sm text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon name="check-circle-2" className="h-7 w-7" />
          </span>
          <h3 className="font-bold">{t("book.success")}</h3>
          <p className="text-sm text-muted-foreground">{t("book.successDesc")}</p>
          {done && (
            <>
              <div className="mx-auto w-fit rounded-xl border bg-white p-3">
                <QRCode value={done.code} size={120} />
              </div>
              <p className="font-mono text-lg font-extrabold tracking-wider text-primary">{done.code}</p>
              <p className="text-xs text-muted-foreground">{t("book.saveCode")}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BookingView;
