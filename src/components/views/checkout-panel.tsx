"use client";

/**
 * v12.4 «LUNAS» — Panel Checkout Langsung (R-010).
 * Ditanam di kolom kanan halaman detail paket (di atas form booking panitia):
 * isi data → POST /api/checkout → order PENDING + intent pembayaran dari
 * adapter aktif → konfirmasi berisi nomor pesanan + instruksi + CTA ke
 * halaman #/pesanan (status & bayar sandbox & unduh invoice).
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CouponPreview {
  ok: boolean;
  reason: string;
  discount?: number;
  finalAmount?: number;
}

/** R-048 — paket asuransi add-on aktif dari server. */
interface InsurancePlanLite {
  code: string;
  name: string;
  provider: string;
  coverage: string;
  premium: number;
}

interface CheckoutResult {
  order: { number: string; status: string; amount: number; subtotal?: number; discountAmount?: number; couponCode?: string | null; packageTitle: string };
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
  // R-042 v14.0 — kupon kampanye: pratinjau potongan dihitung server-side;
  // nilai final tetap dihitung ulang oleh /api/checkout saat submit.
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  // R-048 v15.0.0 — asuransi perjalanan add-on (opsional).
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlanLite[]>([]);
  const [insuranceCode, setInsuranceCode] = useState("");
  // R-078 UU PDP — persetujuan pemrosesan data wajib saat checkout.
  const [pdpConsent, setPdpConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const qty = Math.max(1, parseInt(quantity || "1", 10) || 1);
  const subtotal = useMemo(() => price * qty, [price, qty]);
  // R-048 — premi asuransi: pratinjau klien; final dihitung ulang server.
  const plan = useMemo(
    () => insurancePlans.find((p) => p.code === insuranceCode) ?? null,
    [insurancePlans, insuranceCode],
  );
  const premium = plan ? plan.premium * qty : 0;
  const total =
    (couponPreview?.ok ? Math.max(0, subtotal - (couponPreview.discount ?? 0)) : subtotal) + premium;

  // R-048 — muat paket asuransi aktif (gagal-aman: panel tetap terpakai).
  useEffect(() => {
    apiGet<{ plans: InsurancePlanLite[] }>("/api/insurance-plans")
      .then((d) => setInsurancePlans(d.plans ?? []))
      .catch(() => setInsurancePlans([]));
  }, []);

  const checkCoupon = async () => {
    setError("");
    setCouponPreview(null);
    if (!couponCode.trim()) return setError(t("checkout.couponEmpty"));
    setCouponChecking(true);
    try {
      const res = await apiSend<CouponPreview>("/api/coupons/validate", "POST", {
        code: couponCode.trim(),
        amount: subtotal,
        phone: phone.trim() || undefined,
      });
      setCouponPreview(res);
      if (!res.ok) setError(t("checkout.couponInvalid"));
    } catch (err) {
      setError((err as Error).message || t("checkout.couponInvalid"));
    } finally {
      setCouponChecking(false);
    }
  };

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
        couponCode: couponPreview?.ok ? couponCode.trim() : undefined,
        insuranceCode: plan?.code || undefined, // R-048 add-on asuransi
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
          {result.order.discountAmount && result.order.discountAmount > 0 && (
            <div className="flex items-center justify-between gap-2" data-testid="order-coupon-row">
              <span className="text-xs font-semibold text-primary">{t("checkout.discountLabel")} ({result.order.couponCode})</span>
              <span className="text-xs font-bold text-primary">−{rupiah(result.order.discountAmount)}</span>
            </div>
          )}
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

        {/* R-042 v14.0 — kupon kampanye */}
        <div className="space-y-1.5">
          <Label htmlFor="ck-coupon">{t("checkout.couponLabel")}</Label>
          <div className="flex gap-2">
            <Input
              id="ck-coupon"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponPreview(null);
              }}
              placeholder={t("checkout.couponPlaceholder")}
              className="h-10 uppercase"
              data-testid="checkout-coupon"
            />
            <Button type="button" variant="outline" onClick={checkCoupon} disabled={couponChecking} className="h-10 shrink-0" data-testid="coupon-check">
              {couponChecking ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="ticket-percent" className="h-4 w-4" aria-hidden />}
              <span className="ms-1.5 text-xs">{t("checkout.couponCheck")}</span>
            </Button>
          </div>
          {couponPreview?.ok && (
            <p className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary" data-testid="coupon-ok">
              <Icon name="badge-check" className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("checkout.couponOk")} −{rupiah(couponPreview.discount ?? 0)}
            </p>
          )}
        </div>

        {/* R-048 v15.0.0 — asuransi perjalanan add-on */}
        {insurancePlans.length > 0 && (
          <div className="space-y-1.5" data-testid="insurance-block">
            <Label htmlFor="ck-insurance">{t("asuransi.label")}</Label>
            <select
              id="ck-insurance"
              value={insuranceCode}
              onChange={(e) => setInsuranceCode(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-semibold"
            >
              <option value="">{t("asuransi.none")}</option>
              {insurancePlans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} — {rupiah(p.premium)}/jamaah
                </option>
              ))}
            </select>
            {plan ? (
              <p className="flex items-start gap-1.5 rounded-lg bg-gold/10 px-3 py-2 text-xs font-semibold text-gold-deep dark:text-gold">
                <Icon name="shield-heart" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {plan.coverage} · {t("asuransi.premiumNote")} {rupiah(premium)}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">{t("asuransi.hint")}</p>
            )}
          </div>
        )}

        <div className="rounded-xl border bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{t("checkout.subtotalLabel")}</span>
            <span className="text-xs font-bold">{rupiah(subtotal)}</span>
          </div>
          {couponPreview?.ok && (couponPreview.discount ?? 0) > 0 && (
            <div className="mt-1 flex items-center justify-between" data-testid="coupon-discount-row">
              <span className="text-xs font-semibold text-primary">{t("checkout.discountLabel")} ({couponCode.trim().toUpperCase()})</span>
              <span className="text-xs font-bold text-primary">−{rupiah(couponPreview.discount ?? 0)}</span>
            </div>
          )}
          {premium > 0 && (
            <div className="mt-1 flex items-center justify-between" data-testid="insurance-premium-row">
              <span className="text-xs font-semibold text-gold-deep dark:text-gold">{t("asuransi.rowLabel")} ({plan?.name})</span>
              <span className="text-xs font-bold text-gold-deep dark:text-gold">+{rupiah(premium)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between border-t pt-2">
            <span className="text-xs font-semibold text-muted-foreground">{t("checkout.total")}</span>
            <span className={cn("text-base font-extrabold text-gold-deep")} data-testid="checkout-total">{rupiah(total)}</span>
          </div>
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
