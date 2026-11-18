"use client";

/**
 * R-090 (v14.1) — CMS "Kemitraan Masjid & Komunitas": kartu statistik,
 * keputusan pendaftaran (Aktifkan/Suspensi), catatan relasi, dan pencatatan
 * aktivitas kemitraan (kajian/tabarruj/pelatihan/umrah bersama).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PartnerRow {
  id: string;
  code: string;
  name: string;
  type: string;
  city: string;
  province: string;
  picName: string;
  phone: string;
  reach: number;
  status: string;
  program: string;
  notes: string;
  _count: { activities: number };
}
interface Stats {
  total: number;
  active: number;
  pending: number;
  totalReach: number;
  totalActivities: number;
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-gold/15 text-gold-deep dark:text-gold",
  ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

export function AdminMosquePartners() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activityFor, setActivityFor] = useState<PartnerRow | null>(null);
  const [aTitle, setATitle] = useState("");
  const [aType, setAType] = useState("KAJIAN");
  const [aDate, setADate] = useState("");
  const [aAttendance, setAAttendance] = useState("50");

  const load = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([
        apiGet<PartnerRow[]>("/api/mosque-partners"),
        apiGet<{ stats: Stats }>("/api/mosque-partners?stats=1"),
      ]);
      setPartners(list);
      setStats(s.stats);
    } catch {
      toast({ title: "Gagal memuat mitra masjid.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(p: PartnerRow, status: string) {
    setBusy(true);
    try {
      await apiSend(`/api/mosque-partners/${p.id}`, "PATCH", { status, notes: notes[p.id] ?? p.notes });
      toast({ title: `${p.name} → ${status}. Dashboard relasi mitra ikut berubah.` });
      await load();
    } catch {
      toast({ title: "Gagal memperbarui mitra.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function addActivity() {
    if (!activityFor) return;
    setBusy(true);
    try {
      await apiSend("/api/mosque-partners/activities", "POST", {
        partnerId: activityFor.id,
        type: aType,
        title: aTitle,
        date: aDate,
        attendance: Number(aAttendance || 0),
      });
      toast({ title: "Aktivitas kemitraan tercatat." });
      setActivityFor(null);
      setATitle("");
      await load();
    } catch (e) {
      toast({ title: (e as Error).message || "Gagal mencatat aktivitas.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    { label: "Mitra Terdaftar", value: stats ? String(stats.total) : "—", icon: "landmark", tone: "primary" },
    { label: "Aktif", value: stats ? String(stats.active) : "—", icon: "badge-check", tone: "forest" },
    { label: "Menunggu Verifikasi", value: stats ? String(stats.pending) : "—", icon: "clock", tone: "gold" },
    { label: "Jangkauan Gabungan/bulan", value: stats ? String(stats.totalReach) : "—", icon: "users", tone: "primary" },
    { label: "Aktivitas Tercatat", value: stats ? String(stats.totalActivities) : "—", icon: "calendar", tone: "gold" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="mosque-stats">
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

      <div className="rounded-2xl border bg-card shadow-sm" data-testid="mosque-table">
        {partners.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada pendaftaran mitra.</p>
        ) : (
          <div className="divide-y">
            {partners.map((p) => (
              <div key={p.id} className="p-4" data-testid={`mosque-row-${p.code}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">
                      <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{p.code}</code>
                      <span className="ms-2">{p.name}</span>
                      <Badge className={cn("ms-2 text-[10px]", STATUS_TONE[p.status])}>{p.status}</Badge>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.type} · {p.city}{p.province ? `, ${p.province}` : ""} · PIC {p.picName} · {p.phone} · jangkauan {p.reach}/bulan · program {p.program}
                    </p>
                    {p.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{p.notes}"</p>}
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[320px]">
                    <Input
                      placeholder="Catatan relasi sekretariat…"
                      className="h-9 text-xs"
                      defaultValue={p.notes}
                      onBlur={(e) => setNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      {p.status !== "ACTIVE" && (
                        <Button size="sm" disabled={busy} onClick={() => void decide(p, "ACTIVE")} data-testid={`mosque-activate-${p.code}`}>
                          <Icon name="check" className="mr-1 h-3.5 w-3.5" aria-hidden />Aktifkan
                        </Button>
                      )}
                      {p.status === "ACTIVE" && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide(p, "SUSPENDED")}>
                          <Icon name="ban" className="mr-1 h-3.5 w-3.5" aria-hidden />Suspensi
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setActivityFor(p)} data-testid={`mosque-activity-${p.code}`}>
                        <Icon name="calendar" className="mr-1 h-3.5 w-3.5" aria-hidden />Catat Aktivitas ({p._count.activities})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog catat aktivitas */}
      <Dialog open={!!activityFor} onOpenChange={(o) => !o && setActivityFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Aktivitas — {activityFor?.name}</DialogTitle>
            <DialogDescription>Log kegiatan kemitraan tampil di dashboard relasi mitra (kode MHD-MP).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Jenis Aktivitas</Label>
              <select value={aType} onChange={(e) => setAType(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="KAJIAN">Kajian</option>
                <option value="TABARRUJ">Tabarruj</option>
                <option value="PELATIHAN">Pelatihan</option>
                <option value="UMRAH_BERSAMA">Umrah Bersama</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Judul</Label>
              <Input value={aTitle} onChange={(e) => setATitle(e.target.value)} placeholder="Kajian Persiapan Umrah Bersama Jamaah" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <Input value={aDate} onChange={(e) => setADate(e.target.value)} placeholder="2026-12-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Jumlah Peserta</Label>
                <Input value={aAttendance} onChange={(e) => setAAttendance(e.target.value)} type="number" min={0} />
              </div>
            </div>
            <Button className="w-full" onClick={() => void addActivity()} disabled={busy || aTitle.trim().length < 3 || aDate.length < 8} data-testid="mosque-activity-submit">
              {busy ? "Menyimpan…" : "Simpan Aktivitas"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
