"use client";

/**
 * Task 19 (R-078) — CMS "Permintaan PDP": antrean hak subjek data pribadi.
 * Petugas memproses (dengan catatan wajib — bukti kepatuhan UU 27/2022)
 * atau menolak. Stats di atas; baris terbaru di bawah.
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { PrivacyRequestItem } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = { PENDING: "Menunggu", PROCESSED: "Diproses", REJECTED: "Ditolak" };

export function AdminPrivacyRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState<PrivacyRequestItem[] | null>(null);
  const [stats, setStats] = useState<{ total: number; pending: number; processed: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [action, setAction] = useState<{ row: PrivacyRequestItem; status: "PROCESSED" | "REJECTED" } | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    apiGet<{ rows: PrivacyRequestItem[]; stats: { total: number; pending: number; processed: number } }>("/api/privacy-requests")
      .then((d) => {
        setRows(d.rows);
        setStats(d.stats);
      })
      .catch(() => setRows([]));
  }, []);

  useEffect(load, [load]);

  const submit = async () => {
    if (!action) return;
    setBusy(action.row.id);
    try {
      await apiSend(`/api/privacy-requests/${action.row.id}`, "PUT", { status: action.status, result: note.trim() });
      toast({ title: action.status === "PROCESSED" ? "Permintaan diproses ✓" : "Permintaan ditolak", description: action.row.name });
      setAction(null);
      setNote("");
      load();
    } catch (e) {
      toast({ title: "Gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="shield-check" className="h-5 w-5 text-primary" aria-hidden />
          Permintaan PDP (Hak Subjek Data)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kepatuhan UU No. 27/2022: akses/ekspor & penghapusan data pribadi. SLA tanggap 3×24 jam kerja.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Permintaan", value: stats?.total, icon: "inbox" },
          { label: "Menunggu Tindakan", value: stats?.pending, icon: "clock" },
          { label: "Selesai", value: stats?.processed, icon: "check-circle-2" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Icon name={s.icon} className="h-4 w-4" aria-hidden /> {s.label}
            </div>
            <p className="mt-1.5 text-2xl font-extrabold text-primary">{s.value ?? (rows ? 0 : "…")}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {!rows ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Belum ada permintaan PDP.
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={r.type === "EXPORT" ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}>
                      {r.type === "EXPORT" ? "AKSES/EKSPOR" : "PENGHAPUSAN"}
                    </Badge>
                    <Badge variant="outline" className={
                      r.status === "PENDING" ? "border-gold/40 bg-gold/10 text-gold-deep" : r.status === "PROCESSED" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : "border-destructive/40 bg-destructive/10 text-destructive"
                    }>
                      {STATUS_LABEL[r.status] || r.status}
                    </Badge>
                    <span className="font-extrabold">{r.name}</span>
                    <code className="text-[10px] text-muted-foreground">{r.id}</code>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kontak: <strong>{r.contact}</strong> · {new Date(r.createdAt).toLocaleString("id-ID")}
                  </p>
                  {r.message ? <p className="mt-1.5 text-sm text-foreground/85">“{r.message}”</p> : null}
                  {r.result ? (
                    <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <strong>Catatan:</strong> {r.result} {r.processedBy ? `— ${r.processedBy}` : ""}
                    </p>
                  ) : null}
                </div>
                {r.status === "PENDING" ? (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" className="h-8" onClick={() => { setAction({ row: r, status: "PROCESSED" }); setNote(""); }}>
                      <Icon name="check" className="h-3.5 w-3.5" aria-hidden /> Proses
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => { setAction({ row: r, status: "REJECTED" }); setNote(""); }}>
                      <Icon name="x" className="h-3.5 w-3.5" aria-hidden /> Tolak
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.status === "PROCESSED" ? "Proses Permintaan" : "Tolak Permintaan"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {action?.row.type === "EXPORT"
              ? "Pastikan identitas pemohon terverifikasi sebelum data diekspor/dikirim."
              : "Data yang diwajibkan regulasi untuk disimpan tidak dapat dihapus sebelum masa wajibnya berakhir."}
          </p>
          <div className="space-y-1.5">
            <Label>Catatan penanganan {action?.status === "PROCESSED" && "(wajib)"}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Contoh: identitas terverifikasi via WA resmi; data diekspor & dikirim terenkripsi…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Batal</Button>
            <Button onClick={submit} disabled={busy === action?.row.id || (action?.status === "PROCESSED" && !note.trim())}>
              {busy === action?.row.id ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
