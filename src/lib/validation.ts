/**
 * validation.ts — R-081 v14.1 «AKADEMI & MITRA» — Validasi Zod Menyeluruh.
 *
 * Skema validasi input untuk seluruh API mutasi utama — input kotor ditolak
 * di gerbang sebelum menyentuh DB. Prinsip:
 *   • Schema di sini adalah sumber kebenaran bentuk payload publik.
 *   • Pesan error berbahasa Indonesia, ramah, tanpa bocor detail internal.
 *   • Endpoint tetap memakai logika bisnisnya sendiri; Zod hanya gerbang bentuk.
 *
 * Pola pemakaian:
 *   const parsed = safeBody(CheckoutSchema, body);
 *   if (!parsed.ok) return fail(parsed.error);
 */

import { z } from "zod";
import type { ZodType } from "zod";

/** Ambil pesan error pertama yang ramah dari hasil parse Zod. */
function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Data tidak valid.";
  const field = issue.path.filter((p) => typeof p === "string").join(".");
  const base = issue.message;
  return field ? `${field}: ${base}` : base;
}

/** Parse aman; tidak melempar — selalu hasil { ok, data } atau { ok:false, error }. */
export function safeBody<T>(schema: ZodType<T>, raw: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: firstIssue(result.error) };
}

/* ---------- primitif bersama ---------- */

const phoneId = z
  .string()
  .trim()
  .regex(/^[+\-\s()0-9]{8,20}$/, "Nomor WhatsApp/telepon tidak valid.");

const nameId = (min = 3, max = 80) =>
  z.string().trim().min(min, `Minimal ${min} karakter`).max(max, `Maksimal ${max} karakter`);

const pdpTrue = z.literal(true, { message: "Persetujuan Pelindungan Data Pribadi (UU PDP) wajib dicentang." });

/* ---------- R-010/R-042/R-043 checkout ---------- */

export const CheckoutSchema = z.object({
  packageId: z.string().trim().min(1, "Paket tidak valid.").max(64),
  name: nameId(),
  phone: phoneId,
  email: z.union([z.literal(""), z.string().trim().email("Format email tidak valid.")]).optional().default(""),
  quantity: z.coerce.number().int().min(1, "Jumlah minimal 1").max(50, "Jumlah maksimal 50").default(1),
  notes: z.string().trim().max(500).optional().default(""),
  couponCode: z.string().trim().max(40).optional().default(""),
  pdpConsent: pdpTrue,
});
export type CheckoutInput = z.infer<typeof CheckoutSchema>;

/* ---------- R-033 pendaftaran anggota ---------- */

export const ApplicationSchema = z.object({
  orgName: nameId(3, 120),
  type: z.string().trim().min(1, "Jenis lembaga wajib dipilih.").max(40),
  contactName: nameId(3, 120),
  email: z.string().trim().email("Format email tidak valid.").max(120),
  phone: phoneId,
  city: z.string().trim().min(1, "Kota wajib diisi.").max(80),
  province: z.string().trim().max(80).optional().default(""),
  licenseNo: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().max(2000).optional().nullable(),
  pdpConsent: pdpTrue,
});
export type ApplicationInput = z.infer<typeof ApplicationSchema>;

/* ---------- v5.0 forum ---------- */

export const ForumThreadSchema = z.object({
  title: z.string().trim().min(8, "Judul pertanyaan minimal 8 karakter").max(150, "Judul maksimal 150 karakter"),
  body: z.string().trim().min(20, "Isi diskusi minimal 20 karakter agar mudah dijawab").max(5000, "Isi maksimal 5000 karakter"),
  authorName: z.string().trim().min(3, "Nama Anda minimal 3 karakter").max(80),
  authorContact: z.string().trim().max(80).optional().default(""),
  category: z.enum(["Umum", "Manasik", "Dokumen", "Perjalanan", "Akomodasi", "Biaya", "Lainnya"], { message: "Kategori tidak dikenal." }),
  kelasId: z.string().trim().max(64).optional(), // R-025 forum per-kelas
});
export type ForumThreadInput = z.infer<typeof ForumThreadSchema>;

export const ForumReplySchema = z.object({
  body: z.string().trim().min(3, "Balasan minimal 3 karakter").max(2000, "Balasan maksimal 2000 karakter"),
  authorName: nameId(2, 80),
  authorContact: z.string().trim().max(80).optional().default(""),
});
export type ForumReplyInput = z.infer<typeof ForumReplySchema>;

/* ---------- R-012 grup perjalanan ---------- */

export const GroupJoinSchema = z.object({
  code: z.string().trim().min(6, "Kode grup tidak valid.").max(16).transform((s) => s.toUpperCase()),
  fullName: nameId(2, 80),
  phone: phoneId,
  cardNo: z.string().trim().max(40).optional(),
});
export type GroupJoinInput = z.infer<typeof GroupJoinSchema>;

export const GroupMessageSchema = z.object({
  code: z.string().trim().min(6, "Kode grup tidak valid.").max(16).transform((s) => s.toUpperCase()),
  authorName: nameId(2, 80),
  body: z.string().trim().min(1, "Pesan tidak boleh kosong.").max(500, "Pesan maksimal 500 karakter"),
});
export type GroupMessageInput = z.infer<typeof GroupMessageSchema>;

/* ---------- R-042 kupon ---------- */

