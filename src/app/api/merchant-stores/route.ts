/**
 * R-046 v15.0.0 «GOD MODE» — Onboarding Merchant Marketplace (Lapak Mitra).
 * GET  : publik — daftar lapak ACTIVE + produk aktif (cache 60 dtk).
 * POST : pengajuan buka lapak (Zod + rate-limit + audit) → status PENDING,
 *        diverifikasi panitia di CMS sebelum ACTIVE.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, slugify } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, MerchantStoreSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { cached, bustCache } from "@/lib/hot-cache";

export async function GET(req: NextRequest) {
  try {
    // ?all=1 untuk CMS — seluruh status (PENDING/ACTIVE/SUSPENDED) bila sesi admin sah.
    const all = req.nextUrl.searchParams.get("all") === "1";
    if (all) {
      const { requireAdmin } = await import("@/lib/auth");
      const admin = await requireAdmin();
      if (admin) {
        const rows = await db.merchantStore.findMany({
          orderBy: { createdAt: "desc" },
          include: { products: { orderBy: { price: "asc" } } },
        });
        return ok({ total: rows.length, stores: rows });
      }
    }
    const stores = await cached("lapak:list", 60_000, async () =>
      db.merchantStore.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: { products: { where: { active: true }, orderBy: { price: "asc" } } },
      }),
    );
    return ok({
      total: stores.length,
      stores: stores.map((s) => ({
        id: s.id,
        slug: s.slug,
        storeName: s.storeName,
        ownerName: s.ownerName,
        city: s.city,
        category: s.category,
        products: s.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          desc: p.desc,
        })),
      })),
    });
  } catch {
    return fail("Gagal memuat lapak mitra.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "lapak-daftar", 4, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(MerchantStoreSchema, body);
    if (!parsed.ok) return fail(parsed.error);

    // Slug unik dari nama toko + penanda pendek bila bentrok.
    let slug = slugify(parsed.data.storeName);
    const clash = await db.merchantStore.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const store = await db.merchantStore.create({
      data: {
        slug,
        storeName: parsed.data.storeName,
        ownerName: parsed.data.ownerName,
        phone: parsed.data.phone,
        city: parsed.data.city,
        category: parsed.data.category,
        nib: parsed.data.nib || null,
        note: parsed.data.note || null,
        status: "PENDING",
      },
    });
    bustCache("lapak:");
    void logAudit(req, {
      action: "CREATE",
      entity: "MerchantStore",
      entityId: store.id,
      detail: `pengajuan lapak "${store.storeName}" (${store.city})`,
    });
    return ok(
      {
        id: store.id,
        slug: store.slug,
        message:
          "Pengajuan lapak terkirim. Tim MUHDIN memverifikasi izin usaha Anda — lapak tampil setelah disetujui.",
      },
      201,
    );
  } catch {
    return fail("Gagal mengirim pengajuan lapak.", 500);
  }
}
