import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, GroupOrderSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { computePackagePrice } from "@/lib/pricing-server";

/**
 * R-045 v14.1 «AKADEMI & MITRA» — Pendaftaran Rombongan B2B.
 * POST publik (rate-limit 4/menit): koordinator mengirim daftar anggota
 * (satu nama per baris, 10–200 jamaah) → harga final per jamaah dihitung
 * server-side (harga musiman & early bird ikut berlaku) → SATU tagihan
 * GroupOrder dengan kode MHD-B2B-XXXX tanpa karakter membingungkan.
 * GET `?code=` publik: pantau status rombongan tanpa login.
 * GET admin: seluruh group order untuk CMS.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa I/O/0/1
function generateGroupCode(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `MHD-B2B-${suffix}`;
}

/** Bersihkan teks anggota massal: satu nama per baris → array nama valid. */
function parseMembers(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of text.split(/[\n,;]+/)) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  try {
    if (code) {
      const order = await db.groupOrder.findUnique({
        where: { code: code.trim().toUpperCase() },
      });
      if (!order) return fail("Rombongan tidak ditemukan. Periksa kode MHD-B2B Anda.", 404);
      return ok({
        order: {
          code: order.code,
          groupName: order.groupName,
          coordinatorName: order.coordinatorName,
          packageTitle: order.packageTitle,
          departureDate: order.departureDate,
          memberCount: order.memberCount,
          unitPrice: order.unitPrice,
          totalAmount: order.totalAmount,
          status: order.status,
          notes: order.notes,
          createdAt: order.createdAt,
        },
      });
    }
    const denied = await guardAdmin();
    if (denied) return denied;
    const orders = await db.groupOrder.findMany({ orderBy: { createdAt: "desc" } });
    return ok(orders);
  } catch {
    return fail("Gagal memuat rombongan.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "group-order", 4, 60_000)) {
    return fail("Terlalu banyak pengajuan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(GroupOrderSchema, body);
    if (!parsed.ok) return fail(parsed.error);
    if (parsed.data.pdpConsent !== true) return fail("Persetujuan Pelindungan Data Pribadi (UU PDP) wajib dicentang.");

    const pkg = await db.tourPackage.findUnique({
      where: { id: parsed.data.packageId },
      include: { member: { select: { name: true } } },
    });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);
    if (pkg.status !== "PUBLISHED") return fail("Paket ini sudah tidak menerima pendaftaran.");

    const memberNames = parseMembers(parsed.data.membersText);
    if (memberNames.length < 10) {
      return fail(`Rombongan B2B minimal 10 jamaah (terbaca ${memberNames.length}). Untuk kurang dari 10 orang gunakan checkout biasa.`);
    }
    if (memberNames.length > 200) {
      return fail("Maksimal 200 anggota per pengajuan — pisahkan rombongan besar menjadi beberapa pengajuan.");
    }
    if (pkg.slotsTaken + memberNames.length > pkg.slots) {
      return fail(`Sisa slot hanya ${pkg.slots - pkg.slotsTaken}. Kurangi anggota atau hubungi panitia.`);
    }

    // Harga final per jamaah SELALU dihitung server-side (musiman/early bird).
    const quote = await computePackagePrice(pkg.id, pkg.departureDate);
    const unitPrice = quote.finalPrice;
    const totalAmount = unitPrice * memberNames.length;

    let code = generateGroupCode();
    // pastikan unik (tabrakan sangat kecil, tetap dilindungi)
    for (let i = 0; i < 5; i++) {
      const dup = await db.groupOrder.findUnique({ where: { code } });
      if (!dup) break;
      code = generateGroupCode();
    }

    const order = await db.groupOrder.create({
      data: {
        code,
        groupName: parsed.data.groupName,
        coordinatorName: parsed.data.coordinatorName,
        coordinatorPhone: parsed.data.coordinatorPhone,
        packageTitle: pkg.title,
        departureDate: pkg.departureDate,
        memberNames: JSON.stringify(memberNames),
        memberCount: memberNames.length,
        unitPrice,
        totalAmount,
        notes: parsed.data.notes,
        status: "PENDING",
      },
    });

    void logAudit(req, {
      action: "CREATE",
      entity: "GroupOrder",
      entityId: order.id,
      detail: `${order.groupName} ×${memberNames.length} @ ${unitPrice.toLocaleString("id-ID")} = ${totalAmount.toLocaleString("id-ID")}`,
    });

    return ok(
      {
        order: {
          code: order.code,
          groupName: order.groupName,
          packageTitle: order.packageTitle,
          departureDate: order.departureDate,
          memberCount: order.memberCount,
          unitPrice,
          totalAmount,
          status: order.status,
        },
        message: `Pengajuan rombongan ${order.code} diterima — satu tagihan untuk ${memberNames.length} jamaah. Sekretariat menghubungi koordinator untuk konfirmasi & pembayaran.`,
      },
      201
    );
  } catch {
    return fail("Gagal mengajukan rombongan.", 500);
  }
}
