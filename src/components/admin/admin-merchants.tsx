"use client";

/**
 * R-029 (v14.1) — CMS "Merchant Partner": kartu statistik tebusan +
 * CRUD merchant mitra (kategori, diskon, tier minimum, masa berlaku).
 */

import { useCallback, useEffect, useState } from "react";
import { CrudManager } from "@/components/admin/crud-manager";
import type { ColumnDef, FieldDef } from "@/components/admin/crud-manager";
import { apiGet } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/site/icon";
import { cn } from "@/lib/utils";

interface MerchantRow {
  id: string;
  name: string;
  category: string;
  discountText: string;
  city: string;
  address: string;
  phone: string;
  minTier: string;
  validUntil: string | null;
  active: boolean;
  description: string;
  _count?: { redemptions: number };
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

const FIELDS: FieldDef[] = [
  { key: "name", label: "Nama Merchant", type: "text", required: true, full: true, placeholder: "Toko Kurma Nabawi Jakarta" },
  {
    key: "category",
    label: "Kategori",
    type: "select",
    options: [
      { value: "RITEL", label: "Ritel" },
      { value: "HOTEL", label: "Hotel" },
      { value: "TRANSPORTASI", label: "Transportasi" },
      { value: "PAKAIAN", label: "Pakaian" },
      { value: "ELEKTRONIK", label: "Elektronik" },
      { value: "KULINER", label: "Kuliner" },
      { value: "UMUM", label: "Umum" },
    ],
  },
  { key: "discountText", label: "Uraian Diskon", type: "text", required: true, full: true, placeholder: "20% untuk semua produk kurma premium" },
  { key: "city", label: "Kota", type: "text" },
  { key: "address", label: "Alamat", type: "text", full: true },
  { key: "phone", label: "Telepon Lokasi", type: "text" },
  {
    key: "minTier",
    label: "Tier KTA Minimum",
    type: "select",
    options: [
      { value: "KLASIK", label: "KLASIK (semua anggota)" },
      { value: "VERIFIED", label: "VERIFIED (300+ poin)" },
      { value: "PLATINUM", label: "PLATINUM (800+ poin)" },
    ],
  },
  { key: "validUntil", label: "Berlaku Hingga (YYYY-MM-DD, kosong = tanpa batas)", type: "text" },
  { key: "description", label: "Deskripsi / Syarat", type: "textarea", full: true },
  { key: "active", label: "Aktif (tampil di katalog #/benefit)", type: "checkbox" },
];

export function AdminMerchants() {
  const [stats, setStats] = useState<{ total: number; active: number; redemptions: number } | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiGet<{ stats: { total: number; active: number; redemptions: number } }>("/api/merchants?stats=1");
      setStats(data.stats);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    // Muat ringkasan saat modul dibuka (callback async — bukan setState sinkron).
    let alive = true;
    apiGet<{ stats: { total: number; active: number; redemptions: number } }>("/api/merchants?stats=1")
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
    { label: "Merchant Mitra", value: stats ? String(stats.total) : "—", icon: "store", tone: "primary" },
    { label: "Sedang Aktif", value: stats ? String(stats.active) : "—", icon: "badge-check", tone: "forest" },
    { label: "Tebusan KTA Tercatat", value: stats ? rupiah(stats.redemptions) : "—", icon: "ticket-check", tone: "gold" },
  ];

  const columns: ColumnDef<MerchantRow>[] = [
    {
      key: "name",
      label: "Merchant",
      render: (m) => (
        <div>
          <p className="font-bold">{m.name}</p>
          <p className="text-xs text-muted-foreground">{m.category} · {m.city || "—"}</p>
        </div>
      ),
    },
    { key: "discountText", label: "Diskon", hideOnMobile: true, render: (m) => <span className="text-xs font-bold text-primary">{m.discountText}</span> },
    { key: "minTier", label: "Tier", hideOnMobile: true, render: (m) => <Badge variant="secondary" className="text-[10px]">{m.minTier}+</Badge> },
    {
      key: "tebus",
      label: "Tebusan",
      hideOnMobile: true,
      render: (m) => <span className="text-xs font-bold">{m._count?.redemptions ?? 0}</span>,
    },
    {
      key: "active",
      label: "Status",
      render: (m) =>
        m.active ? (
          <Badge className="text-[10px]">AKTIF</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">NONAKTIF</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3" data-testid="merchant-stats">
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

      <CrudManager<MerchantRow>
        config={{
          title: "Merchant Partner Benefit KTA",
          description:
            "Diskon & fasilitas merchant mitra yang ditukar langsung dengan kartu KTA (R-029). Tier minimum divalidasi server-side saat tebus; tebusan dicatat sebagai jejak untuk mitra.",
          endpoint: "/api/merchants",
          extraQuery: "?all=1",
          itemName: "Merchant",
          searchKeys: ["name", "discountText", "city"],
          defaultItem: () => ({
            id: "",
            name: "",
            category: "UMUM",
            discountText: "",
            city: "",
            address: "",
            phone: "",
            minTier: "KLASIK",
            validUntil: null,
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
