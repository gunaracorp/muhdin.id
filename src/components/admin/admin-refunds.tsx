"use client";

/**
 * R-044 (v14.1) — CMS "Refund & Pembatalan": kartu ringkasan, tabel
 * pengajuan, keputusan panitia (Setujui/Tolak/Terbayar) + catatan.
 * Persen & nominal disetujui DIVERIFIKASI ULANG server-side saat APPROVED.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RefundRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  packageTitle: string;
  departureDate: string | null;
  amountPaid: number;
  tier: string;
  percentApproved: number;
  approvedAmount: number;
  reason: string;
  status: string;
  adminNote: string;
  decidedAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  paid: number;
  rejected: number;
  totalApprovedAmount: number;
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function fmtTanggal(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-gold/15 text-gold-deep dark:text-gold",
  APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  PAID: "bg-primary/10 text-primary",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function AdminRefunds() {
  const { toast } = useToast();
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([
        apiGet<RefundRow[]>("/api/refund-requests"),
        apiGet<{ stats: Stats }>("/api/refund-requests?stats=1"),
      ]);
      setRows(list);
      setStats(s.stats);
    } catch {
      toast({ title: "Gagal memuat pengajuan refund.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, status: string) {
    setBusy(true);
    try {
      await apiSend(`/api/refund-requests/${id}`, "PATCH", { status, adminNote: notes[id] ?? "" });
      toast({ title: `Keputusan ${status} tercatat — jejak audit dibuat.` });
      await load();
    } catch (e) {
      toast({ title: (e as Error).message || "Gagal memutuskan pengajuan.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    { label: "Pengajuan", value: stats ? String(stats.total) : "—", icon: "rotate", tone: "primary" },
    { label: "Menunggu Keputusan", value: stats ? String(stats.pending) : "—", icon: "clock", tone: "gold" },
    { label: "Disetujui / Terbayar", value: stats ? `${stats.approved}/${stats.paid}` : "—", icon: "check-circle-2", tone: "forest" },
    { label: "Total Refund Disetujui", value: stats ? rupiah(stats.totalApprovedAmount) : "—", icon: "wallet", tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="refund-stats">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{card.label}</span>
              <Icon
                name={card.icon}
                className={cn(
                  "h-4 w-4",
                  card.tone === "primary" && "text-primary",
                  card.tone === "forest" && "text-emerald-600 dark:text-emerald-400",
                  card.tone === "gold" && "text-gold-deep"
                )}
                aria-hidden
              />
            </div>
            <p className="mt-2 text-xl font-extrabold">{card.value}</p>
          </div>
        ))}
      </div>

      <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs leading-relaxed" data-testid="refund-policy-note">
        <b>Kebijakan berjenjang</b> — H−30: 100% · H−29 s.d. H−14: 70% · H−13 s.d. H−7: 50% · H−6 s.d. H−3: 25% · H−2 ke bawah: 0% (transfer rombongan dianjurkan).
        Saat SETUJUI, persen &amp; nominal dihitung ulang server-side dari tanggal keberangkatan. SLA proses 7 hari kerja; setiap keputusan tercatat di jejak audit.
      </p>

      <div className="rounded-2xl border bg-card shadow-sm" data-testid="refund-table">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada pengajuan refund.</p>
        ) : (
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="p-4" data-testid={`refund-row-${r.orderNumber}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">
                      <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{r.orderNumber}</code>
                      <Badge className={cn("ms-2 text-[10px]", STATUS_TONE[r.status])}>{r.status}</Badge>
                    </p>
                    <p className="mt-1 text-sm font-bold">{r.customerName} · {r.packageTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Terbayar {rupiah(r.amountPaid)} · Berangkat {fmtTanggal(r.departureDate)} · Tier {r.tier} ({r.percentApproved}% = {rupiah(r.approvedAmount)})
                    </p>
                    <p className="mt-1 max-w-2xl text-xs italic text-muted-foreground">"{r.reason}"</p>
                    {r.adminNote && <p className="mt-1 text-xs text-primary">Catatan panitia: {r.adminNote}</p>}
                  </div>
                  {r.status === "PENDING" && (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px]">
                      <Input
                        placeholder="Catatan keputusan (opsional)"
                        className="h-9 text-xs"
                        value={notes[r.id] ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        data-testid={`refund-note-${r.id}`}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" disabled={busy} onClick={() => void decide(r.id, "APPROVED")} data-testid={`refund-approve-${r.id}`}>
                          <Icon name="check" className="mr-1 h-3.5 w-3.5" aria-hidden />Setujui
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" disabled={busy} onClick={() => void decide(r.id, "REJECTED")}>
                          <Icon name="ban" className="mr-1 h-3.5 w-3.5" aria-hidden />Tolak
                        </Button>
                      </div>
                    </div>
                  )}
                  {r.status === "APPROVED" && (
                    <Button size="sm" disabled={busy} onClick={() => void decide(r.id, "PAID")} data-testid={`refund-paid-${r.id}`}>
                      <Icon name="wallet" className="mr-1 h-3.5 w-3.5" aria-hidden />Tandai Terbayar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
