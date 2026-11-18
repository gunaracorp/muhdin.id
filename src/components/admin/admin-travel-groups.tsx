"use client";

/**
 * R-012 (v13.3) — CMS "Grup Perjalanan Digital".
 * CRUD grup rombongan via CrudManager: nama, keberangkatan, kontak marshal,
 * catatan, status. Kode bergabung (MHD-GR-XXXX) dibangkitkan server dan tidak
 * dapat diedit — sebar ke jamaah rombongan untuk masuk ruang #/grup.
 * Jadwal kumpul ditambah melalui /api/travel-groups/schedules (endpoint terpisah).
 */

import { CrudManager } from "@/components/admin/crud-manager";
import type { ColumnDef, FieldDef } from "@/components/admin/crud-manager";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/site/icon";
import { cn } from "@/lib/utils";

export interface TravelGroupItem {
  id: string;
  code: string;
  name: string;
  departureDate: string | null;
  marshalName: string;
  marshalPhone: string;
  notes: string | null;
  status: string;
  pkg?: { id: string; title: string; departureDate?: string | null } | null;
  _count?: { members: number; messages: number; schedules: number };
}

const FIELDS: FieldDef[] = [
  { key: "name", label: "Nama Grup / Rombongan", type: "text", required: true, full: true, placeholder: "Rombl. Bakti Madinah 01" },
  { key: "departureDate", label: "Tanggal Keberangkatan (YYYY-MM-DD)", type: "text", placeholder: "2026-05-12" },
  { key: "marshalName", label: "Nama Marshal", type: "text", placeholder: "Ust. Kholid Ibrahim" },
  { key: "marshalPhone", label: "WhatsApp Marshal", type: "text", placeholder: "+6281234567890" },
  { key: "notes", label: "Catatan untuk Jamaah", type: "textarea", full: true, placeholder: "Kumpul di Terminal 3 lane 5, 4 jam sebelum terbang." },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "ACTIVE", label: "ACTIVE — ruang terbuka" },
      { value: "ARCHIVED", label: "ARCHIVED — ruang ditutup" },
    ],
  },
];

function fmtTanggal(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export function AdminTravelGroups() {
  const columns: ColumnDef<TravelGroupItem>[] = [
    {
      key: "code",
      label: "Kode Bergabung",
      render: (g) => <span className="font-mono text-xs font-extrabold text-gold-deep" dir="ltr">{g.code}</span>,
    },
    { key: "name", label: "Nama Grup" },
    {
      key: "departure",
      label: "Keberangkatan",
      hideOnMobile: true,
      render: (g) => <span className="text-xs text-muted-foreground">{fmtTanggal(g.departureDate)}</span>,
    },
    {
      key: "marshal",
      label: "Marshal",
      hideOnMobile: true,
      render: (g) => (
        <span className="text-xs">
          {g.marshalName || "—"}
          {g.marshalPhone && <span className="block text-muted-foreground" dir="ltr">{g.marshalPhone}</span>}
        </span>
      ),
    },
    {
      key: "count",
      label: "Anggota",
      hideOnMobile: true,
      render: (g) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold tabular-nums">
          <Icon name="users" className="h-3 w-3" aria-hidden /> {g._count?.members ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (g) => (
        <Badge variant="outline" className={cn("text-[10px] font-extrabold",
          g.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
          {g.status}
        </Badge>
      ),
    },
  ];

  return (
    <CrudManager<TravelGroupItem>
      config={{
        title: "Grup Perjalanan Digital",
        description:
          "Ruang khusus per rombongan di portal #/grup: daftar anggota, chat singkat, jadwal kumpul, dan kontak marshal. Kode bergabung dibangkitkan otomatis (MHD-GR-XXXX) — sebar ke jamaah; jadwal kumpul dikelola lewat menu Jadwal Grup.",
        endpoint: "/api/travel-groups",
        itemName: "Grup Perjalanan",
        searchKeys: ["name", "code", "marshalName", "marshalPhone"],
        defaultItem: () => ({ name: "", departureDate: "", marshalName: "", marshalPhone: "", notes: "", status: "ACTIVE" }),
        fields: FIELDS,
        columns,
      }}
    />
  );
}
