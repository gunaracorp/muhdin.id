"use client";

/**
 * admin-roadmap-items.tsx — v12.2 «99 ROADMAP UPGRADE» modul CMS.
 * CRUD 99 item upgrade via CrudManager; endpoint /api/roadmap/items.
 */
import { CrudManager, type ColumnDef, type FieldDef } from "@/components/admin/crud-manager";
import type { RoadmapItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  DONE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  IN_PROGRESS: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  PLANNED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};
const STATUS_LABEL: Record<string, string> = {
  DONE: "Sudah hidup",
  IN_PROGRESS: "Dikerjakan",
  PLANNED: "Direncanakan",
};
const PRIORITY_TONE: Record<string, string> = {
  P0: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
  P1: "bg-orange-500/12 text-orange-700 dark:text-orange-400",
  P2: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
  P3: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export function AdminRoadmapItems() {
  const config = {
    title: "Roadmap 99 Upgrade",
    description:
      "Kelola 99 item upgrade granular (6 pilar) yang tampil di halaman Tentang Kami — kode, pilar, prioritas, upaya, status, dan target versi.",
    endpoint: "/api/roadmap/items",
    itemName: "Item Upgrade",
    searchKeys: ["code", "title", "pillar", "target"],
    defaultItem: () => ({
      code: "",
      pillar: "PLATFORM",
      title: "",
      description: "",
      priority: "P2",
      effort: "M",
      status: "PLANNED",
      target: "v13",
      order: 99,
    }),
    fields: [
      { key: "code", label: "Kode", type: "text", required: true, placeholder: "Contoh: R-100" },
      {
        key: "pillar",
        label: "Pilar",
        type: "select",
        options: [
          { value: "JAMAAH", label: "Pengalaman Jamaah" },
          { value: "AKADEMI", label: "Akademi & KTA" },
          { value: "BISNIS", label: "Marketplace & Bisnis" },
          { value: "PLATFORM", label: "Platform & Teknologi" },
          { value: "KEAMANAN", label: "Keamanan & Kepatuhan" },
          { value: "EKOSISTEM", label: "Ekosistem & Pertumbuhan" },
        ],
      },
      { key: "title", label: "Judul Upgrade", type: "text", required: true, placeholder: "Contoh: Checkout Lengkap Paket" },
      {
        key: "priority",
        label: "Prioritas",
        type: "select",
        options: [
          { value: "P0", label: "P0 — Kritis" },
          { value: "P1", label: "P1 — Tinggi" },
          { value: "P2", label: "P2 — Menengah" },
          { value: "P3", label: "P3 — Nisbah" },
        ],
      },
      {
        key: "effort",
        label: "Upaya",
        type: "select",
        options: [
          { value: "S", label: "S — Kecil" },
          { value: "M", label: "M — Sedang" },
          { value: "L", label: "L — Besar" },
          { value: "XL", label: "XL — Sangat besar" },
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "DONE", label: "Sudah hidup" },
          { value: "IN_PROGRESS", label: "Sedang dikerjakan" },
          { value: "PLANNED", label: "Direncanakan" },
        ],
      },
      { key: "target", label: "Target Versi", type: "text", placeholder: "Contoh: v13" },
      { key: "order", label: "Urutan", type: "number" },
      { key: "description", label: "Deskripsi", type: "textarea", full: true },
    ] as FieldDef[],
    columns: [
      { key: "code", label: "Kode", render: (r: RoadmapItem) => (
        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">{r.code}</span>
      ) },
      { key: "title", label: "Judul", render: (r: RoadmapItem) => (
        <div>
          <p className="font-semibold">{r.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">{r.description}</p>
        </div>
      ) },
      { key: "pillar", label: "Pilar", hideOnMobile: true },
      { key: "priority", label: "Prio", render: (r: RoadmapItem) => (
        <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-bold", PRIORITY_TONE[r.priority] ?? "")}>{r.priority}</span>
      ) },
      { key: "status", label: "Status", render: (r: RoadmapItem) => (
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", STATUS_TONE[r.status] ?? "")}>
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      ) },
      { key: "target", label: "Target", hideOnMobile: true },
    ] as ColumnDef<RoadmapItem>[],
  };
  return <CrudManager<RoadmapItem> config={config} />;
}
