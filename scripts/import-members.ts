/**
 * import-members.ts — Impor massal Anggota (PPIU/PIHK/KBIHU/IPHI/TRAVEL_WISATA) dari CSV.
 *
 * Pemakaian:
 *   bun scripts/import-members.ts <file.csv>              # impor sungguhan
 *   bun scripts/import-members.ts <file.csv> --dry-run    # uji coba, TIDAK mengubah database
 *
 * Kolom CSV (baris pertama; tidak peka besar-kecil; versi Inggris & Indonesia dikenali):
 *   name/nama/nama_resmi/nama_dagang (wajib), type/jenis/jenis_entitas (wajib),
 *   city/kota, province/provinsi, licenseNo/nomor_izin/nomor_izin_kemenag,
 *   phone/telepon, email, website, description/deskripsi, status,
 *   memberSince/anggota_sejak/tahun/tanggal_izin
 *   Kolom gabungan `telepon_email_web` dipilah otomatis → phone/email/website.
 *
 * Aturan:
 * • Idempoten — nama yang sudah ada DIPERBARUI (field yang terisi di CSV saja), bukan diduplikasi.
 * • type valid: PPIU | PIHK | KBIHU | IPHI | TRAVEL_WISATA (spasi otomatis jadi garis bawah).
 * • status dinormalisasi: AKTIF/REKOMENDASI→TERVERIFIKASI · PENDING/DALAM VERIFIKASI/
 *   HATI-HATI/MENUNGGU→PENDING · DIBEKUKAN/DICABUT/STOP/DIBLOKIR/…→SUSPENDED.
 *   Status tak dikenal → TERVERIFIKASI + catatan peringatan.
 * • Kolom kosong diisi otomatis: city="Nasional", province="Indonesia", licenseNo="—",
 *   memberSince = tahun 4-digit pertama yang ditemukan (fallback 2026).
 * • Parser CSV: pemisah koma/titik-koma/tab terdeteksi otomatis; dukung kutip ganda,
 *   CRLF/LF, dan BOM UTF-8.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TYPES = ["PPIU", "PIHK", "KBIHU", "IPHI", "TRAVEL_WISATA"] as const;
const STATUSES = ["TERVERIFIKASI", "PENDING", "SUSPENDED"] as const;

/** Alias header → nama field kanonik (huruf kecil semua). */
const HEADER_ALIASES: Record<string, string> = {
  name: "name", nama: "name", nama_resmi: "name", nama_dagang: "name",
  type: "type", jenis: "type", jenis_entitas: "type",
  city: "city", kota: "city",
  province: "province", provinsi: "province",
  licenseno: "licenseNo", license_no: "licenseNo", license: "licenseNo",
  nomor_izin: "licenseNo", no_izin: "licenseNo", nomor_izin_kemenag: "licenseNo",
  phone: "phone", telepon: "phone", telp: "phone", no_telepon: "phone", hp: "phone", wa: "phone",
  email: "email", surel: "email",
  website: "website", web: "website", situs: "website",
  description: "description", deskripsi: "description", keterangan: "description",
  status: "status", status_izin: "status", status_whitelist: "status",
  membersince: "memberSince", member_since: "memberSince", anggota_sejak: "memberSince",
  tahun: "memberSince", tahun_izin: "memberSince", tanggal_izin: "memberSince",
  telepon_email_web: "telepon_email_web", kontak: "telepon_email_web",
};

/** Normalisasi nilai type: "travel wisata" → TRAVEL_WISATA, dst. */
function normType(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]+/g, "_").replace(/_+/g, "_");
}

