/**
 * Task 19 (R-059) — Impor CSV massal untuk modul CMS.
 *
 * POST /api/import  { type: "subscribers"|"applications"|"articles"|"messages", csv: string }
 * • guardRole SUPER_ADMIN/ADMIN + rate-limit 5/menit + logAudit.
 * • Parser CSV mandiri: dukung tanda kutip ganda, koma di dalam kutip,
 *   CRLF/LF, dan BOM UTF-8 (hasil ekspor Excel).
 * • Header kolom memakai nama field mesin (contoh: email,name,city).
 *   Baris tanpa kolom kunci dilewati dengan alasan — dilaporkan per baris.
 * • Strategi: upsert untuk subscribers (email) & articles (slug);
 *   create-only untuk applications & messages (data masuk bersifat append).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, slugify } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";
import type { Prisma } from "@prisma/client";

/** Parser CSV minimal namun benar: kutip ganda, koma terkutip, "" escape. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
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
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === "," || c === ";" || c === "\t") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      lines.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  lines.push(row);
  const headers = (lines.shift() || []).map((h) => h.trim());
  return { headers, rows: lines.filter((r) => r.some((f) => f.trim() !== "")) };
}

const cell = (row: string[], i: number) => {
  const v = (row[i] ?? "").trim();
  // v12.6 — placeholder kosong umum ("-", "N/A", dsb.) diperlakukan sebagai kosong
  // agar tidak jadi nilai sungguhan (mis. NIB "-" yang menyatu-kan banyak baris).
  return /^(-|--|–|—|n\/a|na|null|nil|kosong|tidak ada)$/i.test(v) ? "" : v;
};

/** ====== v12.6 — Impor pintar: alias kolom Bahasa Indonesia (sheet Master) ====== */

/** Normalisasi nama kolom: huruf kecil, hanya huruf & angka (spasi/titik/underscore dihapus). */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Peta field mesin → alias nama kolom. Urutan alias = prioritas bila beberapa kolom cocok. */
const ALIAS_MEMBERS: Record<string, string[]> = {
  name: ["name", "nama", "namaorganisasi", "namaresmi", "namaperusahaan", "namapt", "organisasi", "orgname", "namadagang"],
  type: ["type", "tipe", "jenis", "jenisentitas", "jenismitra", "kategori", "kategorimitra"],
  city: ["city", "kota", "kotakabupaten", "kotakab"],
  province: ["province", "provinsi", "prov"],
  licenseNo: ["licenseno", "license", "noizin", "nomorizin", "noizinkemenag", "nomorizinkemenag"],
  phone: ["phone", "telepon", "telp", "telpon", "nohp", "hp", "whatsapp", "wa"],
  email: ["email", "surel"],
  website: ["website", "web", "situs", "situsweb", "url"],
  description: ["description", "deskripsi", "deskripsisingkat", "keterangan", "profil"],
  status: ["status", "statusanggota", "statuskeanggotaan", "statusizin", "statusverifikasi"],
  memberSince: ["membersince", "anggotasejak", "anggotasejaktahun", "tahunmasuk", "tahunbergabung"],
  rating: ["rating", "penilaian", "skor", "nilairating"],
};

const ALIAS_REGISTRY: Record<string, string[]> = {
  name: ["name", "nama", "namaresmi", "namaorganisasi", "namaperusahaan", "namapt"],
  legalEntity: ["legalentity", "badanhukum", "bentukbadanhukum", "bentukusaha", "bentuk"],
  city: ["city", "kota", "kotakabupaten", "kotakab"],
  province: ["province", "provinsi", "prov"],
  phone: ["phone", "telepon", "telp", "telpon", "nohp", "hp"],
  email: ["email", "surel"],
  website: ["website", "web", "situs", "situsweb", "url"],
  note: ["note", "catatan", "catatanrisiko", "sumberverifikasi"],
  jenisEntitas: ["jenis", "jenisentitas", "tipe", "kategori"],
  nomorIzin: ["nomorizin", "nomorizinkemenag", "noizin", "noizinkemenag", "licenseno"],
  masaBerlaku: ["masaberlakuizin", "masaberlaku", "berlakusampai", "berlakuhingga", "masaberlakusampai"],
  akta: ["nomorbadanhukum", "nomorakta", "akta", "skbadanhukum"],
  npwp: ["npwp", "nomornpwp", "npwp16"],
  akreditasi: ["akreditasi", "nomorakreditasi"],
  akreditasiSampai: ["akreditasisampai", "masaberlakuakreditasi", "akreditasiberlaku"],
};

