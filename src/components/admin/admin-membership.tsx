"use client";

/**
 * v11 — Modul admin Keanggotaan Power Pack:
 *   AdminAcademy  — kelola kursus Academy + pendaftar + sertifikat terbit
 *   AdminBooking  — kelola slot layanan + booking (check-in/batal)
 *   AdminBenefits — kelola benefit mitra + tebusan + penyesuaian poin KTA
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDateTime } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ============ Shared bits ============ */

function StatChip({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name={icon} className="h-3.5 w-3.5" />{label}
      </p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

/* ============ 1) ACADEMY ============ */

interface CourseRow {
  id: string; slug: string; title: string; category: string; level: string;
  durationMin: number; modules: number; active: boolean; rewardPoints: number;
  _count?: { enrollments: number };
}
interface EnrollRow {
  id: string; courseSlug: string; name: string; email: string; score: number | null;
  status: string; startedAt: string; certificate: { code: string } | null;
}

export function AdminAcademy() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrolls, setEnrolls] = useState<EnrollRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([
        apiGet<{ rows: CourseRow[] }>("/api/academy/courses?admin=1"),
        apiGet<{ rows: EnrollRow[] }>("/api/academy/enroll?admin=1"),
      ]);
      setCourses(c.rows);
      setEnrolls(e.rows);
    } catch {
      toast({ title: "Gagal memuat data academy.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  async function toggle(c: CourseRow) {
    setBusy(true);
    try {
      await apiSend("/api/academy/courses", "PUT", { id: c.id, active: !c.active });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatChip icon="book-open" label="Kursus" value={courses.length} />
        <StatChip icon="check-circle-2" label="Aktif" value={courses.filter((c) => c.active).length} />
        <StatChip icon="users" label="Pendaftar" value={enrolls.length} />
        <StatChip icon="award" label="Sertifikat terbit" value={enrolls.filter((e) => e.certificate).length} />
      </div>

      <div className="rounded-xl border bg-card">
        <p className="border-b px-4 py-3 text-sm font-semibold">Kursus Manasik Academy</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2">Kursus</th><th className="px-4 py-2">Kategori</th><th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Durasi</th><th className="px-4 py-2">Pendaftar</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th>
            </tr></thead>
            <tbody className="divide-y">
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-medium">{c.title}</td>
                  <td className="px-4 py-2.5">{c.category}</td>
                  <td className="px-4 py-2.5">{c.level}</td>
                  <td className="px-4 py-2.5">{c.durationMin}m</td>
                  <td className="px-4 py-2.5">{c._count?.enrollments ?? 0}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={c.active ? "bg-primary/10 text-primary border-primary/30" : "bg-muted"}>
                      {c.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-end">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => toggle(c)}>
                      {c.active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </td>
                </tr>
              ))}
              {!courses.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Belum ada kursus.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <p className="border-b px-4 py-3 text-sm font-semibold">Pendaftar & Sertifikat Terbaru</p>
        <ul className="max-h-80 divide-y overflow-y-auto">
          {enrolls.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <Icon name={e.status === "COMPLETED" ? "badge-check" : e.status === "FAILED" ? "x-circle" : "loader"} className={cn("h-4 w-4 shrink-0",
                e.status === "COMPLETED" ? "text-primary" : e.status === "FAILED" ? "text-destructive" : "text-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.name} <span className="text-muted-foreground">· {e.courseSlug}</span></p>
                <p className="truncate text-xs text-muted-foreground">{e.email} · {formatDateTime(e.startedAt)}</p>
              </div>
              {e.score !== null && <span className="font-mono text-xs">{e.score}</span>}
              {e.certificate && <Badge variant="outline" className="text-[10px] font-mono">{e.certificate.code}</Badge>}
            </li>
          ))}
          {!enrolls.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada pendaftar.</li>}
        </ul>
      </div>
    </div>
  );
}

/* ============ 2) BOOKING ============ */

interface SlotRow {
  id: string; service: string; title: string; city: string; venue: string;
  startsAt: string; capacity: number; booked: number; remaining: number; active: boolean;
}
interface BookingRow {
  id: string; code: string; name: string; phone: string; pax: number; status: string; createdAt: string;
  slot: { service: string; title: string; city: string; startsAt: string };
}

export function AdminBooking() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [stats, setStats] = useState({ total: 0, booked: 0, checkedIn: 0, cancelled: 0 });
  const [form, setForm] = useState({ service: "KELAS_MANASIK", title: "", city: "", venue: "", startsAt: "", capacity: 30, durationMin: 90 });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([
        apiGet<{ rows: SlotRow[] }>("/api/slots?admin=1"),
        apiGet<{ rows: BookingRow[]; stats: typeof stats }>("/api/bookings"),
      ]);
      setSlots(s.rows);
      setBookings(b.rows);
      setStats(b.stats);
    } catch {
      toast({ title: "Gagal memuat data booking.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  async function createSlot() {
    setBusy(true);
    try {
      await apiSend("/api/slots", "POST", { ...form, startsAt: new Date(form.startsAt).toISOString() });
      toast({ title: "Slot dibuat." });
      setForm({ ...form, title: "", venue: "", startsAt: "" });
      await load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal membuat slot.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: "checkin" | "cancel") {
    setBusy(true);
    try {
      await apiSend("/api/bookings", "PATCH", { id, action });
      await load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatChip icon="ticket" label="Total booking" value={stats.total} />
        <StatChip icon="clock" label="Menunggu" value={stats.booked} />
        <StatChip icon="check-circle-2" label="Check-in" value={stats.checkedIn} />
        <StatChip icon="ban" label="Dibatalkan" value={stats.cancelled} />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">Buat Slot Baru</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1"><Label>Layanan</Label>
            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
              <option value="KELAS_MANASIK">Kelas Manasik</option>
              <option value="KONSULTASI_SYARIAH">Konsultasi Syariah</option>
              <option value="KLINIK_VAKSIN">Klinik Vaksin</option>
            </select>
          </div>
          <div className="grid gap-1"><Label>Judul</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Manasik Umrah Batch 12" /></div>
          <div className="grid gap-1"><Label>Kota</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Jakarta" /></div>
          <div className="grid gap-1"><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Kantor DPD" /></div>
          <div className="grid gap-1"><Label>Waktu mulai</Label><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
          <div className="grid gap-1"><Label>Kapasitas</Label><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 30 })} /></div>
          <div className="grid gap-1"><Label>Durasi (menit)</Label><Input type="number" min={15} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) || 90 })} /></div>
          <div className="flex items-end">
            <Button className="w-full" disabled={busy || !form.title || !form.city || !form.venue || !form.startsAt} onClick={createSlot}>
              <Icon name="plus" className="h-4 w-4 me-1.5" />Buat Slot
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <p className="border-b px-4 py-3 text-sm font-semibold">Slot Terjadwal</p>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2">Judul</th><th className="px-4 py-2">Waktu</th><th className="px-4 py-2">Lokasi</th><th className="px-4 py-2">Kuota</th><th className="px-4 py-2">Status</th>
            </tr></thead>
            <tbody className="divide-y">
              {slots.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5 font-medium">{s.title}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{formatDateTime(s.startsAt)}</td>
                  <td className="px-4 py-2.5">{s.venue}, {s.city}</td>
                  <td className="px-4 py-2.5">{s.remaining}/{s.capacity}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={s.active ? "bg-primary/10 text-primary border-primary/30" : "bg-muted"}>{s.active ? "Aktif" : "Tutup"}</Badge>
                  </td>
                </tr>
              ))}
              {!slots.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada slot.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <p className="border-b px-4 py-3 text-sm font-semibold">Booking Masuk</p>
        <ul className="max-h-80 divide-y overflow-y-auto">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium"><span className="font-mono text-xs text-muted-foreground">{b.code}</span> · {b.name} <span className="text-muted-foreground">({b.pax} pax)</span></p>
                <p className="truncate text-xs text-muted-foreground">{b.slot.title} · {formatDateTime(b.slot.startsAt)} · {b.phone}</p>
              </div>
              <Badge variant="outline" className={cn("text-[10px]",
                b.status === "CHECKED_IN" ? "bg-primary/10 text-primary border-primary/30" :
                b.status === "CANCELLED" ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-gold/15 text-gold-deep border-gold/40")}>
                {b.status}
              </Badge>
              {b.status === "BOOKED" && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act(b.id, "checkin")}>Check-in</Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(b.id, "cancel")}>Batal</Button>
                </div>
              )}
            </li>
          ))}
          {!bookings.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada booking.</li>}
        </ul>
      </div>
    </div>
  );
}