/** Normalisasi nilai status dari berbagai kosakata (Kemenag/whitelist/CMS). */
function normStatus(raw: string): { value: string; known: boolean } {
  const s = raw.trim().toUpperCase();
  if (!s) return { value: "TERVERIFIKASI", known: true };
  if (["TERVERIFIKASI", "AKTIF", "REKOMENDASI", "VERIFIED", "APPROVED"].includes(s))
    return { value: "TERVERIFIKASI", known: true };
  if (["PENDING", "DALAM VERIFIKASI", "VERIFIKASI", "MENUNGGU", "HATI-HATI", "HATI HATI", "PROSES"].includes(s))
    return { value: "PENDING", known: true };
  if (["SUSPENDED", "DIBEKUKAN", "DICABUT", "KADALUARSA", "TIDAK BERLAKU", "DITANGGUHKAN", "BLOKIR", "DIBLOKIR", "STOP", "NONAKTIF", "REJECTED", "DITOLAK"].includes(s))
    return { value: "SUSPENDED", known: true };
  return { value: "TERVERIFIKASI", known: false };
}

/** Ambil tahun 4-digit pertama dari teks apa pun ("SK PPIU Mei 2025" → 2025). */
function yearOf(raw: string): number | null {
  const m = raw.match(/(19|20)\d{2}/);
  return m ? parseInt(m[0], 10) : null;
}

/** Pilah "0812-3456-7890 / info@x.id / https://x.id" → { phone, email, website }. */
function splitContact(raw: string): { phone?: string; email?: string; website?: string } {
  const out: { phone?: string; email?: string; website?: string } = {};
  let rest = raw;
  // URL dan email diekstrak dulu lewat regex agar tidak terpecah oleh pemisah "/" atau "."
  const url = rest.match(/https?:\/\/[^\s;|,]+|www\.[^\s;|,]+/i);
  if (url) { out.website = url[0]; rest = rest.replace(url[0], " "); }
  const mail = rest.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  if (mail) { out.email = mail[0]; rest = rest.replace(mail[0], " "); }
  const phone = rest
    .split(/[;|,]+|\s{2,}|\s+\/\s+/)
    .map((p) => p.trim())
    .find((p) => p && (p.match(/\d/g) || []).length >= 4 && p.length <= 30);
  if (phone) out.phone = phone;
  return out;
}

/** Deteksi pemisah dominan pada baris header (di luar tanda kutip). */
function detectDelimiter(line: string): string {
  const count = (ch: string) => {
    let n = 0, q = false;
    for (const c of line) {
      if (c === '"') q = !q;
      else if (!q && c === ch) n++;
    }
    return n;
  };
  const candidates = [
    [";", count(";")], [",", count(",")], ["\t", count("\t")],
  ] as const;
  candidates.sort((a, b) => b[1] - a[1]);
  return candidates[0][1] > 0 ? candidates[0][0] : ",";
}

function parseCsv(text: string, delim: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!clean) return { headers: [], rows: [] };
  const lines: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); field = ""; lines.push(row); row = []; }
    else field += c;
  }
  row.push(field);
  lines.push(row);
  const headers = (lines.shift() || []).map((h) => h.trim());
  return { headers, rows: lines.filter((r) => r.some((f) => f.trim() !== "")) };
}

