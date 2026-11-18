"use client";

/**
 * R-065 (v14.1) — CMS "API Publik v1": daftarkan mitra, kunci API tampil
 * SEKALI (disimpan hash), rotasi kunci, kuota harian, uji webhook HMAC.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PartnerRow {
  id: string;
  name: string;
  email: string;
  keyPrefix: string;
  quotaDaily: number;
  callsToday: number;
  lastCallAt: string | null;
  webhookUrl: string;
  active: boolean;
  createdAt: string;
}

function fmtTanggal(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function AdminApiPartners() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quota, setQuota] = useState("1000");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [shown, setShown] = useState<{ apiKey?: string; webhookSecret?: string; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ partners: PartnerRow[] }>("/api/api-partners");
      setPartners(data.partners);
    } catch {
      toast({ title: "Gagal memuat mitra API.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setBusy(true);
    try {
      const res = await apiSend<{ credentials: { apiKey: string; webhookSecret: string }; message: string }>(
        "/api/api-partners",
        "POST",
        { name, email, quotaDaily: Number(quota), webhookUrl }
      );
      setShown({ apiKey: res.credentials.apiKey, webhookSecret: res.credentials.webhookSecret, message: res.message });
      setFormOpen(false);
      setName("");
      setEmail("");
      setQuota("1000");
      setWebhookUrl("");
      await load();
    } catch (e) {
      toast({ title: (e as Error).message || "Gagal mendaftarkan mitra.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function rotate(p: PartnerRow) {
    setBusy(true);
    try {
      const res = await apiSend<{ credentials: { apiKey: string }; message: string }>(
        `/api/api-partners/${p.id}/rotate`,
        "POST",
        {}
      );
      setShown({ apiKey: res.credentials.apiKey, message: res.message });
      await load();
    } catch {
      toast({ title: "Gagal merotasi kunci.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: PartnerRow) {
    setBusy(true);
    try {
      await apiSend(`/api/api-partners/${p.id}`, "PATCH", { active: !p.active });
      await load();
    } catch {
      toast({ title: "Gagal mengubah mitra.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function testWebhook(p: PartnerRow) {
    setBusy(true);
    try {
      const res = await apiSend<{ delivered: boolean; message: string }>(`/api/api-partners/${p.id}/test-webhook`, "POST", {});
      toast({ title: res.message, variant: res.delivered ? "default" : "destructive" });
      await load();
    } catch (e) {
      toast({ title: (e as Error).message || "Gagal menguji webhook.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    { label: "Mitra API", value: String(partners.length), icon: "key-square", tone: "primary" },
    { label: "Aktif", value: String(partners.filter((p) => p.active).length), icon: "badge-check", tone: "forest" },
    { label: "Panggilan Hari Ini", value: String(partners.reduce((a, p) => a + p.callsToday, 0)), icon: "activity", tone: "gold" },
    { label: "Pakai Webhook", value: String(partners.filter((p) => p.webhookUrl).length), icon: "webhook", tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="apipartner-stats">
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold">Mitra Integrasi (API Publik v1)</h2>
          <p className="text-sm text-muted-foreground">
            Endpoint: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/public/v1/status · /packages · /members</code> — autentikasi header{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">X-API-Key</code>, kuota harian server-side, webhook bertanda tangan HMAC-SHA256.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} disabled={busy} data-testid="apipartner-add">
          <Icon name="plus" className="mr-1.5 h-4 w-4" aria-hidden />Daftarkan Mitra
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm" data-testid="apipartner-table">
        {partners.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada mitra API.</p>
        ) : (
          <div className="divide-y">
            {partners.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" data-testid={`apipartner-row-${p.keyPrefix}`}>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">
                    {p.name}
                    <code className="ms-2 rounded bg-muted px-1.5 py-0.5 text-xs">{p.keyPrefix}•••</code>
                    {!p.active && <Badge variant="secondary" className="ms-2 text-[10px]">NONAKTIF</Badge>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.email || "tanpa email"} · kuota {p.quotaDaily}/hari · terpakai {p.callsToday} hari ini · panggilan terakhir {fmtTanggal(p.lastCallAt)}
                  </p>
                  {p.webhookUrl && <p className="mt-0.5 truncate text-xs text-primary">{p.webhookUrl}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void rotate(p)} disabled={busy} data-testid={`apipartner-rotate-${p.keyPrefix}`}>
                    <Icon name="refresh" className="mr-1 h-3.5 w-3.5" aria-hidden />Rotasi Kunci
                  </Button>
                  {p.webhookUrl && (
                    <Button size="sm" variant="outline" onClick={() => void testWebhook(p)} disabled={busy}>
                      <Icon name="webhook" className="mr-1 h-3.5 w-3.5" aria-hidden />Uji Webhook
                    </Button>
                  )}
                  <Button size="sm" variant={p.active ? "destructive" : "default"} onClick={() => void toggle(p)} disabled={busy}>
                    {p.active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog kredensial sekali-tampil */}
      <Dialog open={!!shown} onOpenChange={(o) => !o && setShown(null)}>
        <DialogContent className="max-w-lg" data-testid="apipartner-credentials">
          <DialogHeader>
            <DialogTitle>Kredensial Mitra — Salin Sekarang</DialogTitle>
            <DialogDescription>{shown?.message}</DialogDescription>
          </DialogHeader>
          {shown?.apiKey && (
            <div className="space-y-1.5">
              <Label>API Key (X-API-Key)</Label>
              <code className="block break-all rounded-lg border bg-muted/60 p-3 text-xs font-bold" data-testid="apipartner-key">{shown.apiKey}</code>
            </div>
          )}
          {shown?.webhookSecret && (
            <div className="space-y-1.5">
              <Label>Webhook Secret (HMAC)</Label>
              <code className="block break-all rounded-lg border bg-muted/60 p-3 text-xs font-bold">{shown.webhookSecret}</code>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Sistem hanya menyimpan hash — kunci ini TIDAK akan ditampilkan lagi. Salin dan simpan aman sekarang.
          </p>
        </DialogContent>
      </Dialog>

      {/* Dialog daftar mitra */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Daftarkan Mitra API</DialogTitle>
            <DialogDescription>Kunci penuh hanya tampil sekali setelah pendaftaran.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nama Mitra</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="PT Mitra Sistem Umrah" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Kontak</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="integrasi@mitra.co.id" />
            </div>
            <div className="space-y-1.5">
              <Label>Kuota Harian</Label>
              <Input value={quota} onChange={(e) => setQuota(e.target.value)} type="number" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label>URL Webhook (opsional)</Label>
              <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://mitra.co.id/webhooks/muhdin" />
            </div>
            <Button className="w-full" onClick={() => void create()} disabled={busy || name.trim().length < 3} data-testid="apipartner-create">
              {busy ? "Memproses…" : "Daftarkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
