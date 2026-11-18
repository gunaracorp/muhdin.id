"use client";

/**
 * R-012 (v13.3) — CMS "Jadwal & Moderasi Grup".
 * Pilih grup → kelola jadwal kumpul (tambah/hapus) dan moderasi chat
 * (hapus pesan bermasalah). Data grup di panel "Grup" (CrudManager).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import type { TravelGroupItem } from "@/components/admin/admin-travel-groups";

interface JadwalItem {
  id: string;
  groupId: string;
  title: string;
  location: string;
  startsAt: string;
  note: string | null;
}

interface PesanItem {
  id: string;
  groupId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export function AdminGroupOps() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<TravelGroupItem[] | null>(null);
  const [groupId, setGroupId] = useState("");
  const [jadwal, setJadwal] = useState<JadwalItem[] | null>(null);
  const [pesan, setPesan] = useState<PesanItem[] | null>(null);
  const [form, setForm] = useState({ title: "", location: "", startsAt: "", note: "" });
  const [saving, setSaving] = useState(false);

  const loadGroups = useCallback(() => {
    apiGet<TravelGroupItem[]>("/api/travel-groups").then(setGroups).catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const loadRincian = useCallback((id: string) => {
    if (!id) {
      setJadwal(null);
      setPesan(null);
      return;
    }
    setJadwal(null);
    setPesan(null);
    // Data jadwal & pesan via room endpoint publik (berbasis kode) — cukup untuk operasi CMS.
    const g = groups?.find((x) => x.id === id);
    if (!g) return;
    apiGet<{ schedules: JadwalItem[]; messages: PesanItem[] }>(`/api/travel-groups/room?code=${encodeURIComponent(g.code)}`)
      .then((d) => {
        setJadwal(d.schedules.map((s) => ({ ...s, groupId: id })));
        setPesan(d.messages.map((m) => ({ ...m, groupId: id })));
      })
      .catch(() => {
        setJadwal([]);
        setPesan([]);
      });
  }, [groups]);

  useEffect(() => {
    loadRincian(groupId);
  }, [groupId, loadRincian]);

  const tambahJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setSaving(true);
    try {
      await apiSend("/api/travel-groups/schedules", "POST", { ...form, groupId });
      toast({ title: "Jadwal kumpul ditambahkan ✓", description: form.title });
      setForm({ title: "", location: "", startsAt: "", note: "" });
      loadRincian(groupId);
    } catch (err) {
      toast({ title: "Gagal menambah jadwal", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const hapusJadwal = async (id: string) => {
    try {
      await apiSend(`/api/travel-groups/schedules?id=${id}`, "DELETE");
      toast({ title: "Jadwal dihapus ✓" });
      loadRincian(groupId);
    } catch (err) {
      toast({ title: "Gagal menghapus jadwal", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
  };

  const hapusPesan = async (id: string) => {
    try {
      await apiSend(`/api/travel-groups/messages?id=${id}`, "DELETE");
      toast({ title: "Pesan dihapus ✓" });
      loadRincian(groupId);
    } catch (err) {
      toast({ title: "Gagal menghapus pesan", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">
          <Icon name="calendar-clock" className="h-5 w-5 text-primary" aria-hidden /> Jadwal & Moderasi Grup
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Kelola jadwal kumpul tiap rombongan dan moderasi chat singkat. Buat/arsipkan grup di panel <b>Grup</b>; jamaah masuk memakai kode bergabung.
        </p>
      </div>

      <div className="max-w-md space-y-1.5">
        <Label>Pilih Grup</Label>
        {!groups ? (
          <Skeleton className="h-10 w-full rounded-xl" />
        ) : (
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm">
            <option value="">— pilih grup —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.code} · {g.name} ({g._count?.members ?? 0} anggota)</option>
            ))}
          </select>
        )}
      </div>

      {groupId && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* JADWAL */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-extrabold">Jadwal Kumpul</h3>
            <form onSubmit={tambahJadwal} className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Judul *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kumpul Terminal 3 Soekarno-Hatta" required minLength={3} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lokasi</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lane 5, pintu 4" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Waktu *</Label>
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Catatan</Label>
                <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Bawa paspor, tas kabin 7 kg." />
              </div>
              <Button type="submit" size="sm" disabled={saving} className="sm:col-span-2 bg-gradient-to-r from-primary to-forest text-white">
                <Icon name="plus" className="h-3.5 w-3.5 mr-1" aria-hidden /> Tambah Jadwal
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              {!jadwal ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : jadwal.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">Belum ada jadwal.</p>
              ) : (
                jadwal.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border bg-muted/25 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(s.startsAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {s.location ? ` · ${s.location}` : ""}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 text-destructive border-destructive/40" onClick={() => hapusJadwal(s.id)}>
                      <Icon name="trash" className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* MODERASI PESAN */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-extrabold">Moderasi Chat</h3>
            <p className="mt-1 text-xs text-muted-foreground">Hapus pesan bermasalah — jejak tercatat di audit log.</p>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {!pesan ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : pesan.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">Belum ada pesan.</p>
              ) : (
                pesan.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-2 rounded-xl border bg-muted/25 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-gold-deep">
                        {m.authorName}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {new Date(m.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </p>
                      <p className="mt-0.5 break-words text-sm">{m.body}</p>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 text-destructive border-destructive/40" onClick={() => hapusPesan(m.id)} aria-label="Hapus pesan">
                      <Icon name="trash" className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {!groupId && groups && groups.length === 0 && (
        <div className="rounded-2xl border bg-card py-14 text-center shadow-sm">
          <Icon name="users" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Belum ada grup perjalanan — buka panel <b>Grup</b> untuk membuat grup pertama.</p>
          <Badge variant="outline" className="mt-3 text-[10px] font-bold">R-012 · v13.3</Badge>
        </div>
      )}
    </div>
  );
}
