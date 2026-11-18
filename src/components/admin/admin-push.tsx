"use client";

/**
 * admin-push.tsx — v13.2 — R-011 Web Push (CMS).
 *
 * Panel kirim pengumuman keberangkatan ke perangkat jamaah:
 *   • jumlah langganan aktif + status konfigurasi VAPID
 *   • form: judul, isi pesan, URL tujuan, (opsional) nomor kartu jamaah
 *   • hasil kirim: terkirim / gagal / langganan mati dibersihkan
 * Data: GET/POST /api/push/broadcast (SUPER_ADMIN/ADMIN).
 */
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BroadcastStatus {
  subscribers: number;
  configured: boolean;
}

export function AdminPush() {
  const [status, setStatus] = useState<BroadcastStatus | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("#/pesanan");
  const [cardNo, setCardNo] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { sent: number; failed: number; removed: number }>(null);
  const [error, setError] = useState("");

  const load = () =>
    apiGet<BroadcastStatus>("/api/push/broadcast")
      .then(setStatus)
      .catch(() => setError("Gagal memuat status langganan."));

  useEffect(() => {
    void load();
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await apiSend<{ sent: number; failed: number; removed: number }>(
        "/api/push/broadcast",
        "POST",
        { title, body, url, cardNo: cardNo.trim() || undefined }
      );
      setResult(res);
      setTitle("");
      setBody("");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim notifikasi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Langganan Perangkat Aktif</p>
          <p className="mt-1 text-3xl font-extrabold text-primary">{status ? status.subscribers : "—"}</p>
        </div>
        <div className={cn(
          "rounded-3xl border p-5 shadow-sm",
          status?.configured ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"
        )}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Konfigurasi VAPID</p>
          <p className={cn("mt-1 flex items-center gap-2 text-lg font-extrabold",
            status?.configured ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>
            <Icon name={status?.configured ? "check-circle-2" : "alert-triangle"} className="h-5 w-5" />
            {status?.configured ? "Siap kirim" : "Kunci belum diset (.env)"}
          </p>
        </div>
      </div>

      {/* Form broadcast */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="bell-ring" className="h-5 w-5 text-primary" />
          Kirim Pengumuman Keberangkatan
        </h3>
        <form onSubmit={send} className="mt-5 grid gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Judul (3–80)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
              placeholder="Contoh: Keberangkatan Grup B — Gate 3, Pukul 09.30" required />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Isi pesan (3–240)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={240}
              rows={3}
              required
              placeholder="Mohon jamaah grup B berkumpul di gate 3 pukul 09.30 WIB. Jangan lupa paspor & boarding pass."
              className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus-visible:border-gold"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL tujuan (opsional)</label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="#/pesanan" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nomor kartu (opsional — kirim terarah)</label>
              <Input value={cardNo} onChange={(e) => setCardNo(e.target.value)} placeholder="MHD-JM-2026-0001" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy} className="bg-primary text-white hover:bg-primary/90">
              <Icon name="send" className="me-2 h-4 w-4" />
              {busy ? "Mengirim…" : "Kirim Notifikasi"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Batas 5 kiriman/menit · langganan mati (404/410) dibersihkan otomatis · jejak audit dicatat.
            </p>
          </div>
        </form>
        {error && <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {result && (
          <p className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300" data-testid="push-result">
            Terkirim: {result.sent} · Gagal: {result.failed} · Langganan mati dibersihkan: {result.removed}
          </p>
        )}
      </div>

      {!status && !error && <Skeleton className="h-24 w-full" />}
    </div>
  );
}
