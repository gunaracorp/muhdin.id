"use client";

/**
 * R-042 (v14.0) — CMS "Voucher & Kupon Kampanye".
 * Kartu ringkasan kampanye (aktif, terpakai, tebusan LUNAS, total diskon
 * diberikan) + CRUD kupon via CrudManager: kode, jenis potongan, nilai,
 * minimum belanja, batas maksimum, jendela kampanye, kuota total & per
 * nomor WhatsApp. Tebusan nyata tercatat otomatis saat order LUNAS.
 */

import { useCallback, useEffect, useState } from "react";
import { CrudManager } from "@/components/admin/crud-manager";
import type { ColumnDef, FieldDef } from "@/components/admin/crud-manager";
import { apiGet } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/site/icon";
import { cn } from "@/lib/utils";

export interface CouponItem {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  minAmount: number;
  maxDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  perPhoneLimit: number;
  active: boolean;
  description: string;
}

interface CouponStats {
  total: number;
  active: number;
  usedCount: number;
  totalRedemptions: number;
  discountGiven: number;
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const FIELDS: FieldDef[] = [
  { key: "code", label: "Kode Kupon", type: "text", required: true, placeholder: "UMRAH14 — huruf besar, tanpa spasi" },
  {
    key: "discountType",
    label: "Jenis Potongan",
    type: "select",
    required: true,
    options: [
      { value: "PERCENT", label: "PERCENT — persen dari subtotal" },
      { value: "FIXED", label: "FIXED — rupiah tetap" },
    ],
  },
  { key: "value", label: "Nilai (persen 1–100 atau rupiah)", type: "number", required: true },
  { key: "minAmount", label: "Subtotal Minimum (Rp, 0 = bebas)", type: "number" },
  { key: "maxDiscount", label: "Batas Maksimum Diskon PERCENT (Rp, kosong = tanpa batas)", type: "number" },
  { key: "startsAt", label: "Mulai (YYYY-MM-DD HH:mm, kosong = langsung)", type: "text", placeholder: "2026-03-01 00:00" },
  { key: "endsAt", label: "Berakhir (YYYY-MM-DD HH:mm, kosong = tanpa batas)", type: "text", placeholder: "2026-03-31 23:59" },
  { key: "usageLimit", label: "Kuota Total Pemakaian (kosong = tanpa batas)", type: "number" },
  { key: "perPhoneLimit", label: "Maks per Nomor WhatsApp", type: "number" },
  { key: "description", label: "Label/Keterangan Kupon", type: "text", full: true, placeholder: "Kampanye Ramadan — diskon paket umrah" },
  { key: "active", label: "Aktif (bisa dipakai jamaah)", type: "checkbox" },
];

function fmtTanggal(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export function AdminCoupons() {
  const [stats, setStats] = useState<CouponStats | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiGet<{ coupons: CouponItem[]; stats: CouponStats }>("/api/coupons?stats=1");
      setStats(data.stats);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    // Muat ringkasan saat modul dibuka (setState dalam callback async — bukan sinkron).
    let alive = true;
    apiGet<{ coupons: CouponItem[]; stats: CouponStats }>("/api/coupons?stats=1")
      .then((d) => {
        if (alive) setStats(d.stats);
      })
      .catch(() => {
        if (alive) setStats(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const cards = [
    { label: "Kupon Terdaftar", value: stats ? String(stats.total) : "—", icon: "ticket-percent", tone: "primary" },
    { label: "Sedang Aktif", value: stats ? String(stats.active) : "—", icon: "badge-check", tone: "forest" },
    { label: "Kali Dipakai", value: stats ? String(stats.usedCount) : "—", icon: "tag", tone: "gold" },
    { label: "Diskon Diberikan (LUNAS)", value: stats ? rupiah(stats.discountGiven) : "—", icon: "wallet", tone: "primary" },
  ];

  const columns: ColumnDef<CouponItem>[] = [
    {
      key: "code",
      label: "Kode",
      render: (c) => (
        <div className="flex items-center gap-2">
          <code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-extrabold tracking-wide text-primary">{c.code}</code>
          {!c.active && <Badge variant="secondary" className="text-[10px]">NONAKTIF</Badge>}
        </div>
      ),
    },
    {
      key: "value",
      label: "Potongan",
      hideOnMobile: true,
      render: (c) => <span className="font-bold">{c.discountType === "PERCENT" ? `${c.value}%` : rupiah(c.value)}</span>,
    },
    {
      key: "minAmount",
      label: "Minimum",
      hideOnMobile: true,
      render: (c) => (c.minAmount > 0 ? rupiah(c.minAmount) : "—"),
    },
    {
      key: "endsAt",
      label: "Berakhir",
      hideOnMobile: true,
      render: (c) => fmtTanggal(c.endsAt),
    },
    {
      key: "usedCount",
      label: "Terpakai",
      render: (c) => (
        <span className={cn("text-xs font-bold", c.usageLimit !== null && c.usedCount >= c.usageLimit && "text-destructive")}>
          {c.usedCount}{c.usageLimit !== null ? `/${c.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "active",
      label: "Status",
      hideOnMobile: true,
      render: (c) =>
        c.active ? (
          <Badge className="text-[10px]">AKTIF</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">NONAKTIF</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="coupon-stats">
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

      <CrudManager<CouponItem>
        config={{
          title: "Voucher & Kupon Kampanye",
          description:
            "Kode diskon berbatas waktu, kuota, dan segmen untuk checkout marketplace. Kupon dihitung ulang server-side saat checkout; tebusan dicatat otomatis saat pesanan LUNAS.",
          endpoint: "/api/coupons",
          itemName: "Kupon",
          searchKeys: ["code", "description"],
          defaultItem: () => ({
            id: "",
            code: "",
            discountType: "PERCENT",
            value: 10,
            minAmount: 0,
            maxDiscount: null,
            startsAt: null,
            endsAt: null,
            usageLimit: null,
            usedCount: 0,
            perPhoneLimit: 1,
            active: true,
            description: "",
          }),
          fields: FIELDS,
          columns,
          onSaved: loadStats,
        }}
      />
    </div>
  );
}
