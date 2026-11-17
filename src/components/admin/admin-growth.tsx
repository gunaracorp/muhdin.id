"use client";

/**
 * Task 19 (R-094 + R-047) — CMS dua tab:
 *  1. Broadcast WA  — template {{nama}}/{{tanggal}}, audience opt-in,
 *     jadwal/kirim-sekarang, status & hitungan terkirim.
 *  2. Skor Vendor   — tabel skor kualitas penyelenggara + tombol hitung ulang.
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BroadcastItem, VendorScoreRow } from "@/lib/types";

const AUDIENCE_LABEL: Record<string, string> = {
  ALL_MEMBERS: "Semua Anggota (WA tersimpan)",
  KTA_ACTIVE: "Pemegang KTA Aktif",
  PENDING_ORDERS: "Pelanggan Order Menunggu Bayar",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf", SCHEDULED: "Terjadwal", SENDING: "Mengirim…",
  SENT: "Terkirim", FAILED: "Gagal", CANCELLED: "Dibatalkan",
};

const GRADE_CLS: Record<string, string> = {
  A: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  B: "border-primary/30 bg-primary/10 text-primary",
  C: "border-gold/40 bg-gold/10 text-gold-deep",
  D: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function AdminGrowth() {
  const { toast } = useToast();
  const [tab, setTab] = useState("broadcast");

  /* ---------- Broadcast ---------- */
  const [rows, setRows] = useState<BroadcastItem[] | null>(null);
  const [form, setForm] = useState({ title: "", template: "Assalamu'alaikum {{nama}},\n\n{{tanggal}}: ", audience: "ALL_MEMBERS", scheduledAt: "" });
  const [busy, setBusy] = useState<string | null>(null);

  const loadBc = useCallback(() => {
    apiGet<{ rows: BroadcastItem[] }>("/api/broadcasts").then((d) => setRows(d.rows)).catch(() => setRows([]));
  }, []);
  useEffect(loadBc, [loadBc]);

  const createBc = async (action: "DRAFT" | "SCHEDULED") => {
    setBusy("create");
    try {
      await apiSend("/api/broadcasts", "POST", { ...form, action });
      toast({ title: action === "DRAFT" ? "Broadcast tersimpan sebagai draf ✓" : "Broadcast dijadwalkan ✓", description: form.title });
      setForm({ ...form, title: "", scheduledAt: "" });
      loadBc();
    } catch (e) {
      toast({ title: "Gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const bcAction = async (id: string, action: "send" | "CANCELLED") => {
    setBusy(id);
    try {
      const res = action === "send"
        ? await apiSend<{ message?: string }>(`/api/broadcasts/${id}`, "POST")
        : await apiSend<{ message?: string }>(`/api/broadcasts/${id}`, "PUT", { action });
      toast({ title: "Selesai ✓", description: res?.message || "Status diperbarui" });
      loadBc();
    } catch (e) {
      toast({ title: "Gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  /* ---------- Vendor scores ---------- */
  const [vendors, setVendors] = useState<VendorScoreRow[] | null>(null);
  const [recalcing, setRecalcing] = useState(false);

  const loadVendors = useCallback(() => {
    apiGet<{ rows: typeof vendors }>("/api/vendor-scores").then((d) => setVendors(d.rows)).catch(() => setVendors([]));
  }, []);
  useEffect(loadVendors, [loadVendors]);

  const recalc = async () => {
    setRecalcing(true);
    try {
      const res = await apiSend<{ updated: number }>("/api/vendor-scores", "POST", {});
      toast({ title: `Skor ${res.updated} anggota diperbarui ✓` });
      loadVendors();
    } catch (e) {
      toast({ title: "Gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRecalcing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="radio-tower" className="h-5 w-5 text-primary" aria-hidden />
          Broadcast WA & Skor Vendor
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pesan massal template resmi ke audiens opt-in, dan penilaian kualitas penyelenggara dari ulasan, keluhan, dan katalog.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="broadcast">Broadcast WA</TabsTrigger>
          <TabsTrigger value="vendor">Skor Vendor</TabsTrigger>
        </TabsList>

        {/* ============ BROADCAST ============ */}
        <TabsContent value="broadcast" className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Judul kampanye (internal)</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Info Keberangkatan Desember" />
              </div>
              <div className="space-y-1.5">
                <Label>Audiens (opt-in)</Label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {Object.entries(AUDIENCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Template pesan — gunakan {"{{nama}}"} dan {"{{tanggal}}"}</Label>
                <Textarea value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} rows={5} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Jadwal kirim (opsional — untuk SCHEDULED)</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => createBc("DRAFT")} disabled={busy === "create"}>
                <Icon name="file-text" className="h-4 w-4" aria-hidden /> Simpan Draf
              </Button>
              <Button variant="outline" onClick={() => createBc("SCHEDULED")} disabled={busy === "create" || !form.scheduledAt}>
                <Icon name="clock" className="h-4 w-4" aria-hidden /> Jadwalkan
              </Button>
            </div>
          </div>

          {!rows ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada broadcast.</div>
          ) : (
            rows.map((b) => (
              <div key={b.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn(
                        b.status === "SENT" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                          : b.status === "SCHEDULED" ? "border-gold/40 bg-gold/10 text-gold-deep"
                          : b.status === "FAILED" ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-border"
                      )}>
                        {STATUS_LABEL[b.status] || b.status}
                      </Badge>
                      <span className="font-extrabold">{b.title}</span>
                      <Badge variant="outline" className="text-[10px]">{AUDIENCE_LABEL[b.audience] || b.audience}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.template}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {b.status === "SENT" ? `${b.sentCount} terkirim · ${b.failCount} gagal · ${b.sentAt ? new Date(b.sentAt).toLocaleString("id-ID") : ""}` : b.scheduledAt ? `Jadwal: ${new Date(b.scheduledAt).toLocaleString("id-ID")}` : "Belum dijadwalkan"}
                    </p>
                  </div>
                  {b.status !== "SENT" && b.status !== "SENDING" ? (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" className="h-8" disabled={busy === b.id} onClick={() => bcAction(b.id, "send")}>
                        <Icon name="send" className="h-3.5 w-3.5" aria-hidden /> Kirim Sekarang
                      </Button>
                      {b.status !== "CANCELLED" ? (
                        <Button size="sm" variant="outline" className="h-8" disabled={busy === b.id} onClick={() => bcAction(b.id, "CANCELLED")}>Batalkan</Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* ============ SKOR VENDOR ============ */}
        <TabsContent value="vendor" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Skor = 60% ulasan jamaah + 25% kesehatan keluhan + 15% aktivitas katalog. Grade A ≥85, B ≥70, C ≥55.
            </p>
            <Button onClick={recalc} disabled={recalcing}>
              {recalcing ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="refresh" className="h-4 w-4" aria-hidden />}
              <span className="ml-2">Hitung Ulang</span>
            </Button>
          </div>

          {!vendors ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-start text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-start font-bold">Anggota</th>
                    <th className="px-4 py-3 text-start font-bold">Ulasan</th>
                    <th className="px-4 py-3 text-start font-bold">Keluhan</th>
                    <th className="px-4 py-3 text-start font-bold">Paket</th>
                    <th className="px-4 py-3 text-start font-bold">Skor</th>
                    <th className="px-4 py-3 text-start font-bold">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-bold">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">{m.type} · {m.city}</p>
                      </td>
                      <td className="px-4 py-3">{m.reviewCount ?? 0}× {m.avgRating ? `(⭐ ${m.avgRating})` : ""}</td>
                      <td className="px-4 py-3">{m.complaintCount ?? 0}</td>
                      <td className="px-4 py-3">{m.publishedPackages ?? 0}</td>
                      <td className="px-4 py-3 font-extrabold text-gold-deep">{m.score ?? m.qualityScore ?? "—"}</td>
                      <td className="px-4 py-3">
                        {m.grade || m.qualityGrade ? (
                          <Badge variant="outline" className={cn("text-[10px] font-black", GRADE_CLS[m.grade || m.qualityGrade || "D"])}>
                            {m.grade || m.qualityGrade}
                          </Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
