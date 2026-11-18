"use client";

/**
 * R-043 (v14.1) — CMS "Harga Musiman & Early Bird": pilih paket, kelola
 * aturan SEASONAL (jendela bulan) & EARLYBIRD (deadline), aktif/nonaktif.
 * Harga final selalu dihitung server-side di checkout & group order B2B.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { describeRule } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface PkgOption {
  id: string;
  title: string;
  price: number;
}
interface RuleRow {
  id: string;
  packageId: string;
  kind: string;
  monthFrom: number | null;
  monthTo: number | null;
  deadline: string | null;
  adjustType: string;
  value: number;
  label: string;
  active: boolean;
  tourPackage?: { title: string };
}

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function AdminPriceRules() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PkgOption[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [packageId, setPackageId] = useState("");
  const [kind, setKind] = useState("SEASONAL");
  const [adjustType, setAdjustType] = useState("PERCENT");
  const [value, setValue] = useState("10");
  const [monthFrom, setMonthFrom] = useState("1");
  const [monthTo, setMonthTo] = useState("2");
  const [deadline, setDeadline] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pkgs, list] = await Promise.all([
        apiGet<PkgOption[]>("/api/packages"),
        apiGet<RuleRow[]>("/api/price-rules"),
      ]);
      setPackages(pkgs);
      setRules(list);
    } catch {
      toast({ title: "Gagal memuat aturan harga.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const pkgById = useMemo(() => new Map(packages.map((p) => [p.id, p])), [packages]);

  async function create() {
    setBusy(true);
    try {
      await apiSend("/api/price-rules", "POST", {
        packageId,
        kind,
        adjustType,
        value: Number(value),
        ...(kind === "SEASONAL" ? { monthFrom: Number(monthFrom), monthTo: Number(monthTo) } : { deadline }),
        label,
      });
      toast({ title: "Aturan harga dibuat — berlaku di checkout berikutnya." });
      setValue("10");
      setLabel("");
      await load();
    } catch (e) {
      toast({ title: (e as Error).message || "Gagal membuat aturan.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(r: RuleRow) {
    try {
      await apiSend(`/api/price-rules/${r.id}`, "PUT", { active: !r.active });
      await load();
    } catch {
      toast({ title: "Gagal mengubah aturan.", variant: "destructive" });
    }
  }

  async function remove(r: RuleRow) {
    try {
      await apiSend(`/api/price-rules/${r.id}`, "DELETE", {});
      await load();
    } catch {
      toast({ title: "Gagal menghapus aturan.", variant: "destructive" });
    }
  }

  const eligible = packageId && Number(value) > 0 && (kind === "SEASONAL" ? Number(monthFrom) >= 1 && Number(monthTo) >= 1 : deadline.length >= 10);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 shadow-sm" data-testid="pricerule-form">
        <div className="flex items-center gap-2">
          <Icon name="ticket-percent" className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-lg font-extrabold">Aturan Harga Baru</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Harga dihitung ulang server-side setiap checkout — klien tidak pernah dipercaya. Early Bird diterapkan dulu, lalu Musiman.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-3">
            <Label>Paket</Label>
            <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="pricerule-package">
              <option value="">— pilih paket —</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>{p.title} ({rupiah(p.price)})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Jenis</Label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="pricerule-kind">
              <option value="SEASONAL">Musiman (per bulan keberangkatan)</option>
              <option value="EARLYBIRD">Early Bird (deadline pemesanan)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Jenis Potongan</Label>
            <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="PERCENT">Persen</option>
              <option value="FIXED">Rupiah</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Nilai ({adjustType === "PERCENT" ? "1–100 %" : "Rp"})</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" min={1} data-testid="pricerule-value" />
          </div>
          {kind === "SEASONAL" ? (
            <>
              <div className="space-y-1.5">
                <Label>Bulan Mulai</Label>
                <select value={monthFrom} onChange={(e) => setMonthFrom(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {BULAN.slice(1).map((b, i) => (
                    <option key={b} value={String(i + 1)}>{i + 1} — {b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Bulan Berakhir</Label>
                <select value={monthTo} onChange={(e) => setMonthTo(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {BULAN.slice(1).map((b, i) => (
                    <option key={b} value={String(i + 1)}>{i + 1} — {b}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-1.5 md:col-span-2">
              <Label>Deadline (YYYY-MM-DD)</Label>
              <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="2026-12-31" />
            </div>
          )}
          <div className="space-y-1.5 md:col-span-3">
            <Label>Label Promo (tampil di katalog)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Promo Winter Journey" />
          </div>
        </div>
        <Button className="mt-4" onClick={() => void create()} disabled={busy || !eligible} data-testid="pricerule-submit">
          <Icon name="plus" className="mr-1.5 h-4 w-4" aria-hidden />Buat Aturan
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm" data-testid="pricerule-list">
        {rules.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada aturan harga.</p>
        ) : (
          <div className="divide-y">
            {rules.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" data-testid={`pricerule-row-${r.id}`}>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">
                    {r.tourPackage?.title ?? pkgById.get(r.packageId)?.title ?? "Paket"}
                    <Badge className={cn("ms-2 text-[10px]", r.kind === "EARLYBIRD" ? "bg-gold/15 text-gold-deep dark:text-gold" : "bg-primary/10 text-primary")}>
                      {r.kind}
                    </Badge>
                    {!r.active && <Badge variant="secondary" className="ms-1 text-[10px]">NONAKTIF</Badge>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {describeRule({ ...r, deadline: r.deadline ? new Date(r.deadline) : null })} {r.label ? `· ${r.label}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void toggle(r)}>
                    <Icon name={r.active ? "eye-off" : "check"} className="mr-1 h-3.5 w-3.5" aria-hidden />
                    {r.active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => void remove(r)}>
                    <Icon name="trash" className="mr-1 h-3.5 w-3.5" aria-hidden />Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
