"use client";

/**
 * v12.4 «LUNAS» — Halaman Pesanan Jamaah (R-010 hilir).
 * Route: #/pesanan[?no=ORD-…]
 *
 * Lacak status pesanan publik (nomor pesanan + WhatsApp pemesan), selesaikan
 * pembayaran SANDBOX saat masih PENDING, dan unduh Invoice PDF setelah LUNAS.
 * Deep-link dari konfirmasi checkout: #/pesanan?no=ORD-… → nomor terisi otomatis.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BRAND } from "@/lib/constants";
import { DetailHero } from "@/components/views/detail-shell";
import { cn } from "@/lib/utils";

interface TrackResult {
  order: {
    number: string;
    packageTitle: string;
    memberName: string;
    customerName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    status: string;
    createdAt: string;
    paidAt: string | null;
  };
  payment: { method: string; provider: string; status: string } | null;
  invoice: { number: string; issuedAt: string } | null;
  sandbox: boolean;
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  PAID: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  CANCELLED: "bg-red-500/10 text-red-700 border-red-500/30",
  REFUNDED: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  EXPIRED: "bg-zinc-500/10 text-zinc-600 border-zinc-500/30",
};

const STATUS_ICON: Record<string, string> = {
  PENDING: "clock",
  PAID: "check-circle-2",
  CANCELLED: "ban",
  REFUNDED: "rotate",
  EXPIRED: "alert-triangle",
};

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PesananView() {
  const { t } = useT();
  const { toast } = useToast();
  const [no, setNo] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);

  // Deep-link: #/pesanan?no=ORD-… → isikan nomor otomatis.
  useEffect(() => {
    try {
      const raw = window.location.hash.replace(/^#\/?/, "");
      const qs = raw.includes("?") ? raw.split("?")[1] : "";
      if (qs) {
        const p = new URLSearchParams(qs);
        const orderNo = p.get("no") || "";
        if (orderNo) {
          setNo(orderNo);
          try {
            const saved = sessionStorage.getItem("muhdin-order-phone");
            if (saved) setPhone(saved);
          } catch {
            /* storage non-kritis */
          }
        }
      }
    } catch {
      /* abaikan */
    }
    setLoadingLink(false);
  }, []);

  const track = useCallback(
    async (orderNo: string, phoneNo: string) => {
      setError("");
      if (!orderNo.trim() || !phoneNo.trim()) return;
      setBusy(true);
      try {
        const res = await apiGet<TrackResult>(
          `/api/orders/track?no=${encodeURIComponent(orderNo.trim())}&phone=${encodeURIComponent(phoneNo.trim())}`
        );
        setResult(res);
        try {
          sessionStorage.setItem("muhdin-order-phone", phoneNo.trim());
        } catch {
          /* abaikan */
        }
      } catch (err) {
        setResult(null);
        const msg = (err as Error).message || t("pesanan.genericErr");
        setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [t]
  );

  // Auto-lacak saat datang dari deep-link konfirmasi checkout.
  useEffect(() => {
    if (!loadingLink && no && phone) void track(no, phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingLink]);

  const paySandbox = async () => {
    if (!result) return;
    setBusy(true);
    try {
      const res = await apiSend<{ applied: boolean; message: string }>("/api/payments/simulate", "POST", {
        orderNumber: result.order.number,
        phone,
      });
      if (res.applied) {
        toast({ title: t("pesanan.sandboxDone"), description: res.message });
      }
      await track(result.order.number, phone);
    } catch (err) {
      setError((err as Error).message || t("pesanan.genericErr"));
    } finally {
      setBusy(false);
    }
  };

  const status = result?.order.status ?? "";
  const isPaid = status === "PAID";

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("pesanan.eyebrow")}
        title={t("pesanan.title")}
        subtitle={t("pesanan.subtitle")}
        backTo="/paket"
        backLabel={t("pesanan.backToPackages")}
      />

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Form lacak */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void track(no, phone);
              }}
              className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <div className="space-y-1.5">
                <Label htmlFor="tr-no">{t("pesanan.noLabel")}</Label>
                <Input
                  id="tr-no"
                  value={no}
                  onChange={(e) => setNo(e.target.value)}
                  placeholder={t("pesanan.noPlaceholder")}
                  required
                  className="h-11 font-mono text-sm uppercase"
                  data-testid="track-no"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tr-phone">{t("pesanan.phoneLabel")}</Label>
                <Input
                  id="tr-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("pesanan.phonePlaceholder")}
                  required
                  className="h-11"
                  inputMode="tel"
                  data-testid="track-phone"
                />
              </div>
              <Button type="submit" disabled={busy} className="h-11 bg-gradient-to-r from-primary to-forest text-white shadow-md" data-testid="track-submit">
                {busy ? (
                  <>
                    <Icon name="loader-2" className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    {t("pesanan.searching")}
                  </>
                ) : (
                  <>
                    <Icon name="search" className="mr-2 h-4 w-4" aria-hidden />
                    {t("pesanan.search")}
                  </>
                )}
              </Button>
            </form>
            {error && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" data-testid="track-error">
                <Icon name="alert-triangle" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {error}
              </p>
            )}
          </div>

          {/* Hasil */}
          {busy && !result && (
            <Skeleton className="mt-6 h-64 rounded-2xl" />
          )}
          {result && (
            <div className="mt-6 rounded-2xl border bg-card shadow-sm" data-testid="track-result">
              {/* Kepala status */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t("pesanan.noLabel")}</p>
                  <code className="text-base font-extrabold text-primary" data-testid="result-order-number">{result.order.number}</code>
                </div>
                <Badge variant="outline" className={cn("px-3 py-1.5 text-xs font-extrabold", STATUS_TONE[status] ?? "")} data-testid="result-status">
                  <Icon name={STATUS_ICON[status] ?? "info"} className="mr-1 h-3.5 w-3.5" aria-hidden />
                  {t(`pesanan.status.${status}`)}
                </Badge>
              </div>

              <p className="border-b bg-muted/40 px-5 py-3 text-xs leading-relaxed text-muted-foreground">
                {t(`pesanan.statusHint.${status}`)}
              </p>

              {/* Rincian */}
              <div className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2">
                {[
                  { label: t("pesanan.packageLabel"), value: result.order.packageTitle },
                  { label: t("pesanan.organizerLabel"), value: result.order.memberName || "—" },
                  { label: t("pesanan.paxLabel"), value: `${result.order.quantity} jamaah` },
                  { label: t("pesanan.amountLabel"), value: rupiah(result.order.amount), gold: true },
                  { label: t("pesanan.orderDateLabel"), value: fmtDate(result.order.createdAt) },
                  { label: t("pesanan.paidDateLabel"), value: fmtDate(result.order.paidAt) },
                  ...(result.payment ? [{ label: t("pesanan.methodLabel"), value: `${result.payment.method} · ${result.payment.provider}` }] : []),
                  ...(result.invoice ? [{ label: t("pesanan.invoiceLabel"), value: result.invoice.number }] : []),
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-3 sm:justify-start">
                    <span className="w-32 shrink-0 text-xs font-semibold text-muted-foreground">{r.label}</span>
                    <span className={cn("text-sm font-bold", r.gold ? "text-gold-deep" : "")} data-gold={r.gold || undefined}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Aksi */}
              <div className="flex flex-col gap-3 border-t p-5">
                {isPaid && result.invoice && (
                  <a
                    href={`/api/invoices/${encodeURIComponent(result.invoice.number)}?phone=${encodeURIComponent(phone.trim())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-forest text-sm font-bold text-white shadow-lg transition hover:opacity-95"
                    data-testid="invoice-download"
                  >
                    <Icon name="download" className="mr-2 h-4 w-4" aria-hidden />
                    {t("pesanan.invoiceDownload")}
                  </a>
                )}

                {status === "PENDING" && result.sandbox && (
                  <div className="rounded-xl border border-gold/40 bg-gold/5 p-4" data-testid="sandbox-panel">
                    <p className="flex items-center gap-1.5 text-sm font-extrabold">
                      <Icon name="wallet" className="h-4 w-4 text-gold-deep" aria-hidden />
                      {t("pesanan.sandboxTitle")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("pesanan.sandboxDesc")}</p>
                    <Button
                      type="button"
                      onClick={() => void paySandbox()}
                      disabled={busy}
                      className="mt-3 h-11 w-full justify-center bg-gradient-to-r from-gold to-gold-deep text-white shadow-md"
                      data-testid="sandbox-pay"
                    >
                      {busy ? (
                        <>
                          <Icon name="loader-2" className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          {t("pesanan.sandboxPaying")}
                        </>
                      ) : (
                        <>
                          <Icon name="check-circle-2" className="mr-2 h-4 w-4" aria-hidden />
                          {t("pesanan.sandboxPay")}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("paket")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    ← {t("pesanan.backToPackages")}
                  </button>
                  <a
                    href={`https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(`Assalamu'alaikum, saya ingin menanyakan pesanan ${result.order.number}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <Icon name="message-circle" className="h-3.5 w-3.5" aria-hidden />
                    {t("pesanan.waBtn")}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
