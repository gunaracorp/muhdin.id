import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, computeLifecycle } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { decryptField, encryptField } from "@/lib/vault-crypto";
import { safeBody, JamaahDocSchema } from "@/lib/validation";

/**
 * v6.0 — Brankas Dokumen Jamaah (proses): paspor/visa/vaksin/tiket/asuransi
 * menempel pada kartu jamaah. Peringatan kedaluwarsa otomatis (EXPIRING ≤90 hari).
 * v13.3 R-076 — docNo/fileUrl/note dienkripsi AES-256-GCM at-rest (vault-crypto):
 * ditulis terenkripsi, didekripsi transparan saat dibaca; pencarian admin
 * menyaring pada plaintext hasil dekripsi (bukan ciphertext).
 * GET  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: semua dokumen (?cardNo= filter).
 * GET  publik ?cardNo=XXX: ringkasan dokumen milik kartu (tanpa docNo/fileUrl) — mode brankas jamaah.
 * POST publik (rateLimit 6/menit/IP): ajukan dokumen baru → PENDING; kartu harus ACTIVE.
 */

const KINDS = ["PASPOR", "VISA", "VAKSIN", "TIKET", "ASURANSI", "LAINNYA"];

function withLifecycle<T extends { expiryDate: Date | string | null }>(doc: T) {
  const { lifecycle, daysLeft } = computeLifecycle(doc.expiryDate);
  return { ...doc, lifecycle, daysLeft };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const cardNo = sp.get("cardNo")?.trim();

    // Mode publik: ringkasan brankas untuk pemilik kartu.
    if (sp.get("mode") === "public") {
      if (!cardNo) return fail("Nomor kartu wajib diisi.");
      const card = await db.pilgrimCard.findUnique({
        where: { cardNo },
        select: { id: true, cardNo: true, fullName: true, groupName: true, status: true },
      });
      if (!card) return fail("Kartu tidak ditemukan. Periksa kembali nomor kartu Anda.", 404);

      const docs = await db.jamaahDoc.findMany({
        where: { pilgrimCardId: card.id },
        orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
      });
      // Ringkasan aman: tanpa docNo penuh & fileUrl. docNo didekripsi dulu (R-076) lalu disamarkan.
      const safe = docs.map((d) => {
        const { lifecycle, daysLeft } = computeLifecycle(d.expiryDate);
        const plainNo = decryptField(d.docNo) ?? "";
        const masked = plainNo ? `${plainNo.slice(0, 3)}••••${plainNo.slice(-2)}` : "";
        return {
          id: d.id,
          kind: d.kind,
          docNoMasked: masked,
          issueDate: d.issueDate,
          expiryDate: d.expiryDate,
          verifyStatus: d.verifyStatus,
          note: decryptField(d.note),
          lifecycle,
          daysLeft,
        };
      });
      return ok({ card, docs: safe });
    }

    const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
    if (denied) return denied;

    const where: Record<string, unknown> = {};
    if (cardNo) where.card = { is: { cardNo: cardNo } };
    const q = sp.get("q")?.trim();
    if (q) {
      // R-076: docNo terenkripsi — nama dicari via DB, nomor dokumen disaring
      // pada plaintext hasil dekripsi setelah fetch (di bawah).
      where.card = { is: { cardNo: cardNo, fullName: { contains: q } } };
    }

    const rows = await db.jamaahDoc.findMany({
      where,
      include: { card: { select: { id: true, cardNo: true, fullName: true, groupName: true, status: true } } },
      orderBy: [{ verifyStatus: "asc" }, { createdAt: "desc" }],
    });
    // R-076: docNo tersimpan terenkripsi — dekripsi untuk tampilan, dan bila ada
    // kata kunci, saring juga pada nomor dokumen (plaintext) di sisi aplikasi.
    const decrypted = rows.map((r) => ({ ...r, docNo: decryptField(r.docNo), note: decryptField(r.note) }));
    const filtered = q ? decrypted.filter((r) => (r.docNo ?? "").toLowerCase().includes(q.toLowerCase())) : decrypted;
    return ok(filtered.map(withLifecycle));
  } catch {
    return fail("Gagal memuat brankas dokumen.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(req, "jamaah-docs", 6, 60_000)) {
      return fail("Terlalu banyak pengajuan. Coba lagi beberapa menit lagi.", 429);
    }
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(JamaahDocSchema, body); // R-081
    if (!parsed.ok) return fail(parsed.error);

    const cardNo = parsed.data.cardNo;
    const card = await db.pilgrimCard.findUnique({ where: { cardNo } });
    if (!card) return fail("Kartu jamaah tidak ditemukan. Periksa nomor kartu Anda.", 404);
    if (card.status !== "ACTIVE") return fail("Kartu tidak aktif — hubungi panitia MUHDIN.", 403);

    const kind = parsed.data.kind;
    const issueDate = parsed.data.issueDate ? new Date(parsed.data.issueDate) : null;
    const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;
    if (issueDate && Number.isNaN(issueDate.getTime())) return fail("Tanggal terbit tidak valid.");
    if (expiryDate && Number.isNaN(expiryDate.getTime())) return fail("Tanggal kedaluwarsa tidak valid.");

    const doc = await db.jamaahDoc.create({
      data: {
        pilgrimCardId: card.id,
        kind,
        docNo: encryptField(parsed.data.docNo) ?? "",
        issueDate,
        expiryDate,
        fileUrl: parsed.data.fileUrl ? encryptField(parsed.data.fileUrl) : null,
        note: parsed.data.note ? encryptField(parsed.data.note) : null,
        verifyStatus: "PENDING",
      },
    });

    void logAudit(req, { action: "CREATE", entity: "JamaahDoc", entityId: doc.id, detail: `${cardNo} — ${kind} (diajukan pemilik, docNo dienkripsi AES-256-GCM)` });
    // Balas dengan plaintext (milik pengirim sendiri) agar UI menampilkan apa yang baru diajukan.
    const plain = { ...doc, docNo: decryptField(doc.docNo), fileUrl: decryptField(doc.fileUrl), note: decryptField(doc.note) };
    return ok(withLifecycle({ ...plain, expiryDate: plain.expiryDate }), 201);
  } catch {
    return fail("Gagal mengajukan dokumen.", 500);
  }
}
