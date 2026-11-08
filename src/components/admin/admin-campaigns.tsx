"use client";

/**
 * admin-campaigns.tsx — v13.0 «GERBANG» — R-089 Landing Kampanye Musiman (CMS).
 *
 * Dua panel:
 *   1. Daftar kampanye (slug, musim, status aktif, hitungan lead per status) —
 *      buat/ubah/nonaktifkan/hapus + tautan landing publik.
 *   2. Drawer lead per kampanye — follow-up: status NEW → CONTACTED →
 *      CONVERTED/INVALID, kontak langsung via WhatsApp.
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CampaignRow {
  id: string;
  slug: string;
  title: string;
  season: string;
  subtitle: string;
  description: string;
  heroImage: string | null;
  ctaText: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  leadTotal: number;
  leadStats: Record<string, number>;
}

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  status: string;
  createdAt: string;
}

const SEASON_LABEL: Record<string, string> = {
  RAMADAN: "Ramadan", HAJI: "Haji", LIBURAN: "Liburan", HIJRIAH: "Hijriah", LAINNYA: "Lainnya",
};
const LEAD_STATUS: Record<string, string> = {
  NEW: "Baru", CONTACTED: "Dihubungi", CONVERTED: "Konversi", INVALID: "Tidak valid",
};
const LEAD_TONE: Record<string, string> = {
  NEW: "border-primary/40 bg-primary/10 text-primary",
  CONTACTED: "border-gold/50 bg-gold/10 text-gold-deep",
  CONVERTED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  INVALID: "border-muted-foreground/40 bg-muted text-muted-foreground",
};

function emptyForm() {
  return { title: "", season: "RAMADAN", subtitle: "", description: "", ctaText: "Daftar Sekarang", active: true };
}

export function AdminCampaigns() {
  const { toast } = useToast();
  const [rows, setRows] = useState<CampaignRow[] | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<{ campaign: string; rows: LeadRow[] } | null>(null);

  const load = useCallback(() => {
    apiGet<CampaignRow[]>("/api/campaigns").then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(load, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await apiSend(`/api/campaigns/${editId}`, "PUT", form);
        toast({ title: "Kampanye diperbarui ✓", description: form.title });
      } else {
        await apiSend("/api/campaigns", "POST", form);
        toast({ title: "Kampanye dibuat ✓", description: form.title });
      }
      setDialog(false);
      setEditId(null);
      setForm(emptyForm());
      load();
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: CampaignRow) => {
    try {
      await apiSend(`/api/campaigns/${c.id}`, "PUT", { active: !c.active });
      toast({ title: c.active ? "Kampanye dinonaktifkan" : "Kampanye diaktifkan", description: c.title });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message });
    }
  };

  const remove = async (c: CampaignRow) => {
    if (!confirm(`Hapus kampanye "${c.title}" beserta ${c.leadTotal} lead?`)) return;
    try {
      await apiSend(`/api/campaigns/${c.id}`, "DELETE");
      toast({ title: "Kampanye dihapus ✓", description: c.title });
      load();
    } catch (err) {
      toast({ title: "Gagal menghapus", description: (err as Error).message });
    }
  };

  const openLeads = async (c: CampaignRow) => {
    try {
      const d = await apiGet<{ campaign: { title: string }; leads: LeadRow[] }>(`/api/campaigns/${c.slug}/leads`);
      setLeads({ campaign: d.campaign.title, rows: d.leads });
    } catch (err) {
      toast({ title: "Gagal memuat lead", description: (err as Error).message });
    }
  };

  const setLeadStatus = async (leadId: string, status: string, slug?: string) => {
    try {
      await apiSend(`/api/campaigns/${slug || "x"}/leads`, "PUT", { id: leadId, status });
      setLeads((prev) => prev ? { ...prev, rows: prev.rows.map((l) => (l.id === leadId ? { ...l, status } : l)) } : prev);
    } catch (err) {
      toast({ title: "Gagal ubah status lead", description: (err as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Kampanye Musiman</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Landing kampanye per musim + pelacakan lead konversi (R-089). Landing publik: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">/kampanye/&lt;slug&gt;</code>
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm()); setEditId(null); setDialog(true); }} className="bg-gradient-to-r from-primary to-forest text-white">
          <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Kampanye Baru
        </Button>
      </div>

      {rows === null ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
          <Icon name="megaphone" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Belum ada kampanye — buat yang pertama untuk musim Ramadan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.id} className={cn("rounded-2xl border bg-card p-5 shadow-sm", c.active ? "border-emerald-500/30" : "opacity-80")}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-extrabold">
                    {c.title}
                    <Badge variant="outline" className="text-[9px] font-bold">{SEASON_LABEL[c.season] || c.season}</Badge>
                    <Badge variant="outline" className={cn("text-[9px] font-bold", c.active ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : "border-muted-foreground/40 bg-muted text-muted-foreground")}>
                      {c.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <span dir="ltr" className="font-mono">/kampanye/{c.slug}</span>
                    {c.subtitle ? <> — {c.subtitle}</> : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openLeads(c)}>
                    <Icon name="inbox" className="h-3.5 w-3.5 mr-1" aria-hidden /> Lead ({c.leadTotal})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(c)}>
                    <Icon name={c.active ? "eye" : "ban"} className="h-3.5 w-3.5 mr-1" aria-hidden />
                    {c.active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setForm({ title: c.title, season: c.season, subtitle: c.subtitle, description: c.description, ctaText: c.ctaText, active: c.active }); setEditId(c.id); setDialog(true); }}>
                    <Icon name="pencil" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ubah
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/40" onClick={() => remove(c)}>
                    <Icon name="trash" className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["NEW", "CONTACTED", "CONVERTED", "INVALID"] as const).map((st) => (
                  <Badge key={st} variant="outline" className={cn("text-[9px] font-bold", LEAD_TONE[st])}>
                    {LEAD_STATUS[st]}: {c.leadStats[st] || 0}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog form kampanye */}
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setDialog(false)}>
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-extrabold">{editId ? "Ubah Kampanye" : "Kampanye Baru"}</h2>
            <div className="space-y-1.5">
              <Label htmlFor="cp-title">Judul *</Label>
              <Input id="cp-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={4} placeholder="Umroh Ramadan 1447 H — Early Bird" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp-season">Musim</Label>
                <select id="cp-season" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {Object.entries(SEASON_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-cta">Teks CTA</Label>
                <Input id="cp-cta" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-sub">Subjudul</Label>
              <Input id="cp-sub" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Tabungan bertahap mulai Rp1 juta/bulan" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-desc">Deskripsi</Label>
              <Textarea id="cp-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Ceritakan penawaran kampanye…" />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
              Aktif (landing publik tersembunyi bila mati)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-white">
                <Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Simpan
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Drawer lead */}
      {leads && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setLeads(null)}>
          <div className="flex h-full w-full max-w-md flex-col border-l bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="font-extrabold">Lead — {leads.campaign}</h2>
                <p className="text-xs text-muted-foreground">{leads.rows.length} pendaftar</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => setLeads(null)} aria-label="Tutup">
                <Icon name="x" className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {leads.rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Belum ada lead masuk.</p>
              ) : (
                leads.rows.map((l) => (
                  <div key={l.id} className="rounded-xl border bg-card p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{l.name}</p>
                        <p dir="ltr" className="font-mono text-xs text-muted-foreground">{l.phone}</p>
                        {l.email && <p className="truncate text-xs text-muted-foreground">{l.email}</p>}
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">sumber: {l.source}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-[9px] font-bold", LEAD_TONE[l.status])}>
                        {LEAD_STATUS[l.status] || l.status}
                      </Badge>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <a href={`https://wa.me/${l.phone.replace(/^0/, "62").replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-500/10">
                        <Icon name="phone" className="h-3 w-3 mr-1" aria-hidden /> WA
                      </a>
                      {["CONTACTED", "CONVERTED", "INVALID"].map((st) => (
                        <button key={st} onClick={() => setLeadStatus(l.id, st)} className="inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-bold text-muted-foreground hover:bg-muted">
                          → {LEAD_STATUS[st]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
