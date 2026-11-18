"use client";

/**
 * R-050 v15.0.0 «GOD MODE» — CMS "Escrow Pembayaran": pantau dana HELD dan
 * putuskan RELEASE (lepas ke penyelenggara setelah layanan terverifikasi)
 * atau REFUND (kembalikan ke jamaah). HELD dibuat otomatis saat LUNAS;
 * REFUND otomatis saat refund disetujui. Keputusan ber-audit.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface EscrowRow {
  id: string;
  orderNumber: string;
  amount: number;
  state: "HELD" | "RELEASED" | "REFUNDED";
  reason: string | null;
  actor: string | null;
  updatedAt: string;
}

interface EscrowData {
  summary: { held: number; released: number; refunded: number; total: number };
  rows: EscrowRow[];
}

const STATE_TONE: Record<EscrowRow["state"], string> = {
  HELD: "bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300",
  RELEASED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40 dark:text-emerald-300",
  REFUNDED: "bg-sky-500/10 text-sky-700 border-sky-500/40 dark:text-sky-300",
};

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function AdminEscrow() {
  const { toast } = useToast();
  const { t } = useT();
  const [data, setData] = useState<EscrowData | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    apiGet<EscrowData>("/api/escrow")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const putuskan = async (row: EscrowRow, action: "RELEASE" | "REFUND") => {
    try {
      const res = await apiSend<{ message: string }>("/api/escrow", "POST", {
        orderNumber: row.orderNumber,
        action,
        reason: reason.trim() || undefined,
      });
      toast({ title: t("adminEscrow.decided"), description: res.message });
      setReason("");
      load();
    } catch (e) {
      toast({ title: t("adminEscrow.fail"), description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4" data-testid="admin-escrow">
      <div>
        <h2 className="text-lg font-extrabold">{t("adminEscrow.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("adminEscrow.desc")}</p>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border bg-card p-4 text-center">
            <p className="text-xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{rupiah(data.summary.held)}</p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{t("adminEscrow.held")}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 text-center">
            <p className="text-xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{rupiah(data.summary.released)}</p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{t("adminEscrow.released")}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 text-center">
            <p className="text-xl font-extrabold tabular-nums text-sky-600 dark:text-sky-400">{rupiah(data.summary.refunded)}</p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{t("adminEscrow.refunded")}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 text-center">
            <p className="text-xl font-extrabold tabular-nums">{data.summary.total}</p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{t("adminEscrow.count")}</p>
          </div>
        </div>
      )}

      {!data ? (
        <p className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">{t("adminEscrow.loading")}</p>
      ) : data.rows.length === 0 ? (
        <p className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">{t("adminEscrow.empty")}</p>
      ) : (
        <>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("adminEscrow.reasonPh")}
            className="max-w-md"
            data-testid="escrow-reason"
          />
          <ul className="space-y-2">
            {data.rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="font-extrabold" dir="ltr">
                    {r.orderNumber} <span className="text-sm font-bold text-gold-deep dark:text-gold">· {rupiah(r.amount)}</span>
                  </p>
                  {r.reason && <p className="text-[11px] text-muted-foreground">{r.reason} — {r.actor}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", STATE_TONE[r.state])}>{r.state}</Badge>
                  {r.state === "HELD" && (
                    <>
                      <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => putuskan(r, "RELEASE")} data-testid={`escrow-release-${r.orderNumber}`}>
                        <Icon name="lock" className="h-3.5 w-3.5" aria-hidden />
                        <span className="ms-1">{t("adminEscrow.release")}</span>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => putuskan(r, "REFUND")} data-testid={`escrow-refund-${r.orderNumber}`}>
                        {t("adminEscrow.refund")}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
