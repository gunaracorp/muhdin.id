"use client";

/**
 * R-024 + R-026 (v14.1) — CMS "Kelas Live & Dashboard Mentor".
 * Kelola kelas live/webinar (CrudManager) + Dashboard Mentor: pilih kelas,
 * pantau pendaftar, tandai kehadiran, dan beri umpan balik per murid.
 */

import { useCallback, useEffect, useState } from "react";
import { CrudManager } from "@/components/admin/crud-manager";
import type { ColumnDef, FieldDef } from "@/components/admin/crud-manager";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LiveClassRow {
  id: string;
  title: string;
  instructor: string;
  level: string;
  startsAt: string;
  durationMin: number;
  platform: string;
  capacity: number;
  status: string;
  recordingUrl: string | null;
  _count: { registrations: number; forumThreads: number };
}
interface RegRow {
  id: string;
  name: string;
  phone: string;
  attended: boolean;
  mentorFeedback: string | null;
  createdAt: string;
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}
function fmtTanggal(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

const FIELDS: FieldDef[] = [
  { key: "title", label: "Judul Kelas", type: "text", required: true, full: true, placeholder: "Manasik Lanjutan: Tata Cara Tawaf" },
  { key: "instructor", label: "Pengajar/Mentor", type: "text", required: true },
  { key: "startsAt", label: "Waktu (YYYY-MM-DD HH:mm)", type: "text", required: true, placeholder: "2026-12-05 19:30" },
  { key: "durationMin", label: "Durasi (menit)", type: "number" },
  { key: "capacity", label: "Kuota", type: "number" },
  {
    key: "platform",
    label: "Platform",
    type: "select",
    options: [
      { value: "ZOOM", label: "Zoom" },
      { value: "MEET", label: "Google Meet" },
      { value: "OTHER", label: "Lainnya" },
    ],
  },
  {
    key: "level",
    label: "Jenjang",
    type: "select",
    options: [
      { value: "UMUM", label: "Umum" },
      { value: "DASAR", label: "Dasar" },
      { value: "LANJUTAN", label: "Lanjutan" },
      { value: "MENTOR", label: "Mentor" },
    ],
  },
  { key: "joinUrl", label: "URL Meeting (tampil untuk pendaftar)", type: "text", full: true },
  { key: "recordingUrl", label: "URL Rekaman (setelah kelas)", type: "text", full: true },
  { key: "description", label: "Deskripsi", type: "textarea", full: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "SCHEDULED", label: "Terjadwal" },
      { value: "LIVE", label: "Berlangsung" },
      { value: "DONE", label: "Selesai" },
      { value: "CANCELLED", label: "Dibatalkan" },
    ],
  },
];