/** Kolom gabungan kontak di sheet Master (telepon_email_web) — dipecah otomatis. */
const TRIPLET_HEADERS = ["teleponemailweb", "teleponemailwebsite", "kontaklengkap"];

/** Pecah "0812…, info@pt.id, https://pt.id" → komponen telepon / email / website. */
export function parseTriplet(v: string): { phone?: string; email?: string; website?: string } {
  const out: { phone?: string; email?: string; website?: string } = {};
  let rest = v;
  const emailM = rest.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  if (emailM) { out.email = emailM[0]; rest = rest.replace(emailM[0], " "); }
  const webM = rest.match(/(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}(?:\/[^\s,;]*)?/i);
  if (webM) { out.website = webM[0]; rest = rest.replace(webM[0], " "); }
  const phoneM = rest.match(/(?:\+?62|0)\d[\d\s\-().]{6,}/);
  if (phoneM) out.phone = phoneM[0].trim();
  return out;
}

/** Samakan penulisan jenis penyelenggara → nilai mesin (PPIU/PIHK/KBIHU/IPHI/TRAVEL_WISATA). */
export function normType(v: string): string | null {
  const t = v.toUpperCase().replace(/[^A-Z ]/g, " ");
  if (/PIHK|HAJI\s*KHUSUS/.test(t)) return "PIHK";
  if (/PPIU|UMRAH|UMROH|IBADAH\s*UMUM/.test(t)) return "PPIU";
  if (/KBIHU|BIRO/.test(t)) return "KBIHU";
  if (/IPHI/.test(t)) return "IPHI";
  if (/TRAVEL|WISATA/.test(t)) return "TRAVEL_WISATA";
  return null;
}

/** Terjemahkan status bebas (Aktif, Dalam Verifikasi, Dicabut…) → status mesin. */
export function normStatus(v: string): string {
  const s = v.toLowerCase().trim();
  if (/suspensi|suspend|tangguh|non\s*aktif|nonaktif|dicabut|beku|blacklist|bermasalah|dihentikan/.test(s)) return "SUSPENDED";
  if (/terverifikasi|verified|aktif|active|disetujui|approved|lolos/.test(s)) return "TERVERIFIKASI";
  if (/pending|verifikasi|menunggu|proses|tinjau|review/.test(s)) return "PENDING";
  return "TERVERIFIKASI";
}

