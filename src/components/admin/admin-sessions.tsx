"use client";

/**
 * admin-sessions.tsx — v13.0 «GERBANG» — R-077 Sesi & Device Management (CMS).
 *
 * Daftar perangkat aktif per akun yang sedang login:
 *   • perangkat (dari User-Agent), IP, terakhir aktif, penanda "sesi ini";
 *   • cabut satu perangkat (logout paksa jarak jauh);
 *   • cabut SEMUA perangkat lain sekaligus (reaksi cepat saat curiga).
 * Semua aksi tercatat di jejak audit via DELETE /api/auth/sessions.
 */
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SessionRow {
  id: string;
  device: string;
  ip: string | null;
  lastSeenAt: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60_000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export function AdminSessions() {
  const { toast } = useToast();
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    apiGet<SessionRow[]>("/api/auth/sessions")
      .then(setRows)
      .catch(() => setRows([]));
  };
  useEffect(load, []);

  const revoke = async (id: string, label: string) => {
    setBusy(true);
    try {
      await apiSend("/api/auth/sessions", "DELETE", { id });
      toast({ title: "Sesi dicabut ✓", description: `${label} keluar otomatis.` });
      load();
    } catch (e) {
      toast({ title: "Gagal mencabut sesi", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const revokeAll = async () => {
    setBusy(true);
    try {
      const r = await apiSend<{ revoked: number }>("/api/auth/sessions", "DELETE", { all: true });
      toast({ title: `${r.revoked} sesi lain dicabut ✓`, description: "Perangkat lain keluar otomatis." });
      load();
    } catch (e) {
      toast({ title: "Gagal mencabut sesi", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const others = (rows || []).filter((r) => !r.current).length;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-muted p-2.5">
            <Icon name="smartphone" className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-extrabold">Perangkat &amp; Sesi Aktif</h2>
            <p className="text-sm text-muted-foreground">
              Keluar paksa dari perangkat mana pun — sesi yang dicabut langsung kehilangan akses.
            </p>
          </div>
        </div>
        {others > 0 && (
          <Button variant="outline" size="sm" onClick={revokeAll} disabled={busy} className="text-destructive border-destructive/40 hover:bg-destructive/10">
            <Icon name="logout" className="h-4 w-4 mr-1.5" aria-hidden />
            Cabut {others} perangkat lain
          </Button>
        )}
      </div>

      <div className="mt-5 space-y-2.5">
        {rows === null ? (
          <p className="text-sm text-muted-foreground">Memuat daftar perangkat…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada sesi aktif.</p>
        ) : (
          rows.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border p-3.5",
                s.current ? "border-emerald-500/40 bg-emerald-500/5" : "bg-background",
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-bold">
                  <Icon name={s.current ? "shield-check" : "smartphone"} className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {s.device}
                  {s.current && (
                    <Badge className="bg-emerald-500/15 text-[10px] font-bold text-emerald-700 border-emerald-500/40">
                      Sesi ini
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  Aktif {timeAgo(s.lastSeenAt)}
                  {s.ip ? <> · IP <span dir="ltr" className="font-mono">{s.ip}</span></> : null}
                  {" · "}masuk {timeAgo(s.createdAt)}
                </p>
              </div>
              {!s.current && (
                <Button variant="outline" size="sm" onClick={() => revoke(s.id, s.device)} disabled={busy}>
                  <Icon name="x" className="h-3.5 w-3.5 mr-1" aria-hidden />
                  Cabut
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
