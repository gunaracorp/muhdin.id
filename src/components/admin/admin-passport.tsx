"use client";

/**
 * AdminPassport (v5 Fase 3) — CMS "Paspor & GPS".
 *
 * Panel 1 — Paspor Haji Digital: statistik, pencarian + filter status,
 *           terbitkan paspor baru (nomor PH-HAJ/UMR otomatis), ubah status
 *           (cabut / hilang / aktifkan), tautan QR & halaman verifikasi.
 * Panel 2 — Perangkat GPS Rombongan: daftar perangkat + ubah status,
 *           tautan peta publik #/tracking.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDateL10n, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { navigate } from "@/hooks/use-hash-route";

type Passport = {
  id: string;
  passportNo: string;
  holderName: string;
  type: string;
  gender: string;
  nationality: string;
  rombongan: string | null;
  status: string;
  issuedAt: string;
  expiresAt: string;
  verificationCount: number;
  lastVerifiedAt: string | null;
  member?: { name: string } | null;
};

type Device = {
  id: string;
  code: string;
  groupName: string;
  leader: string;
  pax: number;
  site: string;
  status: string;
  battery: number;
  lastPingAt: string;
};

type MemberLite = { id: string; name: string };

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/40",
  EXPIRED: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/40",
  REVOKED: "bg-red-500/15 text-red-700 dark:text-red-300 ring-red-500/40",
  LOST: "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/40",
  ONLINE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/40",
  IDLE: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/40",
  OFFLINE: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 ring-zinc-500/40",
};

export function AdminPassport() {
  const { t, locale } = useT();
  const { toast } = useToast();
  const [rows, setRows] = useState<Passport[] | null>(null);
  const [stats, setStats] = useState<{ active: number; expired: number; revoked: number; lost: number; verifications: number } | null>(null);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(false);

  // Form terbit
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState("UMRAH");
  const [fGender, setFGender] = useState("M");
  const [fRom, setFRom] = useState("");
  const [fMember, setFMember] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await apiGet<{ rows: Passport[]; stats: typeof stats }>(
        `/api/passport?status=${status}&q=${encodeURIComponent(q)}`
      );
      setRows(d.rows);
      setStats(d.stats);
      const dev = await apiGet<{ devices: Device[] }>("/api/tracking");
      setDevices(dev.devices);
    } catch (e) {
      toast({ title: "Gagal memuat data", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    }
  }, [status, q, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    apiGet<MemberLite[]>("/api/members?status=all").then(setMembers).catch(() => {});
  }, []);

  const setStatusOf = async (p: Passport, next: string) => {
    setBusy(true);
    try {
      await apiSend("/api/passport", "PATCH", { id: p.id, status: next });
      toast({ title: "Status diperbarui", description: `${p.passportNo} → ${next}` });
      await load();
    } catch (e) {
      toast({ title: "Gagal memperbarui", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const setDeviceStatus = async (d: Device, next: string) => {
    setBusy(true);
    try {
      await apiSend("/api/tracking", "PATCH", { id: d.id, status: next });
      toast({ title: "Perangkat diperbarui", description: `${d.code} → ${next}` });
      await load();
    } catch (e) {
      toast({ title: "Gagal memperbarui", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const issue = async () => {
    if (!fName.trim()) {
      toast({ title: "Nama pemegang wajib diisi", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const created = await apiSend<Passport>("/api/passport", "POST", {
        holderName: fName,
        type: fType,
        gender: fGender,
        rombongan: fRom || undefined,
        memberId: fMember || undefined,
      });
      toast({ title: "Paspor diterbitkan", description: created.passportNo });
      setFName("");
      setFRom("");
      setFMember("");
      await load();
    } catch (e) {
      toast({ title: "Gagal menerbitkan", description: String(e instanceof Error ? e.message : e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ===== PASPOR ===== */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <Icon name="wallet-cards" className="h-5 w-5 text-primary" aria-hidden />
              Paspor Haji Digital
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Nomor paspor dibuat otomatis (PH-HAJ/UMR-tahun-seri) — QR tersedia di /api/passport/&lt;no&gt;/qr.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            {([
              ["Aktif", stats?.active, "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/40"],
              ["Kedaluwarsa", stats?.expired, "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/40"],
              ["Dicabut", stats?.revoked, "bg-red-500/15 text-red-700 dark:text-red-300 ring-red-500/40"],
              ["Hilang", stats?.lost, "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/40"],
            ] as const).map(([l, v, cls]) => (
              <span key={l} className={cn("rounded-full px-2.5 py-1 ring-1", cls)}>
                {l}: <span className="tabular-nums">{v ?? "—"}</span>
              </span>
            ))}
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary ring-1 ring-primary/30">
              Verifikasi: <span className="tabular-nums">{stats?.verifications ?? "—"}</span>
            </span>
          </div>
        </div>

        {/* Form terbit */}
        <div className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1 lg:col-span-2">
            <Label htmlFor="ap-name">Nama Pemegang</Label>
            <Input id="ap-name" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Nama jamaah" />
          </div>
          <div className="space-y-1">
            <Label>Jenis</Label>
            <Select value={fType} onValueChange={setFType}>
              <SelectTrigger aria-label="Jenis paspor"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UMRAH">UMRAH</SelectItem>
                <SelectItem value="HAJI">HAJI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Gender</Label>
            <Select value={fGender} onValueChange={setFGender}>
              <SelectTrigger aria-label="Gender"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Laki-laki</SelectItem>
                <SelectItem value="F">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ap-rom">Rombongan</Label>
            <Input id="ap-rom" value={fRom} onChange={(e) => setFRom(e.target.value)} placeholder="opsional" />
          </div>
          <div className="space-y-1">
            <Label>Penyelenggara</Label>
            <Select value={fMember} onValueChange={setFMember}>
              <SelectTrigger aria-label="Penyelenggara"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">— Tanpa anggota —</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button onClick={() => void issue()} disabled={busy} className="w-full bg-primary hover:bg-forest">
              <Icon name="plus" className="h-4 w-4" aria-hidden /> Terbitkan
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / nomor paspor / rombongan…"
              className="pl-9"
              aria-label="Cari paspor"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[170px]" aria-label="Filter status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="EXPIRED">Kedaluwarsa</SelectItem>
              <SelectItem value="REVOKED">Dicabut</SelectItem>
              <SelectItem value="LOST">Hilang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabel */}
        <div className="mt-4 overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-bold">No. Paspor</th>
                <th className="py-2.5 pr-3 font-bold">Pemegang</th>
                <th className="py-2.5 pr-3 font-bold">Jenis</th>
                <th className="py-2.5 pr-3 font-bold">Penyelenggara</th>
                <th className="py-2.5 pr-3 font-bold">Berlaku</th>
                <th className="py-2.5 pr-3 font-bold">Verif.</th>
                <th className="py-2.5 pr-3 font-bold">Status</th>
                <th className="py-2.5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr><td colSpan={8} className="py-6"><Skeleton className="h-8 w-full" /></td></tr>
              )}
              {rows?.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Tidak ada paspor.</td></tr>
              )}
              {rows?.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-2.5 pr-3 font-mono text-xs font-bold text-primary" dir="ltr">{p.passportNo}</td>
                  <td className="py-2.5 pr-3 font-semibold">
                    {p.holderName}
                    {p.rombongan && <span className="block text-[11px] text-muted-foreground">{p.rombongan}</span>}
                  </td>
                  <td className="py-2.5 pr-3"><Badge variant="outline" className="text-[10px]">{p.type}</Badge></td>
                  <td className="py-2.5 pr-3 text-xs">{p.member?.name || "—"}</td>
                  <td className="py-2.5 pr-3 text-xs tabular-nums">{formatDateL10n(p.expiresAt, locale)}</td>
                  <td className="py-2.5 pr-3 text-xs tabular-nums">{p.verificationCount}</td>
                  <td className="py-2.5 pr-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1", STATUS_BADGE[p.status])}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "ACTIVE" ? (
                        <>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={busy} onClick={() => void setStatusOf(p, "REVOKED")}>
                            Cabut
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={busy} onClick={() => void setStatusOf(p, "LOST")}>
                            Hilang
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={busy} onClick={() => void setStatusOf(p, "ACTIVE")}>
                          Aktifkan
                        </Button>
                      )}
                      <a
                        href={`/#/verifikasi-paspor/${p.passportNo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-7 items-center rounded-md border px-2 text-[11px] font-semibold text-primary hover:bg-primary/10"
                      >
                        QR
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== GPS ===== */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <Icon name="satellite" className="h-5 w-5 text-primary" aria-hidden />
              Perangkat GPS Rombongan
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Posisi live tampil di peta publik #/tracking (pembaruan 15 detik).</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("tracking")}>
            <Icon name="map" className="h-4 w-4" aria-hidden /> Buka Peta GPS
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-bold">Kode</th>
                <th className="py-2.5 pr-3 font-bold">Rombongan</th>
                <th className="py-2.5 pr-3 font-bold">Ketua</th>
                <th className="py-2.5 pr-3 font-bold">Jamaah</th>
                <th className="py-2.5 pr-3 font-bold">Situs</th>
                <th className="py-2.5 pr-3 font-bold">Baterai</th>
                <th className="py-2.5 pr-3 font-bold">Status</th>
                <th className="py-2.5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices === null && (
                <tr><td colSpan={8} className="py-6"><Skeleton className="h-8 w-full" /></td></tr>
              )}
              {devices?.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-2.5 pr-3 font-mono text-xs font-bold text-primary" dir="ltr">{d.code}</td>
                  <td className="py-2.5 pr-3 font-semibold">{d.groupName}</td>
                  <td className="py-2.5 pr-3 text-xs">{d.leader}</td>
                  <td className="py-2.5 pr-3 text-xs tabular-nums">{d.pax}</td>
                  <td className="py-2.5 pr-3 text-xs">{d.site}</td>
                  <td className={cn("py-2.5 pr-3 text-xs tabular-nums", d.battery <= 20 && "font-bold text-red-500")}>{d.battery}%</td>
                  <td className="py-2.5 pr-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1", STATUS_BADGE[d.status])}>
                      {d.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {d.status !== "ONLINE" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={busy} onClick={() => void setDeviceStatus(d, "ONLINE")}>
                          Online
                        </Button>
                      )}
                      {d.status !== "IDLE" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={busy} onClick={() => void setDeviceStatus(d, "IDLE")}>
                          Idle
                        </Button>
                      )}
                      {d.status !== "OFFLINE" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={busy} onClick={() => void setDeviceStatus(d, "OFFLINE")}>
                          Offline
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
