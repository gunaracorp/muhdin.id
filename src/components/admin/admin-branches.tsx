"use client";

/**
 * Task 19 — CMS "Jaringan Daerah (DPD & Branch Office)".
 * Kelola kepengurusan daerah yang tampil di halaman Tentang & Kontak portal.
 * Memakai CrudManager (pola AdminGallery/AdminManagement).
 */

import { CrudManager } from "@/components/admin/crud-manager";
import type { ColumnDef, FieldDef } from "@/components/admin/crud-manager";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/site/icon";
import type { RegionalBranchItem } from "@/lib/types";

export function AdminBranches() {
  const config = {
    title: "Jaringan Daerah (BKD)",
    description:
      "Kelola Badan Koordinasi Daerah & Branch Office yang tampil di halaman Tentang dan Kontak.",
    endpoint: "/api/branches",
    itemName: "Kepengurusan Daerah",
    searchKeys: ["name", "code", "province", "city", "picName", "officeName"],
    extraQuery: "?all=1",
    defaultItem: () => ({
      name: "",
      code: "",
      province: "",
      city: "",
      officeName: "",
      address: "",
      picName: "",
      picPhone: "",
      email: "",
      description: "",
      order: 99,
      published: true,
    }),
    fields: [
      {
        key: "name",
        label: "Nama Kepengurusan",
        type: "text",
        required: true,
        full: true,
        placeholder: "Badan Koordinasi Daerah Jawa Barat",
      },
      { key: "code", label: "Kode", type: "text", placeholder: "DPD-JABAR" },
      { key: "province", label: "Provinsi", type: "text", placeholder: "Jawa Barat" },
      { key: "city", label: "Kota", type: "text", placeholder: "Tasikmalaya" },
      { key: "officeName", label: "Nama Kantor", type: "text", placeholder: "Branch Office MUHDIN JABAR" },
      {
        key: "address",
        label: "Alamat Lengkap Kantor",
        type: "textarea",
        placeholder: "Perumahan Andalusia Garden Cluster Granada No.11, Mangkubumi, Tasikmalaya, 46181…",
        hint: "Dipakai juga untuk tautan Google Maps",
      },
      { key: "picName", label: "Nama PIC", type: "text", placeholder: "Tn. H. Muhammad Lutfi Azmi" },
      {
        key: "picPhone",
        label: "Nomor PIC (WhatsApp)",
        type: "text",
        placeholder: "+6281316516524",
        hint: "Format internasional 62xxx — otomatis mendapat tombol Chat WhatsApp di portal",
      },
      { key: "email", label: "Email (opsional)", type: "text", placeholder: "jabar@muhdin.web.id" },
      { key: "order", label: "Urutan Tampil", type: "number" },
      {
        key: "published",
        label: "Publikasikan",
        type: "switch",
        full: true,
        hint: "Kepengurusan yang tidak dipublikasikan hanya terlihat di CMS",
      },
      {
        key: "description",
        label: "Deskripsi Singkat",
        type: "textarea",
        placeholder: "Mengoordinasi keanggotaan & pembinaan penyelenggara di wilayah…",
      },
    ] as FieldDef[],
    columns: [
      {
        key: "name",
        label: "Kepengurusan",
        render: (b: RegionalBranchItem) => (
          <div className="max-w-xs min-w-0">
            <p className="font-semibold truncate">{b.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[b.city, b.province].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        ),
      },
      {
        key: "code",
        label: "Kode",
        hideOnMobile: true,
        render: (b: RegionalBranchItem) =>
          b.code ? (
            <span className="font-mono text-[11px] font-bold text-primary">{b.code}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "picName",
        label: "PIC",
        hideOnMobile: true,
        render: (b: RegionalBranchItem) => (
          <div className="max-w-[180px] min-w-0">
            <p className="text-xs font-medium truncate">{b.picName || "—"}</p>
            {b.picPhone ? (
              <p className="text-[11px] text-muted-foreground font-mono truncate" dir="ltr">
                {b.picPhone}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "address",
        label: "Kantor",
        hideOnMobile: true,
        render: (b: RegionalBranchItem) => (
          <div className="flex items-start gap-1.5 max-w-[220px] min-w-0">
            <Icon name="map-pin" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
              {b.address || "—"}
            </p>
          </div>
        ),
      },
      {
        key: "order",
        label: "Urutan",
        hideOnMobile: true,
        render: (b: RegionalBranchItem) => (
          <span className="text-muted-foreground tabular-nums">{b.order}</span>
        ),
      },
      {
        key: "published",
        label: "Status",
        render: (b: RegionalBranchItem) => (
          <Badge
            variant="outline"
            className={`text-[10px] font-bold ${
              b.published
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {b.published ? "Terbit" : "Draft"}
          </Badge>
        ),
      },
    ] as ColumnDef<RegionalBranchItem>[],
  };
  return <CrudManager<RegionalBranchItem> config={config} />;
}
