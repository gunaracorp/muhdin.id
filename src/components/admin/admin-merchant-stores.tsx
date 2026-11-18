"use client";

/**
 * R-046 v15.0.0 «GOD MODE» — CMS "Lapak Mitra": verifikasi pengajuan
 * (PENDING → ACTIVE/SUSPENDED), kelola produk tiap lapak, hapus lapak.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  unit: string;
  desc: string | null;
  active: boolean;
}

interface StoreRow {
  id: string;
  slug: string;
  storeName: string;
  ownerName: string;
  phone: string;
  city: string;
  category: string;
  nib: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  products: ProductRow[];
}

const STATUS_TONE: Record<StoreRow["status"], string> = {
  PENDING: "bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300",
  ACTIVE: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40 dark:text-emerald-300",
  SUSPENDED: "bg-rose-500/10 text-rose-700 border-rose-500/40 dark:text-rose-300",
};

export function AdminMerchantStores() {
  const { toast } = useToast();
  const { t } = useT();
  const [stores, setStores] = useState<StoreRow[] | null>(null);
  const [prodForm, setProdForm] = useState<{ storeId: string; name: string; price: string } | null>(null);

  const load = useCallback(() => {
    apiGet<{ stores: StoreRow[] }>("/api/merchant-stores?all=1")
      .then((d) => setStores(d.stores ?? []))
      .catch(() => setStores(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (s: StoreRow, status: StoreRow["status"]) => {
    try {
      await apiSend(`/api/merchant-stores/${s.id}`, "PUT", { status, note: s.nib ? `NIB: ${s.nib}` : "" });
      toast({ title: t("adminLapak.updated"), description: `${s.storeName} → ${status}` });
      load();
    } catch (e) {
      toast({ title: t("adminLapak.fail"), description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const remove = async (s: StoreRow) => {
    try {
      await apiSend(`/api/merchant-stores/${s.id}`, "DELETE");
      toast({ title: t("adminLapak.deleted"), description: s.storeName });
      load();
    } catch (e) {
      toast({ title: t("adminLapak.fail"), description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const addProduct = async () => {
    if (!prodForm) return;
    const price = parseInt(prodForm.price, 10);
    if (!prodForm.name.trim() || !Number.isFinite(price) || price < 0) {
      toast({ title: t("adminLapak.fail"), description: t("adminLapak.prodInvalid"), variant: "destructive" });
      return;
    }
    try {
      await apiSend(`/api/merchant-stores/${prodForm.storeId}`, "POST", { name: prodForm.name.trim(), price });
      toast({ title: t("adminLapak.prodAdded"), description: prodForm.name.trim() });
      setProdForm(null);
      load();
    } catch (e) {
      toast({ title: t("adminLapak.fail"), description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4" data-testid="admin-merchant-stores">
      <div>
        <h2 className="text-lg font-extrabold">{t("adminLapak.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("adminLapak.desc")}</p>
      </div>

      {!stores ? (
        <p className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">{t("adminLapak.loading")}</p>
      ) : stores.length === 0 ? (
        <p className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">{t("adminLapak.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {stores.map((s) => (
            <li key={s.id} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-extrabold">
                    {s.storeName} <span className="text-xs font-bold text-muted-foreground">· {s.city} · {s.ownerName}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">{s.phone}{s.nib ? ` · NIB ${s.nib}` : ""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", STATUS_TONE[s.status])}>{s.status}</Badge>
                  {s.status !== "ACTIVE" && (
                    <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setStatus(s, "ACTIVE")}>
                      {t("adminLapak.approve")}
                    </Button>
                  )}
                  {s.status === "ACTIVE" && (
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setStatus(s, "SUSPENDED")}>
                      {t("adminLapak.suspend")}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setProdForm({ storeId: s.id, name: "", price: "" })}>
                    <Icon name="plus" className="h-3.5 w-3.5" aria-hidden />
                    <span className="ms-1">{t("adminLapak.addProduct")}</span>
                  </Button>
                  <Button size="sm" variant="destructive" className="h-8" onClick={() => remove(s)}>
                    {t("adminLapak.delete")}
                  </Button>
                </div>
              </div>
              {s.products.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.products.length} {t("adminLapak.products")}: {s.products.map((p) => p.name).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Dialog produk sederhana */}
      {prodForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={() => setProdForm(null)}>
          <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-xl" role="document" aria-label={t("adminLapak.addProduct")} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-extrabold">{t("adminLapak.addProduct")}</h3>
            <div className="mt-3 space-y-2">
              <Input placeholder={t("adminLapak.prodName")} value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
              <Input placeholder={t("adminLapak.prodPrice")} value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value.replace(/[^0-9]/g, "") })} inputMode="numeric" dir="ltr" />
            </div>
            <div className="mt-3 flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-primary to-forest text-white" onClick={addProduct}>{t("adminLapak.save")}</Button>
              <Button variant="outline" className="flex-1" onClick={() => setProdForm(null)}>{t("adminLapak.cancel")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
