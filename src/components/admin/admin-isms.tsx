"use client";

/**
 * R-098 v15.0.0 «GOD MODE» — CMS "Kendali ISMS (ISO 27001)": kelola register
 * Annex A (CrudManager generik — endpoint /api/isms-controls, GET publik
 * memuat semua untuk seksi transparansi keamanan).
 */

import { CrudManager } from "@/components/admin/crud-manager";
import type { FieldDef } from "@/components/admin/crud-manager";

const CATEGORY_OPTS = ["Organisasi", "Manusia", "Fisik", "Teknologi"].map((c) => ({ value: c, label: c }));
const STATUS_OPTS = [
  { value: "PLANNED", label: "Direncanakan" },
  { value: "IMPLEMENTED", label: "Terimplementasi" },
  { value: "VERIFIED", label: "Terverifikasi" },
];

export function AdminIsms() {
  const config = {
    title: "Kendali ISMS — ISO 27001:2022",
    description:
      "Register kendali Annex A dengan status implementasi & bukti — tampil publik di Compliance Hub (R-098).",
    endpoint: "/api/isms-controls",
    itemName: "Kendali ISMS",
    searchKeys: ["code", "title", "category"],
    defaultItem: () => ({
      code: "A.5.1",
      title: "Kebijakan keamanan informasi",
      category: "Organisasi",
      status: "PLANNED",
      evidence: "",
    }),
    fields: [
      { key: "code", label: "Kode Kendali", type: "text", required: true, placeholder: "A.5.1", hint: "Nomor Annex A (ISO 27001:2022)" },
      { key: "title", label: "Judul Kendali", type: "text", required: true, full: true },
      { key: "category", label: "Kategori", type: "select", options: CATEGORY_OPTS, required: true },
      { key: "status", label: "Status", type: "select", options: STATUS_OPTS, required: true },
      { key: "evidence", label: "Bukti / Tautan", type: "textarea", full: true, placeholder: "Dokumen, repo, atau halaman bukti implementasi" },
    ] as FieldDef[],
    columns: [
      { key: "code", label: "Kode" },
      { key: "title", label: "Kendali" },
      { key: "category", label: "Kategori" },
      { key: "status", label: "Status" },
    ],
  };
  return <CrudManager config={config} />;
}
