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

const cell = (row: string[], i: number) => (row[i] ?? "").trim();

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
    } else {
      return fail("Tipe impor tidak dikenal. Pilihan: subscribers, articles, applications, messages.");
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
