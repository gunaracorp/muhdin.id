import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";
import { cached, bustCache } from "@/lib/hot-cache";

// R-068 v15.0.0 — FAQ adalah endpoint panas (dibaca berulang oleh beranda &
// halaman bantuan): respons di-cache 60 detik per kombinasi kategori+locale,
// dan cache dibuang setiap mutasi CMS agar pembaca berikutnya selalu segar.
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || "";
    const locale = localeFromRequest(req);
    const localized = await cached(`faq:list:${category}:${locale}`, 60_000, async () => {
      const faqs = await db.faq.findMany({
        where: category ? { category } : {},
        orderBy: { order: "asc" },
      });
      return applyEntityTranslations({
        entity: "Faq",
        rows: faqs,
        locale,
        keyOf: (f) => f.id,
        fields: ["question", "answer"],
      });
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat FAQ.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body.question || !body.answer) return fail("Pertanyaan dan jawaban wajib diisi.");
    const faq = await db.faq.create({
      data: {
        question: String(body.question),
        answer: String(body.answer),
        category: String(body.category || "Umum"),
        order: parseInt(body.order, 10) || 99,
      },
    });
    bustCache("faq:");
    return ok(faq, 201);
  } catch {
    return fail("Gagal membuat FAQ.", 500);
  }
}
