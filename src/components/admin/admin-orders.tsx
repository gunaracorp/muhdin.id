"use client";

/**
 * v12.4 «LUNAS» — CMS PESANAN & INVOICE.
 *
 * Satu panel untuk mengoperasikan hasil checkout jamaah:
 *   • 4 kartu statistik: total order, lunas, menunggu bayar, pendapatan.
 *   • Filter status + tabel pesanan 200 terakhir (nomor, paket, pelanggan,
 *     qty, nominal, status, provider/ref, nomor invoice).
 *   • Aksi admin: batalkan (PENDING), buka kembali (CANCELLED), tandai refund
 *     (PAID), unduh invoice PDF (PAID) — semua via API guardRole.
 *
 * Data nyata: GET /api/orders, PUT /api/orders/[id] (SUPER_ADMIN/ADMIN/VERIFIKATOR).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface OrderRow {
  id: string;
  number: string;
  packageId: string | null;
  packageTitle: string;
  memberName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: string;
  paymentProvider: string;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
  invoice: { number: string; issuedAt: string } | null;
  payments: { method: string; status: string; providerRef: string | null }[];
}

interface OrdersPayload {
  stats: { total: number; paid: number; pending: number; closed: number; revenue: number };
  orders: OrderRow[];
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  PAID: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  CANCELLED: "bg-red-500/10 text-red-700 border-red-500/30",
  REFUNDED: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  EXPIRED: "bg-zinc-500/10 text-zinc-600 border-zinc-500/30",
};

const FILTERS = ["all", "PENDING", "PAID", "CANCELLED", "REFUNDED"] as const;

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminOrders() {
  const { toast } = useToast();
  const [data, setData] = useState<OrdersPayload | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (f: string = filter) => {
    try {
      const res = await apiGet<OrdersPayload>(`/api/orders?status=${f}`);
      setData(res);
    } catch {
      setData({ stats: { total: 0, paid: 0, pending: 0, closed: 0, revenue: 0 }, orders: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const act = async (order: OrderRow, action: string) => {
    setActing(order.id);
    try {
      await apiSend(`/api/orders/${order.id}`, "PUT", { action });
      toast({ title: "Berhasil", description: `${order.number}: status diperbarui.` });
      await load(filter);
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const stats = data?.stats;
  const cards = [
    { icon: "package", label: "Total pesanan", value: stats ? String(stats.total) : "—", tone: "text-primary" },
    { icon: "check-circle-2", label: "Lunas", value: stats ? String(stats.paid) : "—", tone: "text-emerald-600" },
    { icon: "clock", label: "Menunggu bayar", value: stats ? String(stats.pending) : "—", tone: "text-amber-600" },
    { icon: "wallet", label: "Pendapatan (lunas)", value: stats ? rupiah(stats.revenue) : "—", tone: "text-gold-deep" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold">
          <Icon name="wallet" className="h-5 w-5 text-primary" aria-hidden />
          Pesanan &amp; Invoice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hasil checkout jamaah (R-010/R-038/R-039) — status pembayaran live dari gateway, invoice PDF otomatis.
        </p>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <Icon name={c.icon} className={cn("h-4.5 w-4.5", c.tone)} aria-hidden />
            <p className="mt-2 text-2xl font-extrabold tabular-nums" data-testid={`stat-${c.label}`}>{c.value}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filter status */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status pesanan">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              filter === f ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
            )}
          >
            {f === "all" ? "Semua" : f}
          </button>
        ))}
      </div>

      {/* Tabel pesanan */}
      {!data ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : data.orders.length === 0 ? (
        <div className="rounded-2xl border bg-muted/30 p-10 text-center">
          <Icon name="inbox" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Belum ada pesanan pada filter ini.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-start text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-start font-bold">Nomor</th>
                  <th className="px-4 py-3 text-start font-bold">Paket / Pelanggan</th>
                  <th className="px-4 py-3 text-start font-bold">Qty</th>
                  <th className="px-4 py-3 text-start font-bold">Nominal</th>
                  <th className="px-4 py-3 text-start font-bold">Status</th>
                  <th className="px-4 py-3 text-start font-bold">Invoice</th>
                  <th className="px-4 py-3 text-start font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody data-testid="orders-tbody">
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 align-top transition hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <code className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-extrabold text-primary">{o.number}</code>
                      <p className="mt-1 text-[11px] text-muted-foreground">{fmtDate(o.createdAt)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {o.paymentProvider}
                        {o.payments[0] ? ` · ${o.payments[0].method}` : ""}
                      </p>
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="line-clamp-1 font-bold" title={o.packageTitle}>{o.packageTitle}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.customerName} · {o.customerPhone}
                      </p>
                      {o.memberName && <p className="text-[11px] text-muted-foreground">oleh {o.memberName}</p>}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{o.quantity}</td>
                    <td className="px-4 py-3 font-extrabold text-gold-deep tabular-nums">{rupiah(o.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px] font-extrabold", STATUS_TONE[o.status] ?? "")}>
                        {o.status}
                      </Badge>
                      {o.paidAt && <p className="mt-1 text-[10px] text-muted-foreground">{fmtDate(o.paidAt)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {o.invoice ? (
                        <a
                          href={`/api/invoices/${encodeURIComponent(o.invoice.number)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <Icon name="download" className="h-3 w-3" aria-hidden />
                          {o.invoice.number}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {o.status === "PENDING" && (
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]" disabled={acting === o.id} onClick={() => void act(o, "cancel")}>
                            <Icon name="ban" className="mr-1 h-3 w-3" aria-hidden /> Batalkan
                          </Button>
                        )}
                        {o.status === "CANCELLED" && (
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]" disabled={acting === o.id} onClick={() => void act(o, "reopen")}>
                            <Icon name="rotate" className="mr-1 h-3 w-3" aria-hidden /> Buka
                          </Button>
                        )}
                        {o.status === "PAID" && (
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]" disabled={acting === o.id} onClick={() => void act(o, "refund")}>
                            <Icon name="rotate" className="mr-1 h-3 w-3" aria-hidden /> Refund
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
