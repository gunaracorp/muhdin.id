"use client";

/**
 * SitemapView (v4.1) — HALAMAN PETA SITUS: seluruh halaman portal MUHDIN.
 * Route: #/peta-situs
 *
 * Manifesto "semuanya lengkap": satu halaman yang memetakan SEMUA tautan
 * portal — halaman utama, 20+ halaman layanan (dari MENU_NODES), 13
 * ekosistem, seluruh anggota (dari DB), seluruh tokoh pengurus, cabang
 * daerah, agenda, galeri, berita, tutorial, hingga infrastruktur
 * kepercayaan. Data dinamis diambil dari API masing-masing.
 */

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import { MENU_NODES } from "@/lib/menu-data";
import { PENGURUS_PERSON } from "@/lib/pengurus-data";
import type { Member, EventItem, GalleryItem, RegionalBranchItem, Ecosystem, Article, Tutorial } from "@/lib/types";
import { navigate } from "@/hooks/use-hash-route";
import { DetailHero, DetailSectionHead } from "@/components/views/detail-shell";

/** Tautan statis — (path, key ikon, label i18n atau teks id) */
const STATIC_PAGES: { path: string; icon: string; labelKey?: string; labelId: string }[] = [
  { path: "/beranda", icon: "home", labelKey: "navbar.items.beranda", labelId: "Beranda" },
  { path: "/tentang", icon: "info", labelKey: "navbar.items.tentang", labelId: "Tentang Kami" },
  { path: "/pengurus", icon: "users", labelKey: "navbar.items.pengurus", labelId: "Pengurus" },
  { path: "/ekosistem", icon: "boxes", labelKey: "navbar.items.bisnis13", labelId: "13 Layanan Bisnis" },
  { path: "/alur", icon: "workflow", labelKey: "navbar.items.alur", labelId: "Alur Perjalanan" },
  { path: "/anggota", icon: "grid-3x3", labelKey: "navbar.items.anggota", labelId: "Direktori Anggota" },
  { path: "/berita", icon: "newspaper", labelKey: "navbar.items.berita", labelId: "Berita" },
  { path: "/nusuk", icon: "satellite", labelKey: "navbar.items.nusuk", labelId: "Nusuk Hub" },
  { path: "/kontak", icon: "mail", labelKey: "navbar.items.kontak", labelId: "Kontak" },
  { path: "/gabung", icon: "user-plus", labelKey: "navbar.items.gabung", labelId: "Cara Bergabung" },
  { path: "/daftar", icon: "clipboard-list", labelKey: "navbar.items.daftar", labelId: "Daftar Gratis" },
  { path: "/verifikasi", icon: "shield-check", labelKey: "navbar.items.verifikasi", labelId: "Cek Verifikasi" },
  { path: "/lacak", icon: "radar", labelKey: "navbar.items.lacak", labelId: "Lacak Pendaftaran" },
  { path: "/kalkulator", icon: "calculator", labelKey: "navbar.items.kalkulator", labelId: "Kalkulator Biaya" },
  { path: "/sehat", icon: "heart-pulse", labelKey: "navbar.items.sehat", labelId: "Kesehatan Jamaah" },
  { path: "/widget", icon: "code-2", labelKey: "navbar.items.widget", labelId: "Widget Verifikasi" },
  { path: "/galeri", icon: "instagram", labelKey: "navbar.items.galeri", labelId: "Galeri" },
  { path: "/agenda", icon: "calendar", labelKey: "navbar.items.agenda", labelId: "Agenda" },
  { path: "/unduhan", icon: "download", labelKey: "navbar.items.unduhan", labelId: "Pusat Unduhan" },
  { path: "/lapor", icon: "siren", labelKey: "navbar.items.lapor", labelId: "Lapor Masalah" },
  { path: "/faq", icon: "help-circle", labelKey: "navbar.items.faq", labelId: "Pusat Bantuan (FAQ)" },
  { path: "/dpd", icon: "landmark", labelKey: "navbar.items.dpd", labelId: "Jaringan Daerah" },
  { path: "/privasi", icon: "shield-ellipsis", labelKey: "navbar.items.privasi", labelId: "Kebijakan Privasi" },
  { path: "/syarat", icon: "scale", labelKey: "navbar.items.syarat", labelId: "Syarat & Ketentuan" },
  // Audit 2026 — kemitraan, pembayaran, keamanan, model biaya
  { path: "/kemitraan", icon: "handshake", labelId: "Kemitraan FKK Banten" },
  { path: "/pembayaran", icon: "wallet", labelId: "Pembayaran Resmi" },
  { path: "/keamanan", icon: "shield-check", labelId: "Keamanan & Audit" },
  { path: "/biaya", icon: "banknote", labelId: "Model Biaya" },
  { path: "/peta-situs", icon: "map", labelId: "Peta Situs" },
];

/** Route hash kustom di luar #/layanan/<slug> (Task 52). */
const CUSTOM_ROUTES = new Set(["regulasi", "transparansi", "etik", "pdp", "darurat", "kemitraan", "pembayaran", "keamanan", "biaya"]);