export function AdminLiveClasses() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<LiveClassRow[]>([]);
  const [selected, setSelected] = useState<LiveClassRow | null>(null);
  const [regs, setRegs] = useState<RegRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; attended: number } | null>(null);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const data = await apiGet<LiveClassRow[]>("/api/live-classes?all=1");
      setClasses(Array.isArray(data) ? data : []);
    } catch {
      setClasses([]);
      toast({ title: "Gagal memuat kelas live.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const openMentor = useCallback(async (c: LiveClassRow) => {
    setSelected(c);
    setLoadingRegs(true);
    try {
      const data = await apiGet<{ registrations: RegRow[]; summary: { total: number; attended: number } }>(
        `/api/live-classes/ops?classId=${c.id}`
      );
      setRegs(data.registrations);
      setSummary(data.summary);
    } catch {
      setRegs([]);
      setSummary(null);
    } finally {
      setLoadingRegs(false);
    }
  }, []);

  async function patchReg(id: string, data: { attended?: boolean; mentorFeedback?: string }) {
    try {
      await apiSend("/api/live-classes/ops", "PATCH", { id, ...data });
      if (selected) await openMentor(selected);
    } catch {
      toast({ title: "Gagal memperbarui murid.", variant: "destructive" });
    }
  }

  const columns: ColumnDef<LiveClassRow>[] = [
    {
      key: "title",
      label: "Kelas",
      render: (c) => (
        <div>
          <p className="font-bold">{c.title}</p>
          <p className="text-xs text-muted-foreground">{c.instructor} · {c.level} · {c.platform}</p>
        </div>
      ),
    },
    { key: "startsAt", label: "Waktu", hideOnMobile: true, render: (c) => <span className="text-xs">{fmtTanggal(c.startsAt)}</span> },
    {
      key: "regs",
      label: "Murid",
      render: (c) => (
        <span className="text-xs font-bold">
          {c._count?.registrations ?? 0}/{c.capacity}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (c) => (
        <Badge variant="secondary" className={cn("text-[10px]", c.status === "LIVE" && "bg-emerald-500/15 text-emerald-700")}>
          {c.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Dashboard Mentor (R-026) */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm" data-testid="mentor-dashboard">
        <div className="flex items-center gap-2">
          <Icon name="graduation-cap" className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-lg font-extrabold">Dashboard Mentor — Murid &amp; Umpan Balik</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih kelas, tandai kehadiran, dan beri umpan balik per murid. Diskusi per kelas dimoderasi dari modul Forum.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" data-testid="mentor-classes">
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => void openMentor(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                selected?.id === c.id ? "border-primary bg-primary text-white" : "bg-background hover:border-primary/40"
              )}
            >
              {c.title} ({c._count?.registrations ?? 0})
            </button>
          ))}
          {classes.length === 0 && <p className="text-sm text-muted-foreground">Belum ada kelas — buat di panel di bawah.</p>}
        </div>

        {selected && (
          <div className="mt-5 rounded-xl border" data-testid="mentor-students">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <p className="text-sm font-extrabold">{selected.title}</p>
              {summary && (
                <p className="text-xs text-muted-foreground">
                  {summary.total} murid · {summary.attended} hadir · {rupiah(summary.total)} pendaftar
                </p>
              )}
            </div>
            {loadingRegs ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Memuat…</p>
            ) : regs.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Belum ada pendaftar di kelas ini.</p>
            ) : (
              <div className="divide-y">
                {regs.map((r) => (
                  <div key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {r.name}
                        <span className="ms-2 text-xs font-normal text-muted-foreground">{r.phone.slice(0, 6)}•••</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtTanggal(r.createdAt)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={r.attended ? "default" : "outline"}
                      onClick={() => void patchReg(r.id, { attended: !r.attended })}
                      data-testid={`mentor-attend-${r.id}`}
                    >
                      <Icon name={r.attended ? "check-circle-2" : "circle"} className="mr-1 h-3.5 w-3.5" aria-hidden />
                      {r.attended ? "Hadir" : "Tandai Hadir"}
                    </Button>
                    <div className="flex w-full max-w-xs items-center gap-1.5">
                      <Input
                        defaultValue={r.mentorFeedback ?? ""}
                        placeholder="Umpan balik mentor…"
                        className="h-9 text-xs"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (r.mentorFeedback ?? "")) void patchReg(r.id, { mentorFeedback: v });
                        }}
                        data-testid={`mentor-feedback-${r.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CRUD kelas (R-024) */}
      <CrudManager<LiveClassRow>
        config={{
          title: "Kelas Live & Webinar Terjadwal",
          description:
            "Agenda kelas daring Akademi MUHDIN: pendaftaran publik otomatis kuota, pengingat dua kanal (WA + push), dan rekaman tersimpan setelah kelas selesai.",
          endpoint: "/api/live-classes",
          extraQuery: "?all=1", // bentuk admin (_count) — bukan bentuk publik
          itemName: "Kelas",
          searchKeys: ["title", "instructor"],
          defaultItem: () => ({
            id: "",
            title: "",
            instructor: "",
            startsAt: "",
            durationMin: 90,
            capacity: 100,
            platform: "ZOOM",
            level: "UMUM",
            status: "SCHEDULED",
            joinUrl: "",
            recordingUrl: null,
            description: "",
          }),
          fields: FIELDS,
          columns,
          onSaved: loadClasses,
        }}
      />
    </div>
  );
}
