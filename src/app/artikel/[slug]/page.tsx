/**
 * Task 19 (R-057 + R-091) — Landing page SEO artikel.
 *
 * Server-rendered, terindeks penuh: metadata per artikel + JSON-LD Article +
 * konten terbaca + CTA masuk portal (#/berita/[slug]).
 * Mode export shared-hosting: folder src/app/artikel dibuang oleh build script
 * (hash SPA + PHP backend tetap berjalan normal di sana).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getArticle(slug: string) {
  try {
    return await db.article.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a || a.status !== "PUBLISHED") return { title: "Artikel tidak ditemukan" };
  const title = a.metaTitle || a.title;
  const description = a.metaDescription || a.excerpt;
  const base = SITE_URL.replace(/\/+$/, "");
  return {
    title,
    description,
    keywords: a.keywords || undefined,
    alternates: { canonical: `${base}/artikel/${a.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${base}/artikel/${a.slug}`,
      publishedTime: a.createdAt.toISOString(),
      modifiedTime: a.updatedAt.toISOString(),
      images: [{ url: a.cover || `/api/og?title=${encodeURIComponent(title)}&kind=Artikel` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [a.cover || `/api/og?title=${encodeURIComponent(title)}&kind=Artikel`],
    },
  };
}

/** Render konten markdown-sederhana (paragraf, ## sub-judul, bullet "- "). */
function ArticleBody({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-4 text-xl font-extrabold text-forest-deep">
              {block.slice(3).trim()}
            </h2>
          );
        }
        if (block.split("\n").every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 ps-6 text-foreground/90">
              {block.split("\n").map((l, j) => (
                <li key={j}>{l.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="leading-relaxed text-foreground/90">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export default async function ArtikelLanding({ params }: Props) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a || a.status !== "PUBLISHED") notFound();

  // Hitung pembaca landing (aman: gagal diam).
  void db.article.update({ where: { id: a.id }, data: { views: { increment: 1 } } }).catch(() => undefined);

  const base = SITE_URL.replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.metaTitle || a.title,
    description: a.metaDescription || a.excerpt,
    image: a.cover ? `${base}${a.cover}` : undefined,
    datePublished: a.createdAt.toISOString(),
    dateModified: a.updatedAt.toISOString(),
    author: { "@type": "Organization", name: a.author },
    publisher: {
      "@type": "Organization",
      name: "MUHDIN INDONESIA",
      url: base,
    },
    mainEntityOfPage: `${base}/artikel/${a.slug}`,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-forest-deep px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{a.category} · MUHDIN INDONESIA</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-forest-deep">{a.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {a.author} · {a.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · {a.views + 1}× dibaca
        </p>
        {a.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.cover} alt={a.title} className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover" />
        ) : null}
        <p className="mt-6 border-s-4 border-gold ps-4 text-lg font-medium text-foreground/80">{a.excerpt}</p>
        <div className="mt-6">
          <ArticleBody content={a.content} />
        </div>

        <div className="mt-10 rounded-2xl bg-emerald-50 p-6 text-center">
          <p className="font-extrabold text-forest-deep">Siap berangkat dengan ekosistem terpercaya?</p>
          <p className="mt-1 text-sm text-foreground/70">Buka portal MUHDIN: verifikasi penyelenggara, marketplace paket, akademi, dan poin KTA — 100% gratis.</p>
          <Link
            href={`/#/berita/${a.slug}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-bold text-white shadow-lg transition hover:bg-forest-deep"
          >
            Baca di Portal MUHDIN →
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="font-semibold text-emerald-700 hover:underline">← Beranda MUHDIN INDONESIA</Link>
          {" · "}WA resmi 0812 2234 5856
        </p>
      </article>
    </main>
  );
}
