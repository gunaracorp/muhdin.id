"use client";

/**
 * v12.4 «LUNAS» — Panel Checkout Langsung (R-010).
 * Ditanam di kolom kanan halaman detail paket (di atas form booking panitia):
 * isi data → POST /api/checkout → order PENDING + intent pembayaran dari
 * adapter aktif → konfirmasi berisi nomor pesanan + instruksi + CTA ke
 * halaman #/pesanan (status & bayar sandbox & unduh invoice).
 */

import { useMemo, useState } from "react";
import { apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CheckoutResult {
  order: { number: string; status: string; amount: number; packageTitle: string };
  payment: { provider: string; method: string; ref: string; instructions: string; sandbox: boolean };
  message: string;
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function CheckoutPanel({ packageId, price, slotsLeft }: { packageId: string; price: number; slotsLeft: number }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  // R-078 UU PDP — persetujuan pemrosesan data wajib saat checkout.
  const [pdpConsent, setPdpConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const qty = Math.max(1, parseInt(quantity || "1", 10) || 1);
  const total = useMemo(() => price * qty, [price, qty]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 3) return setError(t("checkout.nameErr"));
    if (!/^[+\-\s()0-9]{8,20}$/.test(phone.trim())) return setError(t("checkout.phoneErr"));
    if (!pdpConsent) return setError(t("checkout.pdpConsent"));
    setSending(true);
    try {
      const res = await apiSend<CheckoutResult>("/api/checkout", "POST", {
        packageId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        quantity: qty,
        notes: notes.trim() || undefined,
        pdpConsent,
      });
      // Simpan nomor WhatsApp agar auto-lacak di #/pesanan?no=… langsung jalan.
      try {
        sessionStorage.setItem("muhdin-order-phone", phone.trim());
      } catch {
        /* storage non-kritis */
      }
      setResult(res);
    } catch (err) {
      setError((err as Error).message || t("checkout.genericErr"));
    } finally {
      setSending(false);
    }
  };

  if (result) {
    const waMsg = encodeURIComponent(
      `Assalamu'alaikum, saya sudah membuat pesanan ${result.order.number} (${result.order.packageTitle}) sebesar ${rupiah(result.order.amount)}. Mohon konfirmasinya. Terima kasih.`
    );
    return (
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6 shadow-sm" data-testid="checkout-result">
        <div className="py-2 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15">
            <Icon name="check-circle-2" className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-extrabold">{t("checkout.successTitle")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.message}</p>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border bg-background p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{t("checkout.orderNoLabel")}</span>
            <code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-extrabold tracking-wide text-primary" data-testid="order-number">
              {result.order.number}
            </code>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{t("checkout.amountLabel")}</span>
            <span className="text-sm font-extrabold text-gold-deep">{rupiah(result.order.amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{t("checkout.refLabel")}</span>
            <code className="text-[11px] text-muted-foreground">{result.payment.ref}</code>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-muted/60 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t("checkout.instructions")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.payment.instructions}</p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => navigate(`pesanan?no=${result.order.number}`)}
            className="h-11 w-full justify-center bg-gradient-to-r from-primary to-forest text-white shadow-lg"
            data-testid="track-order-btn"
          >
            <Icon name="search" className="mr-2 h-4 w-4" aria-hidden />
            {t("checkout.trackBtn")}
          </Button>
          <a
            href={`https://wa.me/${BRAND.whatsappIntl}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border text-xs font-bold text-primary transition hover:bg-primary/5"
          >
            <Icon name="message-circle" className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t("checkout.whatsappBtn")}
          </a>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setName("");
              setPhone("");
              setEmail("");
              setQuantity("1");
              setNotes("");
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("checkout.again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6 shadow-sm" data-testid="checkout-panel">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="wallet" className="h-5 w-5 text-primary" aria-hidden />
          {t("checkout.title")}
        </h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("checkout.desc")}</p>
      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-gold-deep">
        <Icon name="shield-check" className="h-3 w-3" aria-hidden />
        {t("checkout.sandboxBadge")}
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="ck-name">{t("checkout.name")} *</Label>
          <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} required className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ck-phone">{t("checkout.phone")} *</Label>
            <Input id="ck-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812…" required className="h-10" inputMode="tel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ck-qty">{t("checkout.quantity")} *</Label>
            <Input
              id="ck-qty"
              type="number"
              min={1}
              max={Math.max(1, slotsLeft)}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="h-10"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ck-email">{t("checkout.email")}</Label>
          <Input id="ck-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ck-note">{t("checkout.note")}</Label>
          <Textarea id="ck-note" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={t("checkout.notePlaceholder")} />
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-3">
          <span className="text-xs font-semibold text-muted-foreground">{t("checkout.total")}</span>
          <span className={cn("text-base font-extrabold text-gold-deep")} data-testid="checkout-total">{rupiah(total)}</span>
        </div>

        {/* R-078 UU PDP — persetujuan pemrosesan data (wajib) */}
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={pdpConsent}
            onChange={(e) => setPdpConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-700"
            required
            data-testid="checkout-consent"
          />
          <span>{t("checkout.pdpConsent")}</span>
        </label>

        {error && (
          <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <Icon name="alert-triangle" className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={sending}
          className="h-12 w-full bg-gradient-to-r from-gold to-gold-deep text-base text-white shadow-lg"
          data-testid="checkout-submit"
        >
          {sending ? (
            <>
              <Icon name="loader-2" className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t("checkout.submitting")}
            </>
          ) : (
            <>
              <Icon name="wallet" className="mr-2 h-4 w-4" aria-hidden />
              {t("checkout.submit")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
