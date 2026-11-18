"use client";

/**
 * R-046 v15.0.0 «GOD MODE» — Lapak Mitra (Marketplace Onboarding).
 * Dua wajah dalam satu seksi:
 *  1. Direktori publik lapak ACTIVE + produknya (GET /api/merchant-stores).
 *  2. Form pengajuan buka lapak (POST → PENDING, diverifikasi panitia di CMS).
 * Dipasang di Pusat Bisnis (#/bisnis) sebagai tab/seksi mandiri.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  unit: string;
  desc: string | null;
}

interface StoreRow {
  id: string;
  slug: string;
  storeName: string;
  ownerName: string;
  city: string;
  category: string;
  products: ProductRow[];
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const CATS = ["PROVISION", "ATK", "OLEH_OLEH", "JASA", "LAINNYA"] as const;

export function LapakMitraSection() {
  const { t } = useT();
  const [stores, setStores] = useState<StoreRow[] | null>(null);
  const [openApply, setOpenApply] = useState(false);
  const [form, setForm] = useState({ storeName: "", ownerName: "", phone: "", city: "", category: "OLEH_OLEH", nib: "" });
  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [err, setErr] = useState("");

  const muat = useCallback(() => {
    apiGet<{ stores: StoreRow[] }>("/api/merchant-stores")
      .then((d) => setStores(d.stores ?? []))
      .catch(() => setStores([]));
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  const kirim = async () => {
    setErr("");
    setOkMsg("");
    if (form.storeName.trim().length < 3 || form.ownerName.trim().length < 2 || form.city.trim().length < 2) {
      return setErr(t("lapak.errForm"));
    }
    setBusy(true);
    try {
      const res = await apiSend<{ message: string }>("/api/merchant-stores", "POST", { ...form, pdpConsent: true });
      setOkMsg(res.message);
      setForm({ storeName: "", ownerName: "", phone: "", city: "", category: "OLEH_OLEH", nib: "" });
      muat();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("lapak.errSend"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t bg-muted/25 py-14" aria-label={t("lapak.aria")} data-testid="lapak-section">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold-deep dark:text-gold">
              <Icon name="store" className="h-3 w-3" aria-hidden /> R-046 · v15
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">{t("lapak.title")}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("lapak.desc")}</p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-forest text-white" onClick={() => { setOpenApply(true); setOkMsg(""); setErr(""); }} data-testid="lapak-apply">
            <Icon name="plus" className="h-4 w-4" aria-hidden />
            <span className="ms-1.5">{t("lapak.apply")}</span>
          </Button>
        </div>

        {!stores ? (
          <p className="mt-8 rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">{t("lapak.loading")}</p>
        ) : stores.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">{t("lapak.empty")}</p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <li key={s.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm" data-testid={`lapak-${s.slug}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-primary">
                    {t(`lapak.cat.${s.category.toLowerCase()}`)}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">{s.city}</span>
                </div>
                <h3 className="mt-2 font-extrabold leading-snug">{s.storeName}</h3>
                <p className="text-xs text-muted-foreground">{t("lapak.owner")}: {s.ownerName}</p>
                {s.products.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {s.products.slice(0, 4).map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
                        <span className="truncate text-xs font-semibold">{p.name}</span>
                        <span className="shrink-0 text-xs font-extrabold tabular-nums text-gold-deep dark:text-gold" dir="ltr">
                          {rupiah(p.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-lg bg-muted/40 p-2 text-center text-[11px] text-muted-foreground">{t("lapak.noProduct")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dialog pengajuan lapak */}
      <Dialog open={openApply} onOpenChange={setOpenApply}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("lapak.applyTitle")}</DialogTitle>
            <DialogDescription>{t("lapak.applyDesc")}</DialogDescription>
          </DialogHeader>
          {okMsg ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm" data-testid="lapak-sukses">
              <p className="font-extrabold text-emerald-700 dark:text-emerald-400">{t("lapak.sentTitle")}</p>
              <p className="mt-1 text-foreground/80">{okMsg}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="lapak-store">{t("lapak.storeName")} *</Label>
                <Input id="lapak-store" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} data-testid="lapak-store" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lapak-owner">{t("lapak.owner")} *</Label>
                  <Input id="lapak-owner" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lapak-phone">{t("lapak.phone")} *</Label>
                  <Input id="lapak-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812…" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lapak-city">{t("lapak.city")} *</Label>
                  <Input id="lapak-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lapak-cat">{t("lapak.category")} *</Label>
                  <select
                    id="lapak-cat"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-semibold"
                  >
                    {CATS.map((c) => (
                      <option key={c} value={c}>{t(`lapak.cat.${c.toLowerCase()}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lapak-nib">{t("lapak.nib")}</Label>
                <Input id="lapak-nib" value={form.nib} onChange={(e) => setForm({ ...form, nib: e.target.value })} placeholder="8120…" dir="ltr" />
                <p className="text-[11px] text-muted-foreground">{t("lapak.nibHint")}</p>
              </div>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked
                  onChange={() => undefined}
                  className={cn("mt-0.5 accent-[var(--primary)]")}
                  aria-label={t("lapak.pdp")}
                />
                {t("lapak.pdp")}
              </label>
              {err && <p className="text-sm font-bold text-destructive">{err}</p>}
              <Button className="w-full" onClick={kirim} disabled={busy} data-testid="lapak-submit">
                {busy ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="send" className="h-4 w-4" aria-hidden />}
                <span className="ms-1.5">{t("lapak.submit")}</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