export const CouponValidateSchema = z.object({
  code: z.string().trim().min(1, "Kode kupon wajib diisi.").max(40),
  subtotal: z.coerce.number().int().min(0, "Subtotal tidak valid."),
  phone: z.string().trim().max(20).optional().default(""),
});
export type CouponValidateInput = z.infer<typeof CouponValidateSchema>;

/* ---------- R-093 funnel ---------- */

export const FunnelTrackSchema = z.object({
  stage: z.enum(["VIEW_PAKET", "VIEW_DAFTAR", "DAFTAR_SUBMIT"], { message: "Stage funnel tidak dikenal." }),
  meta: z.record(z.string(), z.union([z.string(), z.number()])).optional().default({}),
});
export type FunnelTrackInput = z.infer<typeof FunnelTrackSchema>;

/* ---------- R-011 push ---------- */

export const PushSubscribeSchema = z.object({
  endpoint: z.string().url("Endpoint push tidak valid.").max(500),
  keys: z.object({
    p256dh: z.string().min(1, "Kunci p256dh wajib ada.").max(200),
    auth: z.string().min(1, "Kunci auth wajib ada.").max(200),
  }),
  cardNo: z.string().trim().max(40).optional().nullable(),
});
export type PushSubscribeInput = z.infer<typeof PushSubscribeSchema>;

/* ---------- R-076 brankas ---------- */

export const JamaahDocSchema = z.object({
  cardNo: z.string().trim().min(4, "Nomor kartu wajib diisi.").max(40).transform((s) => s.toUpperCase()),
  kind: z.enum(["PASPOR", "VISA", "VAKSIN", "ASURANSI", "TIKET", "LAINNYA"], { message: "Jenis dokumen tidak dikenal." }),
  docNo: z.string().trim().max(80).optional().default(""),
  fileUrl: z.string().trim().max(300).optional().nullable(),
  note: z.string().trim().max(300).optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});
export type JamaahDocInput = z.infer<typeof JamaahDocSchema>;

/* ---------- R-023 latihan manasik ---------- */

export const SoalSubmitSchema = z.object({
  mode: z.literal("submit"),
  level: z.enum(["DASAR", "LANJUTAN", "MENTOR"], { message: "Jenjang tidak dikenal." }),
  answers: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        idx: z.coerce.number().int().min(0).max(9),
      })
    )
    .min(1, "Jawaban kosong.")
    .max(50, "Terlalu banyak jawaban."),
});
export type SoalSubmitInput = z.infer<typeof SoalSubmitSchema>;

/* ================= v14.1 «AKADEMI & MITRA» ================= */

/* ---------- R-024 kelas live ---------- */

export const LiveClassRegisterSchema = z.object({
  classId: z.string().trim().min(1, "Kelas tidak valid.").max(64),
  name: nameId(2, 80),
  phone: phoneId,
  waReminder: z.boolean().optional().default(true),
});
export type LiveClassRegisterInput = z.infer<typeof LiveClassRegisterSchema>;

/* ---------- R-045 rombongan B2B ---------- */

export const GroupOrderSchema = z.object({
  groupName: nameId(3, 120),
  coordinatorName: nameId(2, 80),
  coordinatorPhone: phoneId,
  packageId: z.string().trim().min(1, "Paket tidak valid.").max(64),
  membersText: z
    .string()
    .trim()
    .min(1, "Daftar anggota wajib diisi.")
    .max(20000, "Terlalu banyak anggota — pisah pengajuan per rombongan."),
  notes: z.string().trim().max(500).optional().default(""),
  pdpConsent: pdpTrue,
});
export type GroupOrderInput = z.infer<typeof GroupOrderSchema>;

/* ---------- R-044 pengajuan refund ---------- */

export const RefundRequestSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^ORD-\d{8}-[A-Z0-9]{4}$/i, "Format nomor pesanan tidak dikenal (ORD-YYYYMMDD-XXXX).")
    .transform((s) => s.toUpperCase()),
  phone: phoneId,
  reason: z.string().trim().min(5, "Alasan minimal 5 karakter").max(500, "Alasan maksimal 500 karakter"),
});
export type RefundRequestInput = z.infer<typeof RefundRequestSchema>;

/* ---------- R-029 tebus merchant ---------- */

export const MerchantRedeemSchema = z.object({
  merchantId: z.string().trim().min(1, "Merchant tidak valid.").max(64),
  cardNo: z
    .string()
    .trim()
    .min(6, "Nomor KTA tidak valid.")
    .max(40)
    .transform((s) => s.toUpperCase()),
  note: z.string().trim().max(200).optional().default(""),
});
export type MerchantRedeemInput = z.infer<typeof MerchantRedeemSchema>;

/* ---------- R-090 kemitraan masjid ---------- */

export const MosquePartnerSchema = z.object({
  name: nameId(3, 150),
  type: z.enum(["MASJID", "KOMUNITAS", "SEKOLAH", "YAYASAN"], { message: "Jenis lembaga tidak dikenal." }),
  city: z.string().trim().min(2, "Kota wajib diisi.").max(80),
  province: z.string().trim().max(80).optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
  picName: nameId(2, 80),
  phone: phoneId,
  reach: z.coerce.number().int().min(0, "Jangkauan tidak valid.").max(1_000_000).default(0),
  program: z.enum(["KAJIAN", "TABARRUJ", "UMRAH"], { message: "Program kemitraan tidak dikenal." }),
  notes: z.string().trim().max(500).optional().default(""),
  pdpConsent: pdpTrue,
});
export type MosquePartnerInput = z.infer<typeof MosquePartnerSchema>;
