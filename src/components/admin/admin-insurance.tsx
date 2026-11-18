"use client";

/**
 * R-048 v15.0.0 «GOD MODE» — CMS "Asuransi Perjalanan": kelola paket add-on
 * (CrudManager generik — endpoint /api/insurance-plans dengan ?all=1 admin).
 */

import { CrudManager } from "@/components/admin/crud-manager";
import type { FieldDef } from "@/components/admin/crud-manager";

export function AdminInsurance() {
  const config = {
    title: "Asuransi Perjalanan Add-on",
    description:
      "Kelola paket asuransi yang tampil di checkout — premi per jamaah dihitung ulang server-side (R-048).",
    endpoint: "/api/insurance-plans",
    itemName: "Paket Asuransi",
    searchKeys: ["code", "name", "provider"],
    extraQuery: "?all=1",
    defaultItem: () => ({
      code: "",
      name: "",
      provider: "",
      coverage: "Perlindungan perjalanan ibadah: kecelakaan, sakit, bagasi.",
      premium: 75_000,
      active: true,
    }),
    fields: [
      { key: "code", label: "Kode Paket", type: "text", required: true, placeholder: "INS-BASIC", hint: "Huruf besar/angka — unik" },
      { key: "name", label: "Nama Paket", type: "text", required: true, full: true },
      { key: "provider", label: "Penyedia Asuransi", type: "text", required: true },
      { key: "premium", label: "Premi per Jamaah (Rp)", type: "number", required: true, hint: "Dikali jumlah jamaah saat checkout" },
      { key: "coverage", label: "Ringkasan Perlindungan", type: "textarea", full: true },
      { key: "active", label: "Aktif (tampil di checkout)", type: "switch", full: true },
    ] as FieldDef[],
    columns: [
      { key: "code", label: "Kode" },
      { key: "name", label: "Nama Paket" },
      { key: "provider", label: "Penyedia" },
      { key: "premium", label: "Premi" },
    ],
  };
  return <CrudManager config={config} />;
}
