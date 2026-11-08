/**
 * R-089 «Landing Kampanye Musiman» (v13.0 «GERBANG») — halaman SSR /kampanye/[slug].
 *
 * Landing per musim (Ramadan, Haji, liburan…) ber-metadata + JSON-LD,
 * dengan formulir konversi lead (nama/telepon) → antrean follow-up CMS.
 * force-dynamic + fallback aman: kampanye nonaktif/tak dikenal → notFound().
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { SITE_URL, BRAND } from "@/lib/constants";
import { Icon } from "@/components/site/icon";
import { LeadForm } from "./lead-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const SEASON_LABEL: Record<string, string> = {
  RAMADAN: "Musim Ramadan", HAJI: "Musim Haji", LIBURAN: "Liburan Sekolah",
  HIJRIAH: "Tahun Baru Hijriah", LAINNYA: "Kampanye Istimewa",
};

async function getCampaign(slug: string) {
  try {
    return await db.campaign.findFirst({ where: { slug, active: true } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCampaign(slug);
  if (!c) return { title: "Kampanye tidak ditemukan" };
  const base = SITE_URL.replace(/\/+$/, "");
  const title = `${c.title} — ${SEASON_LABEL[c.season] || "Kampanye"} ${BRAND.fullName}`;
  return {
    title,
    description: c.subtitle || c.description.slice(0, 155),
    alternates: { canonical: `${base}/kampanye/${c.slug}` },
    openGraph: {
      title,
      description: c.subtitle || c.description.slice(0, 155),
      type: "website",
      url: `${base}/kampanye/${c.slug}`,
      images: c.heroImage ? [{ url: c.heroImage }] : undefined,
    },
  };
}

export default async function KampanyeLanding({ params }: Props) {
  const { slug } = await params;
  const c = await getCampaign(slug);
  if (!c) notFound();

  const base = SITE_URL.replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: c.title,
    description: c.description.slice(0, 300),
    eventStatus: "https://schema.org/EventScheduled",
    organizer: { "@type": "Organization", name: BRAND.fullName, url: base },
    offers: {
      "@type": "Offer",
      url: `${base}/kampanye/${c.slug}`,
      availability: "https://schema.org/InStock",
      validFrom: (c.startsAt || c.createdAt).toISOString(),
      ...(c.endsAt ? { validThrough: c.endsAt.toISOString() } : {}),
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-forest-deep px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <article className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {c.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.heroImage} alt={c.title} className="aspect-[16/7] w-full object-cover" />
          ) : (
            <div className="aspect-[16/6] w-full bg-gradient-to-br from-forest via-emerald-800 to-primary" />
          )}
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
              <span className="rounded-full bg-emerald-50 px-3 py-1">{SEASON_LABEL[c.season] || c.season}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1">{BRAND.fullName}</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-forest-deep">{c.title}</h1>
            {c.subtitle && <p className="mt-2 text-base font-semibold text-emerald-800/90">{c.subtitle}</p>}
            <div className="mt-5 leading-relaxed whitespace-pre-line text-stone-700">{c.description}</div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: "shield-check", t: "Penyelenggara Terverifikasi", d: "Seluruh mitra lolos pindai izin 360°." },
                { icon: "wallet", t: "Transparan & Terlindungi", d: "Invoice resmi + lacak status real-time." },
                { icon: "phone", t: "Pendampingan Penuh", d: `Tim siap membantu via WA ${BRAND.whatsappDisplay}.` },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl bg-emerald-50 p-4">
                  <p className="flex items-center gap-1.5 text-sm font-extrabold text-forest-deep">
                    <Icon name={f.icon} className="h-4 w-4 text-emerald-700" aria-hidden />
                    {f.t}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">{f.d}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-stone-400">
              <Link href="/" className="font-semibold text-emerald-700 hover:underline">← Beranda {BRAND.fullName}</Link>
              {" · "}WA resmi {BRAND.whatsappDisplay}
            </p>
          </div>
        </article>

        <div className="lg:sticky lg:top-8">
          <Suspense fallback={<div className="h-72 rounded-2xl bg-white/10" />}>
            <LeadForm slug={c.slug} cta={c.ctaText} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