function LinkChip({ path, icon, label }: { path: string; icon: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <Icon name={icon} className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function SitemapView() {
  const { t } = useT();
  const [ecosystems, setEcosystems] = useState<Ecosystem[] | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [branches, setBranches] = useState<RegionalBranchItem[] | null>(null);
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[] | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [tutorials, setTutorials] = useState<Tutorial[] | null>(null);

  useEffect(() => {
    apiGet<Ecosystem[]>("/api/ecosystems").then(setEcosystems).catch(() => setEcosystems([]));
    apiGet<Member[]>("/api/members").then(setMembers).catch(() => setMembers([]));
    apiGet<RegionalBranchItem[]>("/api/branches").then(setBranches).catch(() => setBranches([]));
    apiGet<EventItem[]>("/api/events").then(setEvents).catch(() => setEvents([]));
    apiGet<GalleryItem[]>("/api/gallery").then(setGallery).catch(() => setGallery([]));
    apiGet<Article[]>("/api/articles").then(setArticles).catch(() => setArticles([]));
    apiGet<Tutorial[]>("/api/tutorials").then(setTutorials).catch(() => setTutorials([]));
  }, []);

  // Grup layanan dari MENU_NODES (slug dinamis → #/layanan/<slug>).
  const layananGroups = MENU_NODES.filter((n): n is typeof n & { group: string } => Boolean(n.group) && Boolean(n.children));
  const l10n = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  const loadingAny =
    !ecosystems || !members || !branches || !events || !gallery || !articles || !tutorials;

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("detail.sitemap.eyebrow")}
        title={t("detail.sitemap.title")}
        subtitle={t("detail.sitemap.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
      />

      <section className="py-12">
        <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6">
          {/* ===== Halaman utama ===== */}
          <Reveal>
            <DetailSectionHead icon="layout-dashboard" title={t("detail.sitemap.staticTitle")} />
            <div className="flex flex-wrap gap-2">
              {STATIC_PAGES.map((p) => (
                <LinkChip
                  key={p.path}
                  path={p.path}
                  icon={p.icon}
                  label={p.labelKey ? l10n(p.labelKey, p.labelId) : p.labelId}
                />
              ))}
            </div>
          </Reveal>

          {/* ===== Layanan (grup dari MENU_NODES) ===== */}
          <Reveal>
            <DetailSectionHead icon="hexagon" title={t("detail.sitemap.servicesTitle")} />
            {layananGroups.map((g) => (
              <div key={g.group} className="mb-6 last:mb-0">
                <h3 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                  <Icon name={g.groupIcon || "hexagon"} className="h-4 w-4 text-primary" aria-hidden />
                  {l10n(`layanan.groups.${g.group}`, g.group || "")}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{g.children?.length ?? 0}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {g.children?.map((c) =>
                    CUSTOM_ROUTES.has(c.slug) ? (
                      <LinkChip key={c.slug} path={`/${c.slug}`} icon={c.icon} label={l10n(`layanan.items.${c.slug}`, c.slug)} />
                    ) : (
                      <LinkChip key={c.slug} path={`/layanan/${c.slug}`} icon={c.icon} label={l10n(`layanan.items.${c.slug}`, c.slug)} />
                    )
                  )}
                </div>
              </div>
            ))}
          </Reveal>

          {/* ===== 13 Ekosistem ===== */}
          <Reveal>
            <DetailSectionHead icon="boxes" title={t("detail.sitemap.ecosystemTitle")} />
            {!ecosystems ? (
              <Skeleton className="h-20 rounded-2xl" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {ecosystems.map((e) => (
                  <LinkChip key={e.id} path={`/ekosistem/${e.number}`} icon={e.icon || "hexagon"} label={`${e.number}. ${e.name}`} />
                ))}
              </div>
            )}
          </Reveal>

          {/* ===== Anggota ===== */}
          <Reveal>
            <DetailSectionHead icon="grid-3x3" title={t("detail.sitemap.membersTitle")} />
            {!members ? (
              <Skeleton className="h-20 rounded-2xl" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <LinkChip key={m.id} path={`/anggota/${m.id}`} icon="building-2" label={m.name} />
                ))}
              </div>
            )}
          </Reveal>

          {/* ===== Pengurus & Jaringan ===== */}
          <Reveal>
            <DetailSectionHead icon="users" title={t("detail.sitemap.pengurusTitle")} />
            <div className="flex flex-wrap gap-2">
              {Object.values(PENGURUS_PERSON).map((p) => (
                <LinkChip key={p.id} path={`/pengurus/${p.id}`} icon={p.icon} label={p.name} />
              ))}
              {(branches ?? []).map((b) => (
                <LinkChip key={b.id} path={`/dpd/${b.code}`} icon="landmark" label={b.name} />
              ))}
              {!branches && <Skeleton className="h-9 w-48 rounded-full" />}
            </div>
          </Reveal>

          {/* ===== Konten & dokumentasi ===== */}
          <Reveal>
            <DetailSectionHead icon="file-text" title={t("detail.sitemap.contentTitle")} />
            {loadingAny ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    <Icon name="calendar" className="h-4 w-4 text-primary" aria-hidden />
                    Agenda
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{events?.length ?? 0}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {events?.map((e) => (
                      <LinkChip key={e.id} path={`/agenda/${e.id}`} icon="calendar" label={e.title} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    <Icon name="instagram" className="h-4 w-4 text-primary" aria-hidden />
                    Galeri
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{gallery?.length ?? 0}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {gallery?.map((g) => (
                      <LinkChip key={g.id} path={`/galeri/${g.id}`} icon="instagram" label={g.title} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    <Icon name="newspaper" className="h-4 w-4 text-primary" aria-hidden />
                    Berita & Artikel
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{articles?.length ?? 0}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {articles?.map((a) => (
                      <LinkChip key={a.id} path={`/berita/${a.slug}`} icon="newspaper" label={a.title} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    <Icon name="graduation-cap" className="h-4 w-4 text-primary" aria-hidden />
                    Tutorial
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{tutorials?.length ?? 0}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tutorials?.map((tu) => (
                      <LinkChip key={tu.id} path={`/tutorial/${tu.slug}`} icon="graduation-cap" label={tu.title} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
