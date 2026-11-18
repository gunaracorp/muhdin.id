"use client";

/**
 * R-045 (v14.1) — CMS "Rombongan B2B": kartu ringkasan + tabel group order
 * dengan keputusan panitia (CONFIRMED/CANCELLED) dan rincian anggota.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GroupOrderRow {
  id: string;
  code: string;
  groupName: string;
  coordinatorName: string;
  coordinatorPhone: string;
  packageTitle: string;
  departureDate: string | null;
  memberNames: string;
  memberCount: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  notes: string;
  createdAt: string;
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
  CONFIRMED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function AdminGroupOrders() {
  const { toast } = useToast();
  const [rows, setRows] = useState<GroupOrderRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await apiGet<GroupOrderRow[]>("/api/group-orders");
      setRows(list);
    } catch {
      toast({ title: "Gagal memuat rombongan.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, status: string) {
    setBusy(true);
    try {
      await apiSend(`/api/group-orders/${id}`, "PATCH", { status });
      toast({ title: `Rombongan → ${status}. Koordinator dapat memantau via kode.` });
      await load();
    } catch {
      toast({ title: "Gagal memutuskan rombongan.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const totalPax = rows.filter((r) => r.status === "CONFIRMED").reduce((a, r) => a + r.memberCount, 0);
  const totalValue = rows.filter((r) => r.status === "CONFIRMED").reduce((a, r) => a + r.totalAmount, 0);

  const cards = [
    { label: "Pengajuan Rombongan", value: String(rows.length), icon: "users", tone: "primary" },
    { label: "Menunggu Konfirmasi", value: String(rows.filter((r) => r.status === "PENDING").length), icon: "clock", tone: "gold" },
    { label: "Jamaah Terkonfirmasi", value: String(totalPax), icon: "check-circle-2", tone: "forest" },
    { label: "Nilai Tagihan Terkonfirmasi", value: rupiah(totalValue), icon: "wallet", tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="grouporder-stats">
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

      <div className="rounded-2xl border bg-card shadow-sm" data-testid="grouporder-table">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada pengajuan rombongan.</p>
        ) : (
          <div className="divide-y">
            {rows.map((r) => {
              let members: string[] = [];
              try {
                const parsed = JSON.parse(r.memberNames);
                if (Array.isArray(parsed)) members = parsed.map(String);
              } catch {
                members = [];
              }
              return (
                <div key={r.id} className="p-4" data-testid={`grouporder-row-${r.code}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">
                        <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{r.code}</code>
                        <span className="ms-2">{r.groupName}</span>
                        <Badge className={cn("ms-2 text-[10px]", STATUS_TONE[r.status])}>{r.status}</Badge>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.coordinatorName} · {r.coordinatorPhone} · {r.packageTitle} · berangkat {fmtTanggal(r.departureDate)}
                      </p>
                      <p className="mt-1 text-sm">
                        <b>{r.memberCount} jamaah</b> × {rupiah(r.unitPrice)} = <b className="text-gold-deep dark:text-gold">{rupiah(r.totalAmount)}</b>
                      </p>
                      {r.notes && <p className="mt-0.5 text-xs italic text-muted-foreground">"{r.notes}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {r.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busy} onClick={() => void decide(r.id, "CONFIRMED")} data-testid={`grouporder-confirm-${r.code}`}>
                            <Icon name="check" className="mr-1 h-3.5 w-3.5" aria-hidden />Konfirmasi
                          </Button>
                          <Button size="sm" variant="destructive" disabled={busy} onClick={() => void decide(r.id, "CANCELLED")}>
                            <Icon name="ban" className="mr-1 h-3.5 w-3.5" aria-hidden />Batalkan
                          </Button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className="text-xs font-bold text-primary hover:underline"
                        data-testid={`grouporder-members-toggle-${r.code}`}
                      >
                        {expanded === r.id ? "Tutup daftar anggota" : `Lihat ${r.memberCount} anggota`}
                      </button>
                    </div>
                  </div>
                  {expanded === r.id && (
                    <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border bg-muted/40 p-3">
                      <ol className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((m, i) => (
                          <li key={`${m}-${i}`}>
                            {String(i + 1).padStart(2, "0")}. {m}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
