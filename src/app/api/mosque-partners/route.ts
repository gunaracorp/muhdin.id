import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, MosquePartnerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";

/**
 * R-090 v14.1 «AKADEMI & MITRA» — Portal Kemitraan Masjid & Komunitas.
 * GET  `?code=` publik : dashboard relasi mitra (profil + aktivitas +
 *      kode relasi) tanpa login — kode MHD-MP dipakai sebagai kunci akses.
 * GET  admin           : seluruh mitra + statistik untuk CMS.
 * POST publik (rate-limit 4/menit): pendaftaran mitra baru — status PENDING
 *      hingga diverifikasi sekretariat; kode relasi terbit otomatis.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generatePartnerCode(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return `MHD-MP-${suffix}`;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  try {
    if (code) {
      const partner = await db.mosquePartner.findUnique({
        where: { code: code.trim().toUpperCase() },
        include: { activities: { orderBy: { date: "desc" }, take: 20 } },
      });
      if (!partner) return fail("Kode kemitraan tidak ditemukan. Periksa kembali MHD-MP Anda.", 404);
      return ok({
        partner: {
          code: partner.code,
          name: partner.name,
          type: partner.type,
          city: partner.city,
          province: partner.province,
          picName: partner.picName,
          phone: partner.phone,
          reach: partner.reach,
          status: partner.status,
          program: partner.program,
          notes: partner.notes,
        },
        activities: partner.activities.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          date: a.date,
          attendance: a.attendance,
        })),
      });
    }
    const denied = await guardAdmin();
    if (denied) return denied;
    // ?stats=1 → ringkasan untuk kartu CMS; tanpa parameter → array mitra.
    if (req.nextUrl.searchParams.get("stats") === "1") {
      const partners = await db.mosquePartner.findMany({
        select: { status: true, reach: true, _count: { select: { activities: true } } },
      });
      return ok({
        stats: {
          total: partners.length,
          active: partners.filter((p) => p.status === "ACTIVE").length,
          pending: partners.filter((p) => p.status === "PENDING").length,
          totalReach: partners.filter((p) => p.status === "ACTIVE").reduce((a, p) => a + p.reach, 0),
          totalActivities: partners.reduce((a, p) => a + p._count.activities, 0),
        },
      });
    }
    const partners = await db.mosquePartner.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { activities: true } } },
    });
    return ok(partners);
  } catch {
    return fail("Gagal memuat mitra masjid.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "mosque-partner", 4, 60_000)) {
    return fail("Terlalu banyak pengajuan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(MosquePartnerSchema, body);
    if (!parsed.ok) return fail(parsed.error);
    if (parsed.data.pdpConsent !== true) return fail("Persetujuan Pelindungan Data Pribadi (UU PDP) wajib dicentang.");

    let code = generatePartnerCode();
    for (let i = 0; i < 5; i++) {
      const dup = await db.mosquePartner.findUnique({ where: { code } });
      if (!dup) break;
      code = generatePartnerCode();
    }

    const partner = await db.mosquePartner.create({
      data: {
        code,
        name: parsed.data.name,
        type: parsed.data.type,
        city: parsed.data.city,
        province: parsed.data.province,
        address: parsed.data.address,
        picName: parsed.data.picName,
        phone: parsed.data.phone,
        reach: parsed.data.reach,
        program: parsed.data.program,
        notes: parsed.data.notes,
        status: "PENDING",
      },
    });

    void logAudit(req, {
      action: "CREATE",
      entity: "MosquePartner",
      entityId: partner.id,
      detail: `${partner.name} (${partner.type}, ${partner.city})`,
    });

    return ok(
      {
        partner: { code: partner.code, name: partner.name, status: partner.status },
        message: `Pendaftaran diterima — kode relasi Anda ${partner.code}. Simpan kode ini untuk memantau status & aktivitas kemitraan. Sekretariat memverifikasi maksimal 5 hari kerja.`,
      },
      201
    );
  } catch {
    return fail("Gagal mendaftarkan mitra.", 500);
  }
}