/* ============ 3) BENEFITS + POIN ============ */

interface BenefitRow {
  id: string; title: string; partnerName: string; category: string; pointsCost: number;
  quota: number | null; claimed: number; active: boolean; _count?: { redemptions: number };
}
interface RedemptionRow {
  id: string; code: string; holderName: string; status: string; createdAt: string;
  benefit: { title: string }; card: { cardNo: string };
}

export function AdminBenefits() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BenefitRow[]>([]);
  const [reds, setReds] = useState<RedemptionRow[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, redemptions: 0 });
  const [form, setForm] = useState({ title: "", partnerName: "", category: "HOTEL", discountText: "", pointsCost: 0, quota: "", description: "" });
  const [adjust, setAdjust] = useState({ cardNo: "", delta: "50", note: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const b = await apiGet<{ rows: BenefitRow[]; stats: typeof stats; redemptions: RedemptionRow[] }>("/api/benefits?admin=1");
      setRows(b.rows);
      setStats(b.stats);
      setReds(b.redemptions || []);
    } catch {
      toast({ title: "Gagal memuat benefit.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  async function createBenefit() {
    setBusy(true);
    try {
      await apiSend("/api/benefits", "POST", { ...form, pointsCost: Number(form.pointsCost) || 0, quota: form.quota ? Number(form.quota) : null });
      toast({ title: "Benefit dibuat." });
      setForm({ ...form, title: "", partnerName: "", discountText: "", quota: "", description: "" });
      await load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal membuat benefit.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(b: BenefitRow) {
    setBusy(true);
    try {
      await apiSend("/api/benefits", "PATCH", { id: b.id, active: !b.active });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function adjustPoints() {
    setBusy(true);
    try {
      // Cari kartu by cardNo via lookup publik-admin: gunakan GET /api/cards?no=
      const res = await apiGet<{ card: { id: string } }>(`/api/cards?no=${encodeURIComponent(adjust.cardNo.trim())}`);
      await apiSend("/api/cards", "PATCH", {
        action: "adjust-points", cardId: res.card.id,
        delta: Number(adjust.delta) || 0, note: adjust.note || undefined,
      });
      toast({ title: "Poin disesuaikan." });
      setAdjust({ cardNo: "", delta: "50", note: "" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal menyesuaikan poin.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatChip icon="gift" label="Total benefit" value={stats.total} />
        <StatChip icon="check-circle-2" label="Aktif" value={stats.active} />
        <StatChip icon="ticket-check" label="Ditebus" value={stats.redemptions} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Buat Benefit Mitra</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1 sm:col-span-2"><Label>Judul</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Diskon hotel Makkah 15%" /></div>
            <div className="grid gap-1"><Label>Mitra</Label><Input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} placeholder="Hotel Zamzam Grand" /></div>
            <div className="grid gap-1"><Label>Kategori</Label>
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["HOTEL", "TRANSPORT", "VAKSIN", "UMRAH_PAKET", "EDUKASI", "LAINNYA"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1"><Label>Teks diskon</Label><Input value={form.discountText} onChange={(e) => setForm({ ...form, discountText: e.target.value })} placeholder="Diskon 15%" /></div>
            <div className="grid gap-1"><Label>Biaya poin (0=gratis)</Label><Input type="number" min={0} value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: Number(e.target.value) || 0 })} /></div>
            <div className="grid gap-1"><Label>Kuota (kosong = ∞)</Label><Input type="number" min={0} value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} /></div>
            <div className="grid gap-1 sm:col-span-2"><Label>Deskripsi</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <Button className="w-full" disabled={busy || !form.title || !form.partnerName || !form.description} onClick={createBenefit}>
                <Icon name="plus" className="h-4 w-4 me-1.5" />Buat Benefit
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Sesuaikan Poin KTA</p>
          <div className="grid gap-3">
            <div className="grid gap-1"><Label>Nomor KTA</Label><Input value={adjust.cardNo} onChange={(e) => setAdjust({ ...adjust, cardNo: e.target.value })} placeholder="KTA-2026-00001" className="font-mono" /></div>
            <div className="grid gap-1"><Label>Delta (+/-)</Label><Input type="number" value={adjust.delta} onChange={(e) => setAdjust({ ...adjust, delta: e.target.value })} /></div>
            <div className="grid gap-1"><Label>Catatan</Label><Input value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} placeholder="Reward event Rakernas" /></div>
            <Button variant="outline" disabled={busy || !adjust.cardNo} onClick={adjustPoints}>
              <Icon name="coins" className="h-4 w-4 me-1.5" />Terapkan
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <p className="border-b px-4 py-3 text-sm font-semibold">Katalog Benefit</p>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2">Benefit</th><th className="px-4 py-2">Mitra</th><th className="px-4 py-2">Kategori</th><th className="px-4 py-2">Poin</th><th className="px-4 py-2">Tebus</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th>
            </tr></thead>
            <tbody className="divide-y">
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2.5 font-medium">{b.title}</td>
                  <td className="px-4 py-2.5">{b.partnerName}</td>
                  <td className="px-4 py-2.5">{b.category}</td>
                  <td className="px-4 py-2.5">{b.pointsCost}</td>
                  <td className="px-4 py-2.5">{b.claimed}{b.quota !== null ? `/${b.quota}` : ""}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={b.active ? "bg-primary/10 text-primary border-primary/30" : "bg-muted"}>{b.active ? "Aktif" : "Tutup"}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-end">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => toggle(b)}>{b.active ? "Tutup" : "Buka"}</Button>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Belum ada benefit.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <p className="border-b px-4 py-3 text-sm font-semibold">Tebusan Terbaru</p>
        <ul className="max-h-64 divide-y overflow-y-auto">
          {reds.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <Icon name={r.status === "USED" ? "check-circle-2" : "ticket"} className={cn("h-4 w-4 shrink-0", r.status === "USED" ? "text-primary" : "text-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium"><span className="font-mono text-xs text-muted-foreground">{r.code}</span> · {r.benefit.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.holderName} · <span className="font-mono">{r.card.cardNo}</span> · {formatDateTime(r.createdAt)}</p>
              </div>
              <Badge variant="outline" className={cn("text-[10px]", r.status === "USED" ? "bg-primary/10 text-primary border-primary/30" : "bg-gold/15 text-gold-deep border-gold/40")}>{r.status}</Badge>
            </li>
          ))}
          {!reds.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada tebusan.</li>}
        </ul>
      </div>
    </div>
  );
}
