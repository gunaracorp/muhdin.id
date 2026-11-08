/**
 * Task 19 (R-057) — Landing page SEO paket umroh/haji.
 *
 * Server-rendered dengan metadata + JSON-LD Product (Offer harga IDR) + ringkasan
 * paket (hotel, maskapai, durasi, slot) + CTA masuk portal (#/paket/[id]).
 * Mode export shared-hosting: folder src/app/paket dibuang oleh build script.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SITE_URL, BRAND } from "@/lib/constants";
import { rupiah } from "@/lib/payment";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getPackage(slug: string) {
  try {
    return await db.tourPackage.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { member: { select: { name: true, city: true, licenseNo: true, type: true } } },
    });
  } catch {
    return null;
  }
}

const TYPE_LABEL: Record<string, string> = { UMROH: "Umroh", HAJI: "Haji", ZIARAH: "Ziarah", WISATA_ISLAMI: "Wisata Islami" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPackage(slug);
  if (!p) return { title: "Paket tidak ditemukan" };
  const title = `${p.title} — ${TYPE_LABEL[p.type] || "Paket"} ${p.durationDays} Hari`;
  const description = p.metaDescription || p.description.slice(0, 155);
  const base = SITE_URL.replace(/\/+$/, "");
  return {
    title,
    description,
    alternates: { canonical: `${base}/paket/${p.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${base}/paket/${p.slug}`,
      images: [{ url: p.image || `/api/og?title=${encodeURIComponent(p.title)}&sub=${encodeURIComponent(`Rp ${rupiah(p.price)} · ${p.durationDays} hari`)}&kind=Paket` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [p.image || `/api/og?title=${encodeURIComponent(p.title)}&kind=Paket`],
    },
  };
}

export default async function PaketLanding({ params }: Props) {
  const { slug } = await params;
  const p = await getPackage(slug);
  if (!p) notFound();

  const base = SITE_URL.replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.metaDescription || p.description.slice(0, 300),
    image: p.image ? `${base}${p.image}` : undefined,
    brand: { "@type": "Organization", name: BRAND.fullName },
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "IDR",
      availability: p.slotsTaken < p.slots ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${base}/paket/${p.slug}`,
    },
  };

  const remaining = Math.max(0, p.slots - p.slotsTaken);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-forest-deep px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt={p.title} className="aspect-[16/7] w-full object-cover" />
        ) : (
          <div className="aspect-[16/7] w-full bg-gradient-to-br from-forest to-primary" />
        )}
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
            <span className="rounded-full bg-emerald-50 px-3 py-1">{TYPE_LABEL[p.type] || p.type}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1">{p.durationDays} Hari</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1">Berangkat dari {p.city || "Indonesia"}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-forest-deep">{p.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Diselenggarakan oleh <strong>{p.member.name}</strong>
            {p.member.licenseNo ? <> · Izin {p.member.licenseNo}</> : null}
            {p.member.city ? <> · {p.member.city}</> : null}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Harga per Jamaah</p>
              <p className="mt-1 text-2xl font-extrabold text-forest-deep">Rp {rupiah(p.price)}</p>
              <p className="mt-1 text-xs text-foreground/60">Sisa {remaining} kursi dari {p.slots}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-5 text-sm">
              {p.hotelMakkah ? <p>🏨 Makkah: <strong>{p.hotelMakkah}</strong></p> : null}
              {p.hotelMadinah ? <p>🏨 Madinah: <strong>{p.hotelMadinah}</strong></p> : null}
              {p.airline ? <p>✈️ Maskapai: <strong>{p.airline}</strong></p> : null}
              {p.departureDate ? <p>🗓️ Keberangkatan: <strong>{p.departureDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></p> : null}
            </div>
          </div>

          <p className="mt-6 leading-relaxed whitespace-pre-line text-foreground/90">{p.description}</p>

          <div className="mt-8 rounded-2xl bg-emerald-50 p-6 text-center">
            <p className="font-extrabold text-forest-deep">Pesan & lacak transaksi langsung di portal</p>
            <p className="mt-1 text-sm text-foreground/70">Checkout aman, invoice PDF resmi bernomor seri, garansi ekosistem MUHDIN.</p>
            <Link
              href={`/#/paket/${p.id}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-bold text-white shadow-lg transition hover:bg-forest-deep"
            >
              Lihat & Pesan di Portal MUHDIN →
            </Link>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link href="/" className="font-semibold text-emerald-700 hover:underline">← Beranda {BRAND.fullName}</Link>
            {" · "}WA resmi {BRAND.whatsappDisplay}
          </p>
        </div>
      </article>
    </main>
  );
}