const cell = (row: string[], i: number) => (row[i] ?? "").trim();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Pemakaian: bun scripts/import-members.ts <file.csv> [--dry-run]");
    process.exit(1);
  }
  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch {
    console.error(`File tidak ditemukan: ${file}`);
    console.error("Tips: pastikan path benar. Contoh: bun scripts/import-members.ts db/data-kamu.csv");
    process.exit(1);
  }

  const delim = detectDelimiter(raw.split(/\r?\n/, 1)[0] || "");
  const { headers, rows } = parseCsv(raw, delim);
  if (!headers.length || !rows.length) {
    console.error("CSV kosong / tidak berisi data.");
    process.exit(1);
  }

  // Petakan indeks kolom CSV → field kanonik via alias.
  const ix: Record<string, number> = {};
  headers.forEach((h, idx) => {
    const canon = HEADER_ALIASES[h.toLowerCase().replace(/\s+/g, "_")];
    if (canon && ix[canon] === undefined) ix[canon] = idx;
  });

  if (ix.name === undefined || ix.type === undefined) {
    console.error('Kolom wajib tidak ditemukan: `name` dan `type` (boleh alias: nama/nama_resmi, jenis/jenis_entitas).');
    console.error(`Header terbaca: ${headers.join(" | ")}`);
    process.exit(1);
  }
  if (dryRun) console.log("== MODE DRY-RUN: tidak ada data yang ditulis ke database ==\n");

  let inserted = 0, updated = 0, skipped = 0;
  const errors: string[] = [];
  const warns: string[] = [];

  for (const [n, row] of rows.entries()) {
    const lineNo = n + 2;
    const name = cell(row, ix.name);
    const type = normType(cell(row, ix.type));
    if (!name || !TYPES.includes(type as (typeof TYPES)[number])) {
      skipped++;
      errors.push(`Baris ${lineNo}: name/type tidak valid ("${name}", "${cell(row, ix.type)}") — type harus salah satu dari ${TYPES.join(", ")}`);
      continue;
    }

    const { value: status, known: statusKnown } = normStatus(ix.status !== undefined ? cell(row, ix.status) : "");
    if (ix.status !== undefined && cell(row, ix.status) && !statusKnown)
      warns.push(`Baris ${lineNo}: status "${cell(row, ix.status)}" tidak dikenal → dipakai TERVERIFIKASI`);

    const sinceRaw = ix.memberSince !== undefined ? cell(row, ix.memberSince) : "";
    const memberSince = yearOf(sinceRaw) ?? 2026;

    const data: Record<string, string | number> = {};
    for (const k of ["city", "province", "licenseNo", "phone", "email", "website", "description"] as const) {
      if (ix[k] !== undefined && cell(row, ix[k]) !== "") data[k] = cell(row, ix[k]);
    }
    // Kolom gabungan telepon_email_web dipilah (hanya mengisi field yang masih kosong).
    if (ix.telepon_email_web !== undefined && cell(row, ix.telepon_email_web)) {
      const s = splitContact(cell(row, ix.telepon_email_web));
      if (s.phone && !data.phone) data.phone = s.phone;
      if (s.email && !data.email) data.email = s.email;
      if (s.website && !data.website) data.website = s.website;
    }
    // Kolom wajib skema → fallback ramah agar impor tak pernah crash.
    if (!data.licenseNo) data.licenseNo = "—";
    if (!data.city) data.city = "Nasional";
    if (!data.province) data.province = "Indonesia";

    const existing = await db.member.findFirst({ where: { name } });
    if (existing) {
      if (!dryRun) await db.member.update({ where: { id: existing.id }, data: { ...data, type, status, memberSince } });
      updated++;
    } else {
      if (!dryRun) await db.member.create({ data: { name, type, status, memberSince, ...data } });
      inserted++;
    }
  }

  console.log("=== RINGKASAN IMPOR ANGGOTA ===");
  if (dryRun) console.log("Mode     : DRY-RUN (uji coba — database TIDAK diubah)");
  console.log(`File     : ${file}`);
  console.log(`Pemisah  : ${delim === "\t" ? "TAB" : delim === ";" ? "titik-koma (;)" : "koma (,)"}`);
  console.log(`Baris    : ${rows.length}`);
  console.log(`${dryRun ? "Akan baru" : "Baru"}     : ${inserted}`);
  console.log(`${dryRun ? "Akan diperbarui" : "Diperbarui"}: ${updated}`);
  console.log(`Dilewati : ${skipped}`);
  if (warns.length) console.log("Peringatan:\n" + warns.slice(0, 10).join("\n") + (warns.length > 10 ? `\n… +${warns.length - 10} peringatan lain` : ""));
  if (errors.length) console.log("Catatan (baris dilewati):\n" + errors.slice(0, 15).join("\n") + (errors.length > 15 ? `\n… +${errors.length - 15} catatan lain` : ""));
  if (!dryRun && skipped === 0) console.log("✅ Selesai! Cek hasilnya di portal: menu Anggota (#/anggota) atau CMS → Direktori Anggota.");
  if (dryRun && skipped === 0) console.log("✅ Semua baris valid. Jalankan lagi TANPA --dry-run untuk menyimpan.");
}

main()
  .catch((e) => { console.error("Impor gagal:", e); process.exit(1); })
  .finally(() => db.$disconnect());