/** Parse tanggal fleksibel: 2027-01-31, 31/01/2027, 31-01-27, atau nomor seri Excel. */
export function parseDateId(v: string): Date | null {
  const s = v.trim();
  if (!s) return null;
  if (/^\d{5}$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86_400_000);
    return isNaN(d.getTime()) ? null : d;
  }
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    const y = Number(dmy[3]) < 100 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    const d = new Date(y, Number(dmy[2]) - 1, Number(dmy[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Bangun indeks header ternormalisasi → posisi kolom. */
function headerIndex(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((h, i) => { const k = norm(h); if (k && !map.has(k)) map.set(k, i); });
  return map;
}

// Task 18 — kode tiket pelacakan MHD-XXXXXX (charset tanpa I/O dan 0/1 agar tak salah baca).
const TICKET_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Kode tiket unik untuk pendaftaran hasil impor (default kolom "" hanya muat 1 baris unik). */
function newTicketCode(): string {
  let code = "MHD-";
  for (let i = 0; i < 6; i++) code += TICKET_CHARS[Math.floor(Math.random() * TICKET_CHARS.length)];
  return code;
}

/** Ambil nilai kolom pertama yang cocok dengan salah satu alias dan tidak kosong. */
function pickCell(row: string[], map: Map<string, number>, aliases: string[]): string {
  for (const a of aliases) {
    const i = map.get(a);
    if (i !== undefined && cell(row, i)) return cell(row, i);
  }
  return "";
}

/** Cari kolom gabungan telepon/email/web bila ada. */
function tripletCol(map: Map<string, number>): number {
  for (const t of TRIPLET_HEADERS) {
    const i = map.get(t);
    if (i !== undefined) return i;
  }
  return -1;
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  if (!rateLimit(req, "import-csv")) {
    return fail("Terlalu banyak impor. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    const type = String(body?.type || "");
    const csv = String(body?.csv || "");
    if (!csv.trim()) return fail("CSV kosong.");

    const { headers, rows } = parseCsv(csv);
    if (!headers.length || !rows.length) return fail("CSV tidak berisi data.");

    const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    if (type === "subscribers") {
      const iEmail = idx("email");
      if (iEmail < 0) return fail("Kolom `email` wajib ada.");
      for (const [n, row] of rows.entries()) {
        const email = cell(row, iEmail).toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          errors.push(`Baris ${n + 2}: email tidak valid "${email}"`);
          continue;
        }
        const found = await db.subscriber.findUnique({ where: { email } });
        if (found) updated++; // sudah terdaftar — idempoten
        else {
          await db.subscriber.create({ data: { email } });
          inserted++;
        }
      }
    } else if (type === "articles") {
      const iTitle = idx("title");
      if (iTitle < 0) return fail("Kolom `title` wajib ada.");
      const iSlug = idx("slug");
      const iExcerpt = idx("excerpt");
      const iContent = idx("content");
      const iCategory = idx("category");
      const iCover = idx("cover");
      const iStatus = idx("status");
      const iAuthor = idx("author");
      const iMetaTitle = idx("metaTitle");
      const iMetaDesc = idx("metaDescription");
      const iKeywords = idx("keywords");
      for (const [n, row] of rows.entries()) {
        const title = cell(row, iTitle);
        if (!title) {
          errors.push(`Baris ${n + 2}: title kosong`);
          continue;
        }
        const slug = slugify(cell(row, iSlug) || title) || `impor-${Date.now().toString(36)}-${n}`;
        const data = {
          title,
          excerpt: iExcerpt >= 0 ? cell(row, iExcerpt) || title.slice(0, 140) : title.slice(0, 140),
          content: iContent >= 0 ? cell(row, iContent) : "",
          category: iCategory >= 0 ? cell(row, iCategory) || "Berita" : "Berita",
          cover: iCover >= 0 && cell(row, iCover) ? cell(row, iCover) : null,
          status: iStatus >= 0 && ["PUBLISHED", "DRAFT"].includes(cell(row, iStatus)) ? cell(row, iStatus) : "PUBLISHED",
          author: iAuthor >= 0 && cell(row, iAuthor) ? cell(row, iAuthor) : "Tim MUHDIN",
          metaTitle: iMetaTitle >= 0 && cell(row, iMetaTitle) ? cell(row, iMetaTitle) : null,
          metaDescription: iMetaDesc >= 0 && cell(row, iMetaDesc) ? cell(row, iMetaDesc) : null,
          keywords: iKeywords >= 0 && cell(row, iKeywords) ? cell(row, iKeywords) : null,
        };
        const found = await db.article.findUnique({ where: { slug } });
        if (found) {
          await db.article.update({ where: { slug }, data });
          updated++;
        } else {
          await db.article.create({ data: { ...data, slug } });
          inserted++;
        }
      }
    } else if (type === "applications") {
      const reqCols = ["orgName", "type", "contactName", "email", "phone", "city"];
      const ix: Record<string, number> = {};
      for (const c of reqCols.concat(["province", "licenseNo", "message"])) ix[c] = idx(c);
      for (const c of reqCols) {
        if (ix[c] < 0) return fail(`Kolom \`${c}\` wajib ada untuk pendaftaran.`);
      }
      for (const [n, row] of rows.entries()) {
        const email = cell(row, ix.email);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          errors.push(`Baris ${n + 2}: email tidak valid`);
          continue;
        }
        await db.membershipApplication.create({
          data: {
            orgName: cell(row, ix.orgName),
            type: ["PPIU", "PIHK", "KBIHU", "IPHI", "TRAVEL_WISATA"].includes(cell(row, ix.type))
              ? cell(row, ix.type)
              : "TRAVEL_WISATA",
            contactName: cell(row, ix.contactName),
            email,
            phone: cell(row, ix.phone),
            city: cell(row, ix.city),
            province: ix.province >= 0 ? cell(row, ix.province) : "",
            licenseNo: ix.licenseNo >= 0 ? cell(row, ix.licenseNo) : "",
            message: ix.message >= 0 && cell(row, ix.message) ? cell(row, ix.message) : null,
            ticketCode: newTicketCode(), // v12.6 — tiket unik per baris (sebelumnya "" unik → baris ke-2 selalu gagal)
            pdpConsent: true, // impor oleh admin atas dasar perjanjian data mitra
            pdpConsentAt: new Date(),
          },
        });
        inserted++;
      }
    } else if (type === "messages") {
      const iName = idx("name");
      const iEmail = idx("email");
      const iPhone = idx("phone");
      const iSubject = idx("subject");
      const iMessage = idx("message");
      if (iName < 0 || iMessage < 0) return fail("Kolom `name` dan `message` wajib ada.");
      for (const [n, row] of rows.entries()) {
        await db.contactMessage.create({
          data: {
            name: cell(row, iName) || "Tanpa Nama",
            email: iEmail >= 0 && cell(row, iEmail) ? cell(row, iEmail) : "tanpa-email@impor.local",
            phone: iPhone >= 0 && cell(row, iPhone) ? cell(row, iPhone) : null,
            subject: iSubject >= 0 && cell(row, iSubject) ? cell(row, iSubject) : "Impor Massal",
            message: cell(row, iMessage),
          },
        });
        inserted++;
      }
    } else if (type === "members") {
      // v12.6 — Impor Direktori Anggota (PPIU/PIHK/…) dengan alias kolom sheet Master.
      const map = headerIndex(headers);
      const hasCols = (aliases: string[]) => aliases.some((a) => map.has(a));
      const triIdx = tripletCol(map);
      const hasStatus = hasCols(ALIAS_MEMBERS.status);
      const hasSince = hasCols(ALIAS_MEMBERS.memberSince);
      const hasRating = hasCols(ALIAS_MEMBERS.rating);
      for (const [n, row] of rows.entries()) {
        const name = pickCell(row, map, ALIAS_MEMBERS.name);
        const rawType = pickCell(row, map, ALIAS_MEMBERS.type);
        const city = pickCell(row, map, ALIAS_MEMBERS.city);
        const licenseNo = pickCell(row, map, ALIAS_MEMBERS.licenseNo);
        if (!name || !rawType || !city || !licenseNo) {
          errors.push(`Baris ${n + 2}: kolom wajib kosong — butuh nama, jenis, kota, dan nomor izin`);
          continue;
        }
        const mtype = normType(rawType);
        if (!mtype) {
          errors.push(`Baris ${n + 2}: jenis "${rawType}" tidak dikenal (gunakan PPIU/PIHK/KBIHU/IPHI/Travel Wisata)`);
          continue;
        }
        let phone = pickCell(row, map, ALIAS_MEMBERS.phone);
        let email = pickCell(row, map, ALIAS_MEMBERS.email);
        let website = pickCell(row, map, ALIAS_MEMBERS.website);
        if (triIdx >= 0) {
          const tri = parseTriplet(cell(row, triIdx));
          phone = phone || tri.phone || "";
          email = email || tri.email || "";
          website = website || tri.website || "";
        }
        let description = pickCell(row, map, ALIAS_MEMBERS.description);
        if (!description) {
          const alamat = pickCell(row, map, ["alamat", "alamatpusat", "alamatkantor"]);
          const wilayah = pickCell(row, map, ["wilayahlayanan", "wilayah"]);
          description = [alamat ? `Alamat: ${alamat}` : "", wilayah ? `Wilayah layanan: ${wilayah}` : ""]
            .filter(Boolean)
            .join(" · ");
        }
        const data: Prisma.MemberUncheckedCreateInput = {
          name,
          type: mtype,
          city,
          licenseNo,
          province: pickCell(row, map, ALIAS_MEMBERS.province),
          phone: phone || null,
          email: email || null,
          website: website || null,
          description: description || null,
        };
        if (hasStatus) data.status = normStatus(pickCell(row, map, ALIAS_MEMBERS.status));
        if (hasSince) {
          const y = Number((pickCell(row, map, ALIAS_MEMBERS.memberSince).match(/\d{4}/) || [])[0]);
          data.memberSince = y >= 1990 && y <= 2100 ? y : new Date().getFullYear();
        }
        if (hasRating) {
          const r = Number(pickCell(row, map, ALIAS_MEMBERS.rating).replace(",", "."));
          data.rating = Number.isFinite(r) && r > 0 ? Math.min(5, r) : 4.5;
        }
        const found = await db.member.findFirst({ where: { licenseNo } });
        if (found) {
          await db.member.update({ where: { id: found.id }, data });
          updated++;
        } else {
          if (!hasStatus) data.status = "TERVERIFIKASI";
          if (!hasSince) data.memberSince = new Date().getFullYear();
          if (!hasRating) data.rating = 4.5;
          await db.member.create({ data });
          inserted++;
        }
      }
    } else if (type === "registry") {
      // v12.6 — Impor Registri Izin (RegistryCompany + dokumen izin per NIB).
      const map = headerIndex(headers);
      const iNib = map.get("nib") ?? map.get("nomorindukberusaha") ?? -1;
      if (iNib < 0) return fail("Kolom `nib` (NIB / Nomor Induk Berusaha) wajib ada untuk impor registri.");
      const triIdx = tripletCol(map);
      for (const [n, row] of rows.entries()) {
        const nib = cell(row, iNib);
        const name = pickCell(row, map, ALIAS_REGISTRY.name);
        if (!nib || !name) {
          errors.push(`Baris ${n + 2}: NIB atau nama perusahaan kosong`);
          continue;
        }
        const lu = pickCell(row, map, ALIAS_REGISTRY.legalEntity).toUpperCase();
        const legalEntity = /KOPERASI|KUD/.test(lu) ? "KOPERASI" : /YAYASAN|YYS/.test(lu) ? "YAYASAN" : /\bCV\b/.test(lu) ? "CV" : /\bUD\b/.test(lu) ? "UD" : "PT";
        let phone = pickCell(row, map, ALIAS_REGISTRY.phone);
        let email = pickCell(row, map, ALIAS_REGISTRY.email);
        let website = pickCell(row, map, ALIAS_REGISTRY.website);
        if (triIdx >= 0) {
          const tri = parseTriplet(cell(row, triIdx));
          phone = phone || tri.phone || "";
          email = email || tri.email || "";
          website = website || tri.website || "";
        }
        let note = pickCell(row, map, ALIAS_REGISTRY.note);
        const rawStatus = pickCell(row, map, ["statusizin", "status"]);
        if (rawStatus && !/aktif/i.test(rawStatus)) {
          note = note ? `${note} · Status izin: ${rawStatus}` : `Status izin: ${rawStatus}`;
        }
        const cdata: Prisma.RegistryCompanyUncheckedCreateInput = {
          name,
          legalEntity,
          city: pickCell(row, map, ALIAS_REGISTRY.city),
          province: pickCell(row, map, ALIAS_REGISTRY.province),
          phone: phone || "",
          website: website || null,
          note: note || null,
        };
        const existing = await db.registryCompany.findUnique({ where: { nib } });
        const company = existing
          ? await db.registryCompany.update({ where: { id: existing.id }, data: cdata })
          : await db.registryCompany.create({ data: { nib, ...cdata } });
        if (existing) updated++; else inserted++;
        const jenis = normType(pickCell(row, map, ALIAS_REGISTRY.jenisEntitas));
        const docs: Array<{ requirementKey: string; docNo: string; validUntil: Date | null }> = [
          { requirementKey: "NIB", docNo: nib, validUntil: null },
        ];
        const akta = pickCell(row, map, ALIAS_REGISTRY.akta);
        if (akta) docs.push({ requirementKey: "AKTA", docNo: akta, validUntil: null });
        const npwp = pickCell(row, map, ALIAS_REGISTRY.npwp);
        if (npwp) docs.push({ requirementKey: "NPWP", docNo: npwp, validUntil: null });
        const izinNo = pickCell(row, map, ALIAS_REGISTRY.nomorIzin);
        if (izinNo) {
          docs.push({
            requirementKey: jenis === "PIHK" ? "PIHK" : "PPIU",
            docNo: izinNo,
            validUntil: parseDateId(pickCell(row, map, ALIAS_REGISTRY.masaBerlaku)),
          });
        }
        const akred = pickCell(row, map, ALIAS_REGISTRY.akreditasi);
        if (akred && jenis !== "PIHK") {
          docs.push({
            requirementKey: "PPIU_AKREDITASI",
            docNo: akred,
            validUntil: parseDateId(pickCell(row, map, ALIAS_REGISTRY.akreditasiSampai)),
          });
        }
        for (const d of docs) {
          const ex = await db.registryDoc.findFirst({ where: { companyId: company.id, requirementKey: d.requirementKey } });
          if (ex) {
            await db.registryDoc.update({ where: { id: ex.id }, data: { docNo: d.docNo, validUntil: d.validUntil } });
          } else {
            await db.registryDoc.create({
              data: { companyId: company.id, requirementKey: d.requirementKey, docNo: d.docNo, validUntil: d.validUntil },
            });
          }
        }
      }
    } else {
      return fail("Tipe impor tidak dikenal. Pilihan: subscribers, articles, applications, messages, members, registry.");
    }

    void logAudit(req, {
      action: "IMPORT",
      entity: type,
      detail: `impor CSV: ${inserted} baru, ${updated} diperbarui, ${errors.length} gagal`,
    });

    return ok({ type, total: rows.length, inserted, updated, skipped: errors.length, errors: errors.slice(0, 20) });
  } catch {
    return fail("Gagal memproses impor CSV.", 500);
  }
}
