"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImportCsvButton } from "@/components/admin/import-csv-button";
import { apiGet, apiSend, formatDate, formatDateTime, maskKey, timeAgo, withPort } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CrudManager, AdminBadge } from "@/components/admin/crud-manager";
import type {
  ColumnDef, FieldDef,
} from "@/components/admin/crud-manager";
import type {
  Article, Ecosystem, JourneyStep, Roadmap, Member, Tutorial, Faq, Testimonial,
  ManagementMember, ContactMessage, MembershipApplication, SiteSettings,
  NusukConnection, NusukPermit, NusukPublicData, NusukSyncLog, NusukSyncResult,
} from "@/lib/types";

// ====== SHARED OPTIONS ======
const CLUSTER_OPTS = ["Akses & Mobilitas", "Pengalaman Ibadah", "Nilai Tambah & Jaminan Mutu"].map((c) => ({ value: c, label: c }));
const TYPE_OPTS = [
  { value: "PPIU", label: "PPIU" },
  { value: "PIHK", label: "PIHK" },
  { value: "KBIHU", label: "KBIHU" },
  { value: "IPHI", label: "IPHI" },
  { value: "TRAVEL_WISATA", label: "Travel Wisata" },
];
const ICON_OPTS = [
  "passport", "plane-takeoff", "users", "plane-landing", "book-open", "building-2",
  "bus", "map", "landmark", "utensils", "shopping-bag", "clipboard-list", "shield-check",
  "moon-star", "award", "heart-handshake", "graduation-cap", "wallet", "smartphone",
  "map-pin", "brain-circuit", "git-merge", "layout-dashboard", "languages",
].map((i) => ({ value: i, label: i }));

const CATEGORY_OPTS = ["Berita", "Pengumuman", "Artikel", "Press Release"].map((c) => ({ value: c, label: c }));
const TUT_CAT_OPTS = ["Umum", "CMS", "Jamaah", "Mitra"].map((c) => ({ value: c, label: c }));
const LEVEL_OPTS = ["Pemula", "Menengah", "Mahir"].map((c) => ({ value: c, label: c }));
const FAQ_CAT_OPTS = ["Umum", "Keanggotaan", "Jamaah", "Teknologi"].map((c) => ({ value: c, label: c }));

/**
 * Task 18-d — tombol unduh laporan CSV (endpoint /api/export?type=…).
 * Dipakai di header AdminMembers / AdminApplications / AdminMessages / AdminSubscribers.
 */
export function ExportCsvButton({ type, label = "Ekspor CSV" }: { type: string; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 shrink-0 text-primary border-primary/40 hover:bg-primary/10"
      asChild
    >
      <a href={`/api/export?type=${type}`} download aria-label={`${label} (${type})`}>
        <Icon name="download" className="h-4 w-4 mr-1.5" aria-hidden />
        {label}
      </a>
    </Button>
  );
}

/* ================= BERITA ================= */
export function AdminArticles() {
  const config = {
    title: "Berita & Artikel",
    description: "Kelola konten berita, pengumuman, artikel, dan press release portal MUHDIN.",
    endpoint: "/api/articles",
    itemName: "Artikel",
    searchKeys: ["title", "category", "author"],
    extraQuery: "?status=all",
    defaultItem: () => ({
      title: "", category: "Berita", author: "Tim MUHDIN", excerpt: "",
      content: "", cover: "/images/hero-kaaba.jpg", status: "PUBLISHED", featured: false,
    }),
    fields: [
      { key: "title", label: "Judul", type: "text", required: true, full: true } as FieldDef,
      { key: "category", label: "Kategori", type: "select", options: CATEGORY_OPTS, required: true },
      { key: "author", label: "Penulis", type: "text" },
      { key: "cover", label: "URL Gambar Sampul", type: "text", full: true, hint: "Contoh: /images/hero-kaaba.jpg" },
      { key: "excerpt", label: "Ringkasan (Excerpt)", type: "textarea", placeholder: "1-2 kalimat yang muncul di kartu berita…" },
      { key: "status", label: "Status", type: "select", options: [{ value: "PUBLISHED", label: "Terbit" }, { value: "DRAFT", label: "Draft" }], required: true },
      { key: "featured", label: "Jadikan Utama", type: "switch", hint: "Artikel utama tampil besar di halaman berita", full: true },
      { key: "content", label: "Konten (Markdown)", type: "markdown", placeholder: "## Sub-judul\n\nTulis konten di sini…" },
      // R-091 — SEO per artikel (landing /artikel/[slug])
      { key: "metaTitle", label: "Meta Judul (SEO)", type: "text", full: true, hint: "Maks 60 karakter; kosongkan untuk memakai judul artikel" },
      { key: "metaDescription", label: "Meta Deskripsi (SEO)", type: "textarea", hint: "Maks 160 karakter; tampil di hasil pencarian Google" },
      { key: "keywords", label: "Kata Kunci (SEO)", type: "text", full: true, hint: "Pisahkan dengan koma: manasik umroh, rukun umroh, …" },
    ] as FieldDef[],
    columns: [
      { key: "title", label: "Judul", render: (a: Article) => (
        <div className="max-w-xs">
          <p className="font-semibold truncate">{a.title}</p>
          <p className="text-xs text-muted-foreground">{a.author}</p>
        </div>
      ) },
      { key: "category", label: "Kategori", hideOnMobile: true, render: (a: Article) => <Badge variant="secondary" className="text-[10px]">{a.category}</Badge> },
      { key: "status", label: "Status", render: (a: Article) => <AdminBadge status={a.status} /> },
      { key: "featured", label: "Utama", hideOnMobile: true, render: (a: Article) => a.featured ? <Icon name="star" className="h-4 w-4 fill-gold-deep text-gold-deep" /> : <span className="text-muted-foreground">—</span> },
      { key: "views", label: "Dilihat", hideOnMobile: true, render: (a: Article) => <span className="text-muted-foreground">{a.views}×</span> },
    ] as ColumnDef<Article>[],
  };
  return <CrudManager<Article> config={config} />;
}

/* ================= EKOSISTEM ================= */
export function AdminEcosystems() {
  const config = {
    title: "13 Ekosistem MUHDIN",
    description: "Kelola arsitektur 13 ekosistem layanan — ruang lingkup, standar, dan ikon.",
    endpoint: "/api/ecosystems",
    itemName: "Ekosistem",
    searchKeys: ["name", "cluster", "scope"],
    defaultItem: () => ({ number: 1, name: "", cluster: "Akses & Mobilitas", icon: "hexagon", scope: "", standard: "", description: "" }),
    fields: [
      { key: "number", label: "Nomor Urut (1-13)", type: "number", required: true },
      { key: "name", label: "Nama Ekosistem", type: "text", required: true },
      { key: "cluster", label: "Klaster", type: "select", options: CLUSTER_OPTS, required: true },
      { key: "icon", label: "Ikon", type: "select", options: ICON_OPTS },
      { key: "scope", label: "Ruang Lingkup", type: "textarea" },
      { key: "standard", label: "Standar MUHDIN", type: "textarea" },
      { key: "description", label: "Deskripsi Lengkap", type: "textarea", placeholder: "Penjelasan 2-3 kalimat tentang ekosistem ini…" },
    ] as FieldDef[],
    columns: [
      { key: "number", label: "No", render: (e: Ecosystem) => <span className="font-extrabold text-primary">{String(e.number).padStart(2, "0")}</span> },
      { key: "name", label: "Nama", render: (e: Ecosystem) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
            <Icon name={e.icon} className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold">{e.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{e.scope}</p>
          </div>
        </div>
      ) },
      { key: "cluster", label: "Klaster", hideOnMobile: true, render: (e: Ecosystem) => <Badge variant="secondary" className="text-[10px]">{e.cluster}</Badge> },
    ] as ColumnDef<Ecosystem>[],
  };
  return <CrudManager<Ecosystem> config={config} />;
}

/* ================= ALUR ================= */
export function AdminJourney() {
  const config = {
    title: "Alur Perjalanan Jamaah (13 Tahap)",
    description: "Kelola tahapan end-to-end journey beserta aktor dan output digitalnya.",
    endpoint: "/api/journey",
    itemName: "Tahap",
    searchKeys: ["title", "actor", "activity"],
    defaultItem: () => ({ step: 1, title: "", activity: "", actor: "", output: "", icon: "circle" }),
    fields: [
      { key: "step", label: "Nomor Tahap", type: "number", required: true },
      { key: "title", label: "Judul Tahap", type: "text", required: true },
      { key: "icon", label: "Ikon", type: "select", options: ICON_OPTS },
      { key: "actor", label: "Aktor Utama", type: "text" },
      { key: "activity", label: "Aktivitas Utama", type: "textarea" },
      { key: "output", label: "Output Digital", type: "textarea" },
    ] as FieldDef[],
    columns: [
      { key: "step", label: "Tahap", render: (s: JourneyStep) => <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white font-extrabold text-xs">{s.step}</span> },
      { key: "title", label: "Judul", render: (s: JourneyStep) => (
        <div>
          <p className="font-semibold">{s.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{s.activity}</p>
        </div>
      ) },
      { key: "actor", label: "Aktor", hideOnMobile: true, render: (s: JourneyStep) => <span className="text-muted-foreground text-xs">{s.actor}</span> },
    ] as ColumnDef<JourneyStep>[],
  };
  return <CrudManager<JourneyStep> config={config} />;
}

/* ================= ROADMAP ================= */
export function AdminRoadmap() {
  const config = {
    title: "Roadmap 2026-2030",
    description: "Kelola peta jalan implementasi empat fase transformasi digital.",
    endpoint: "/api/roadmap",
    itemName: "Fase",
    searchKeys: ["phase", "period", "focus"],
    defaultItem: () => ({ phase: "", period: "", focus: "", deliverables: "", order: 99 }),
    fields: [
      { key: "phase", label: "Nama Fase", type: "text", required: true, placeholder: "Contoh: Fase 1: Fondasi" },
      { key: "period", label: "Periode", type: "text", required: true, placeholder: "Contoh: 2026" },
      { key: "order", label: "Urutan", type: "number" },
      { key: "focus", label: "Fokus Utama", type: "text", full: true },
      { key: "deliverables", label: "Deliverables Kunci", type: "textarea" },
    ] as FieldDef[],
    columns: [
      { key: "phase", label: "Fase", render: (r: Roadmap) => (
        <div>
          <p className="font-semibold">{r.phase}</p>
          <p className="text-xs text-muted-foreground">{r.period}</p>
        </div>
      ) },
      { key: "focus", label: "Fokus", hideOnMobile: true, render: (r: Roadmap) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-sm">{r.focus}</span> },
      { key: "order", label: "Urutan", hideOnMobile: true },
    ] as ColumnDef<Roadmap>[],
  };
  return <CrudManager<Roadmap> config={config} />;
}

/* ================= ANGGOTA ================= */
export function AdminMembers() {
  const config = {
    title: "Direktori Anggota",
    description: "Kelola data anggota terverifikasi yang tampil di direktori publik.",
    endpoint: "/api/members",
    itemName: "Anggota",
    searchKeys: ["name", "city", "licenseNo", "province"],
    extraQuery: "?status=all",
    defaultItem: () => ({
      name: "", type: "PPIU", city: "", province: "", licenseNo: "", phone: "",
      email: "", website: "", description: "", rating: 4.5, status: "TERVERIFIKASI",
      memberSince: new Date().getFullYear(),
    }),
    fields: [
      { key: "name", label: "Nama Organisasi", type: "text", required: true },
      { key: "type", label: "Jenis Mitra", type: "select", options: TYPE_OPTS, required: true },
      { key: "licenseNo", label: "Nomor Izin", type: "text", required: true },
      { key: "city", label: "Kota", type: "text", required: true },
      { key: "province", label: "Provinsi", type: "text" },
      { key: "phone", label: "Telepon", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "website", label: "Website", type: "text" },
      { key: "memberSince", label: "Anggota Sejak (Tahun)", type: "number" },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        { value: "TERVERIFIKASI", label: "Terverifikasi" },
        { value: "PENDING", label: "Menunggu" },
        { value: "SUSPENDED", label: "Ditangguhkan" },
      ], required: true },
      { key: "description", label: "Deskripsi Singkat", type: "textarea" },
    ] as FieldDef[],
    columns: [
      { key: "name", label: "Organisasi", render: (m: Member) => (
        <div>
          <p className="font-semibold">{m.name}</p>
          <p className="text-xs text-muted-foreground">{m.type} · {m.city}, {m.province}</p>
        </div>
      ) },
      { key: "licenseNo", label: "Nomor Izin", hideOnMobile: true, render: (m: Member) => <span className="font-mono text-xs">{m.licenseNo}</span> },
      { key: "status", label: "Status", render: (m: Member) => <AdminBadge status={m.status} /> },
      { key: "rating", label: "Rating", hideOnMobile: true, render: (m: Member) => (
        <span className="flex items-center gap-1 text-sm">
          <Icon name="star" className="h-3.5 w-3.5 fill-gold-deep text-gold-deep" /> {m.rating.toFixed(1)}
        </span>
      ) },
    ] as ColumnDef<Member>[],
  };
  return (
    <div>
      <div className="flex justify-end gap-2 mb-2">
        <ImportCsvButton type="members" />
        <ExportCsvButton type="members" />
      </div>
      <CrudManager<Member> config={config} />
    </div>
  );
}

/* ================= TUTORIAL ================= */
export function AdminTutorials() {
  const config = {
    title: "Pusat Tutorial",
    description: "Kelola panduan penggunaan portal & CMS untuk jamaah, mitra, dan admin.",
    endpoint: "/api/tutorials",
    itemName: "Tutorial",
    searchKeys: ["title", "category", "level"],
    extraQuery: "?all=1",
    defaultItem: () => ({
      title: "", category: "Umum", level: "Pemula", duration: 10,
      order: 99, published: true, summary: "", content: "",
    }),
    fields: [
      { key: "title", label: "Judul Tutorial", type: "text", required: true, full: true },
      { key: "category", label: "Kategori", type: "select", options: TUT_CAT_OPTS, required: true },
      { key: "level", label: "Level", type: "select", options: LEVEL_OPTS, required: true },
      { key: "duration", label: "Durasi (menit)", type: "number" },
      { key: "order", label: "Urutan Tampil", type: "number" },
      { key: "published", label: "Publikasikan", type: "switch", full: true, hint: "Tutorial yang tidak dipublikasikan hanya terlihat di CMS" },
      { key: "summary", label: "Ringkasan", type: "textarea" },
      { key: "content", label: "Konten (Markdown)", type: "markdown", placeholder: "## Langkah 1\n\n1. Lakukan…\n2. Klik…" },
    ] as FieldDef[],
    columns: [
      { key: "title", label: "Judul", render: (t: Tutorial) => (
        <div className="max-w-sm">
          <p className="font-semibold">{t.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{t.summary}</p>
        </div>
      ) },
      { key: "category", label: "Kategori", hideOnMobile: true, render: (t: Tutorial) => <Badge variant="secondary" className="text-[10px]">{t.category} · {t.level}</Badge> },
      { key: "published", label: "Status", render: (t: Tutorial) => (
        <Badge variant="outline" className={`text-[10px] font-bold ${t.published ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground"}`}>
          {t.published ? "Terbit" : "Draft"}
        </Badge>
      ) },
      { key: "views", label: "Dilihat", hideOnMobile: true, render: (t: Tutorial) => <span className="text-muted-foreground">{t.views}×</span> },
    ] as ColumnDef<Tutorial>[],
  };
  return <CrudManager<Tutorial> config={config} />;
}

/* ================= FAQ ================= */
export function AdminFaqs() {
  const config = {
    title: "Tanya Jawab (FAQ)",
    description: "Kelola pertanyaan yang sering diajukan pada halaman kontak.",
    endpoint: "/api/faqs",
    itemName: "FAQ",
    searchKeys: ["question", "category"],
    defaultItem: () => ({ question: "", answer: "", category: "Umum", order: 99 }),
    fields: [
      { key: "question", label: "Pertanyaan", type: "text", required: true, full: true },
      { key: "category", label: "Kategori", type: "select", options: FAQ_CAT_OPTS, required: true },
      { key: "order", label: "Urutan", type: "number" },
      { key: "answer", label: "Jawaban", type: "textarea", required: true },
    ] as FieldDef[],
    columns: [
      { key: "question", label: "Pertanyaan", render: (f: Faq) => <p className="font-semibold max-w-md truncate">{f.question}</p> },
      { key: "category", label: "Kategori", hideOnMobile: true, render: (f: Faq) => <Badge variant="secondary" className="text-[10px]">{f.category}</Badge> },
      { key: "order", label: "Urutan", hideOnMobile: true },
    ] as ColumnDef<Faq>[],
  };
  return <CrudManager<Faq> config={config} />;
}

/* ================= TESTIMONI ================= */
export function AdminTestimonials() {
  const config = {
    title: "Testimoni",
    description: "Moderasi testimoni — testimoni publik baru tampil setelah diaktifkan.",
    endpoint: "/api/testimonials",
    itemName: "Testimoni",
    searchKeys: ["name", "role", "content"],
    extraQuery: "?all=1",
    defaultItem: () => ({ name: "", role: "Jamaah", rating: 5, published: true, content: "" }),
    fields: [
      { key: "name", label: "Nama", type: "text", required: true },
      { key: "role", label: "Peran", type: "text", required: true, placeholder: "Jamaah / Pemilik PPIU / Tour Leader…" },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      { key: "published", label: "Tampilkan Publik", type: "switch", full: true },
      { key: "content", label: "Isi Testimoni", type: "textarea", required: true },
    ] as FieldDef[],
    columns: [
      { key: "name", label: "Nama", render: (t: Testimonial) => (
        <div className="max-w-sm">
          <p className="font-semibold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
      ) },
      { key: "rating", label: "Rating", hideOnMobile: true, render: (t: Testimonial) => (
        <span className="flex items-center gap-1 text-sm">
          <Icon name="star" className="h-3.5 w-3.5 fill-gold-deep text-gold-deep" /> {t.rating}
        </span>
      ) },
      { key: "published", label: "Publik", render: (t: Testimonial) => (
        <Badge variant="outline" className={`text-[10px] font-bold ${t.published ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground"}`}>
          {t.published ? "Tampil" : "Menunggu Moderasi"}
        </Badge>
      ) },
    ] as ColumnDef<Testimonial>[],
  };
  return <CrudManager<Testimonial> config={config} />;
}

/* ================= STRUKTUR ================= */
export function AdminManagement() {
  const config = {
    title: "Struktur Organisasi",
    description: "Kelola pengurus yang tampil pada halaman Tentang.",
    endpoint: "/api/management",
    itemName: "Pengurus",
    searchKeys: ["name", "position"],
    defaultItem: () => ({ name: "", position: "", bio: "", order: 99 }),
    fields: [
      { key: "name", label: "Nama Lengkap", type: "text", required: true },
      { key: "position", label: "Jabatan", type: "text", required: true },
      { key: "order", label: "Urutan", type: "number" },
      { key: "bio", label: "Bio Singkat", type: "textarea" },
    ] as FieldDef[],
    columns: [
      { key: "name", label: "Nama", render: (m: ManagementMember) => <p className="font-semibold">{m.name}</p> },
      { key: "position", label: "Jabatan", render: (m: ManagementMember) => <span className="text-xs text-muted-foreground">{m.position}</span> },
      { key: "order", label: "Urutan", hideOnMobile: true },
    ] as ColumnDef<ManagementMember>[],
  };
  return <CrudManager<ManagementMember> config={config} />;
}

/* ================= PESAN (custom) ================= */
export function AdminMessages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [reading, setReading] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState<ContactMessage | null>(null);

  const load = useCallback(() => {
    apiGet<ContactMessage[]>("/api/messages").then(setMessages).catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiSend(`/api/messages/${id}`, "PUT", { status });
      toast({ title: status === "REPLIED" ? "Ditandai sudah dibalas ✓" : "Ditandai sudah dibaca ✓" });
      if (reading) setReading({ ...reading, status });
      load();
    } catch (e) {
      toast({ title: "Gagal", description: (e as Error).message, variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await apiSend(`/api/messages/${deleting.id}`, "DELETE");
      toast({ title: "Pesan dihapus ✓" });
      setReading(null);
      load();
    } catch (e) {
      toast({ title: "Gagal menghapus", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const filters = [
    { value: "all", label: "Semua" },
    { value: "UNREAD", label: "Belum Dibaca" },
    { value: "READ", label: "Dibaca" },
    { value: "REPLIED", label: "Dibalas" },
  ];

  const filtered = (messages || []).filter((m) => filter === "all" || m.status === filter);
  const unreadCount = (messages || []).filter((m) => m.status === "UNREAD").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            Pesan Masuk
            {unreadCount > 0 && <Badge className="danger-solid">{unreadCount} baru</Badge>}
          </h2>
          <p className="text-sm text-muted-foreground">Inbox pesan dari formulir kontak publik.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto items-center">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === f.value ? "bg-primary text-white" : "bg-muted text-foreground/70 hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
          <ExportCsvButton type="messages" />
          <ImportCsvButton type="messages" />
        </div>
      </div>

      {!messages ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
          <Icon name="inbox" className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Tidak ada pesan pada filter ini.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setReading(m)}
              className={`w-full text-left rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/40 ${
                m.status === "UNREAD" ? "border-l-4 border-l-gold" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-sm truncate ${m.status === "UNREAD" ? "font-extrabold" : "font-semibold"}`}>
                    {m.status === "UNREAD" && <span className="inline-block h-2 w-2 rounded-full bg-gold mr-2 align-middle" />}
                    {m.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {m.name} · {m.email} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <AdminBadge status={m.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Read dialog */}
      <Dialog open={!!reading} onOpenChange={(o) => !o && setReading(null)}>
        <DialogContent className="max-w-xl">
          {reading && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left">{reading.subject}</DialogTitle>
                <DialogDescription className="text-left">
                  {reading.name} &lt;{reading.email}&gt;{reading.phone ? ` · ${reading.phone}` : ""} · {formatDateTime(reading.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {reading.message}
              </div>
              <div className="flex flex-wrap justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:${reading.email}?subject=Re: ${encodeURIComponent(reading.subject)}`}>
                  <Icon name="mail" className="h-4 w-4 mr-1.5" /> Balas via Email
                </Button>
                {reading.status !== "READ" && reading.status !== "REPLIED" && (
                  <Button variant="outline" size="sm" onClick={() => updateStatus(reading.id, "READ")}>
                    <Icon name="check-circle-2" className="h-4 w-4 mr-1.5" /> Tandai Dibaca
                  </Button>
                )}
                {reading.status !== "REPLIED" && (
                  <Button size="sm" className="bg-gradient-to-r from-primary to-forest text-white" onClick={() => updateStatus(reading.id, "REPLIED")}>
                    <Icon name="send" className="h-4 w-4 mr-1.5" /> Sudah Dibalas
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => setDeleting(reading)}>
                  <Icon name="trash" className="h-4 w-4 mr-1.5" /> Hapus
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pesan ini?</AlertDialogTitle>
            <AlertDialogDescription>Pesan akan dihapus permanen dari inbox.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="danger-solid" onClick={doDelete}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ================= PENDAFTARAN (custom) — Task 17 Portal Verifikator ================= */
export function AdminApplications() {
  const { toast } = useToast();
  const [apps, setApps] = useState<MembershipApplication[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<MembershipApplication | null>(null);

  // Dialog verifikasi — detail lengkap + catatan verifikator.
  const [reviewing, setReviewing] = useState<MembershipApplication | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");

  const load = useCallback(() => {
    apiGet<MembershipApplication[]>("/api/applications").then(setApps).catch(() => setApps([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "approve" | "reject", reviewNote = "") => {
    setProcessing(id + action);
    try {
      await apiSend(`/api/applications/${id}`, "PUT", { action, reviewNote });
      toast({
        title: action === "approve" ? "Pendaftaran disetujui ✓" : "Pendaftaran ditolak",
        description:
          action === "approve"
            ? "Organisasi otomatis ditambahkan ke direktori anggota publik."
            : "Alasan tersimpan pada catatan verifikator.",
      });
      setReviewing(null);
      setNote("");
      setNoteError("");
      load();
    } catch (e) {
      toast({ title: "Gagal memproses", description: (e as Error).message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const openReview = (a: MembershipApplication) => {
    setReviewing(a);
    setNote("");
    setNoteError("");
  };

  const submitReview = (action: "approve" | "reject") => {
    if (!reviewing) return;
    if (action === "reject" && note.trim().length < 5) {
      setNoteError("Alasan penolakan wajib diisi (minimal 5 karakter) agar pencalar mendapat kejelasan.");
      return;
    }
    act(reviewing.id, action, note.trim());
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await apiSend(`/api/applications/${deleting.id}`, "DELETE");
      toast({ title: "Pendaftaran dihapus ✓" });
      load();
    } catch (e) {
      toast({ title: "Gagal menghapus", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const list = apps || [];
  const pendingCount = list.filter((a) => a.status === "PENDING").length;
  const approvedCount = list.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = list.filter((a) => a.status === "REJECTED").length;

  const statCards = [
    { label: "Menunggu", value: pendingCount, status: "PENDING", icon: "inbox", tone: "text-destructive" },
    { label: "Disetujui", value: approvedCount, status: "APPROVED", icon: "check-circle-2", tone: "text-primary" },
    { label: "Ditolak", value: rejectedCount, status: "REJECTED", icon: "ban", tone: "text-muted-foreground" },
  ];

  const filters = [
    { value: "all", label: "Semua" },
    { value: "PENDING", label: "Menunggu" },
    { value: "APPROVED", label: "Disetujui" },
    { value: "REJECTED", label: "Ditolak" },
  ];

  const q = query.trim().toLowerCase();
  const filtered = list.filter(
    (a) =>
      (filter === "all" || a.status === filter) &&
      (!q ||
        a.orgName.toLowerCase().includes(q) ||
        a.licenseNo.toLowerCase().includes(q) ||
        a.contactName.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q))
  );

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold">Portal Verifikasi Keanggotaan</h2>
        <p className="text-sm text-muted-foreground">
          Periksa pendaftaran penyelenggara — menyetujui akan otomatis menambahkan organisasi ke direktori anggota publik.
        </p>
      </div>

      {/* Statistik antrean — klik untuk memfilter */}
      <div className="grid grid-cols-3 gap-3 mb-4" role="group" aria-label="Statistik antrean verifikasi">
        {statCards.map((s) => (
          <button
            key={s.status}
            onClick={() => setFilter(filter === s.status ? "all" : s.status)}
            aria-pressed={filter === s.status}
            className={`rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md ${
              filter === s.status ? "border-primary/60 ring-1 ring-primary/30" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-2xl font-extrabold tabular-nums ${s.tone}`}>{s.value}</span>
              <Icon name={s.icon} className={`h-4.5 w-4.5 shrink-0 ${s.tone} opacity-60`} aria-hidden />
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === f.value ? "bg-primary text-white" : "bg-muted text-foreground/70 hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <div className="relative sm:w-72 flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari organisasi, izin, kontak…"
              aria-label="Cari pendaftaran"
              className="pl-9 h-9"
            />
          </div>
          <ExportCsvButton type="applications" />
          <ImportCsvButton type="applications" />
        </div>
      </div>

      {!apps ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
          <Icon name="user-plus" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Tidak ada pendaftaran pada filter ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((a) => (
            <div key={a.id} className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft font-extrabold">
                    {a.orgName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{a.orgName}</p>
                    <p className="text-xs text-muted-foreground">{a.type} · Izin {a.licenseNo}</p>
                  </div>
                </div>
                <AdminBadge status={a.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <p><span className="text-muted-foreground">Kontak:</span> <b>{a.contactName}</b></p>
                <p><span className="text-muted-foreground">Telp:</span> {a.phone}</p>
                <p className="col-span-2 truncate"><span className="text-muted-foreground">Email:</span> {a.email}</p>
                <p className="col-span-2"><span className="text-muted-foreground">Lokasi:</span> {a.city}{a.province ? `, ${a.province}` : ""}</p>
                {a.message && <p className="col-span-2 text-muted-foreground italic line-clamp-2">“{a.message}”</p>}
                <p className="col-span-2 text-[11px] text-muted-foreground">Diterima: {formatDateTime(a.createdAt)}</p>
              </div>

              {/* Jejak verifikasi (Task 17) */}
              {a.status !== "PENDING" && (a.reviewNote || a.reviewedBy) && (
                <div className="mt-3 rounded-xl border bg-muted/50 p-3">
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <Icon name="clipboard-list" className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Catatan Verifikator
                  </p>
                  {a.reviewNote && <p className="mt-1 text-xs text-muted-foreground italic">“{a.reviewNote}”</p>}
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Diperiksa oleh <b>{a.reviewedBy || "—"}</b>{a.reviewedAt ? ` · ${formatDateTime(a.reviewedAt)}` : ""}
                  </p>
                </div>
              )}

              {a.status === "PENDING" ? (
                <div className="mt-4 border-t pt-4">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-primary to-forest text-white"
                    onClick={() => openReview(a)}
                  >
                    <Icon name="shield-check" className="h-4 w-4 mr-1.5" />
                    Verifikasi Pendaftaran
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex justify-end border-t pt-4">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleting(a)}>
                    <Icon name="trash" className="h-4 w-4 mr-1.5" /> Hapus Catatan
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog verifikasi — Task 17 */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="shield-check" className="h-5 w-5 text-primary" />
              Verifikasi Pendaftaran
            </DialogTitle>
            <DialogDescription>
              Periksa kelengkapan data <b>{reviewing?.orgName}</b> sebelum mengambil keputusan.
            </DialogDescription>
          </DialogHeader>

          {reviewing && (
            <>
              <div className="rounded-xl border bg-muted/40 p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <p className="col-span-2"><span className="text-muted-foreground">Organisasi:</span> <b>{reviewing.orgName}</b></p>
                <p><span className="text-muted-foreground">Tipe:</span> {reviewing.type}</p>
                <p><span className="text-muted-foreground">No. Izin:</span> <span className="font-mono">{reviewing.licenseNo}</span></p>
                <p><span className="text-muted-foreground">Kontak:</span> {reviewing.contactName}</p>
                <p><span className="text-muted-foreground">Telp:</span> {reviewing.phone}</p>
                <p className="col-span-2"><span className="text-muted-foreground">Email:</span> {reviewing.email}</p>
                <p className="col-span-2"><span className="text-muted-foreground">Lokasi:</span> {reviewing.city}{reviewing.province ? `, ${reviewing.province}` : ""}</p>
                {reviewing.message && (
                  <p className="col-span-2 text-muted-foreground italic">Pesan: “{reviewing.message}”</p>
                )}
                <p className="col-span-2 text-[11px] text-muted-foreground">Diterima: {formatDateTime(reviewing.createdAt)}</p>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-gold/10 border border-gold/25 p-3 text-xs">
                <Icon name="info" className="h-4 w-4 shrink-0 text-gold-deep mt-0.5" aria-hidden />
                <p className="text-foreground/80">
                  Menyetujui akan otomatis menambahkan organisasi ini ke <b>direktori anggota publik</b> dengan status Terverifikasi.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review-note">Catatan Verifikator</Label>
                <Textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    if (noteError) setNoteError("");
                  }}
                  placeholder="Opsional saat menyetujui — wajib saat menolak (menjelaskan alasan kepada pencalar)."
                  rows={3}
                />
                {noteError && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <Icon name="alert-triangle" className="h-3.5 w-3.5" aria-hidden />
                    {noteError}
                  </p>
                )}
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              disabled={processing === (reviewing?.id || "") + "reject"}
              onClick={() => submitReview("reject")}
            >
              {processing === (reviewing?.id || "") + "reject" ? (
                <Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Icon name="ban" className="h-4 w-4 mr-1.5" />
              )}
              Tolak
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-forest text-white"
              disabled={processing === (reviewing?.id || "") + "approve"}
              onClick={() => submitReview("approve")}
            >
              {processing === (reviewing?.id || "") + "approve" ? (
                <Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Icon name="check-circle-2" className="h-4 w-4 mr-1.5" />
              )}
              Setujui & Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan pendaftaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan pendaftaran {deleting?.orgName} akan dihapus permanen. Data anggota yang sudah disetujui tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="danger-solid" onClick={doDelete}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ================= PENGATURAN (custom) ================= */
const SETTING_GROUPS: { title: string; icon: string; keys: { key: string; label: string; multiline?: boolean }[] }[] = [
  {
    title: "Identitas Situs",
    icon: "sparkles",
    keys: [
      { key: "siteName", label: "Nama Situs" },
      { key: "tagline", label: "Tagline" },
      { key: "heroTitle", label: "Judul Hero" },
      { key: "heroSubtitle", label: "Subjudul Hero", multiline: true },
    ],
  },
  {
    title: "Visi & Misi",
    icon: "target",
    keys: [
      { key: "vision", label: "Visi", multiline: true },
      { key: "mission", label: "Misi", multiline: true },
    ],
  },
  {
    title: "Kontak & Alamat",
    icon: "phone",
    keys: [
      { key: "email", label: "Email" },
      { key: "phone", label: "Telepon" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "address", label: "Alamat", multiline: true },
      { key: "website", label: "Website" },
    ],
  },
  {
    title: "Media Sosial",
    icon: "globe",
    keys: [
      { key: "instagram", label: "Instagram URL" },
      { key: "facebook", label: "Facebook URL" },
      { key: "twitter", label: "Twitter / X URL" },
      { key: "youtube", label: "YouTube URL" },
    ],
  },
];

export function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<SiteSettings>("/api/settings").then(setSettings).catch(() => setSettings({}));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiSend("/api/settings", "PUT", settings);
      toast({ title: "Pengaturan tersimpan ✓", description: "Perubahan langsung tampil di situs publik." });
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!settings)
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-extrabold">Pengaturan Situs</h2>
          <p className="text-sm text-muted-foreground">
            Ubah identitas, visi-misi, kontak, dan media sosial portal MUHDIN.
          </p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="sm:ml-auto bg-gradient-to-r from-primary to-forest text-white"
        >
          {saving ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="save" className="h-4 w-4 mr-2" />}
          Simpan Semua
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {SETTING_GROUPS.map((g) => (
          <div key={g.title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                <Icon name={g.icon} className="h-4 w-4" />
              </div>
              {g.title}
            </h3>
            <div className="space-y-3.5">
              {g.keys.map((k) => (
                <div key={k.key} className="space-y-1">
                  <Label className="text-xs">{k.label}</Label>
                  {k.multiline ? (
                    <Textarea
                      value={settings[k.key] || ""}
                      onChange={(e) => setSettings({ ...settings, [k.key]: e.target.value })}
                      rows={3}
                      className="text-sm"
                    />
                  ) : (
                    <Input
                      value={settings[k.key] || ""}
                      onChange={(e) => setSettings({ ...settings, [k.key]: e.target.value })}
                      className="text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Keamanan akun + status server hosting */}
      <div className="mt-5 space-y-5">
        <AdminServerStatusCard />
        <AdminSecurityCard />
      </div>
    </div>
  );
}

/* ================= INTEGRASI NUSUK (custom) ================= */

const PERMIT_TYPE_LABELS: Record<string, string> = {
  VISA: "Visa Authorization",
  HANDLING: "Layanan Handling",
  MUTAWIF: "Mutawif",
  HOTEL: "Hotel",
  TRANSPORT: "Transportasi",
  RAUDAH: "Raudah Card",
};
const PERMIT_TYPE_OPTS = Object.entries(PERMIT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const PERMIT_STATUS_META: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Aktif", cls: "bg-primary/10 text-primary border-primary/30" },
  PENDING: { label: "Menunggu", cls: "bg-gold/15 text-gold-deep border-gold/40" },
  EXPIRED: { label: "Kedaluwarsa", cls: "bg-muted text-muted-foreground border-transparent" },
  REJECTED: { label: "Ditolak", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};
const PERMIT_STATUS_OPTS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "PENDING", label: "Menunggu" },
  { value: "EXPIRED", label: "Kedaluwarsa" },
  { value: "REJECTED", label: "Ditolak" },
];

const LOG_TYPE_META: Record<string, { label: string; icon: string }> = {
  FULL_SYNC: { label: "Sinkron Penuh", icon: "refresh" },
  WEBHOOK: { label: "Webhook", icon: "webhook" },
  CONNECTION: { label: "Koneksi", icon: "plug" },
};

export function AdminNusuk() {
  const { toast } = useToast();

  const [conn, setConn] = useState<NusukConnection | null>(null);
  const [publicData, setPublicData] = useState<NusukPublicData | null>(null);
  const [logs, setLogs] = useState<NusukSyncLog[] | null>(null);
  const [permits, setPermits] = useState<NusukPermit[] | null>(null);
  const [permitsLoading, setPermitsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  const [selectedEnv, setSelectedEnv] = useState("SANDBOX");
  const [connecting, setConnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<NusukSyncResult | null>(null);
  const [rotating, setRotating] = useState(false);
  const [testing, setTesting] = useState(false);

  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [revealSecret, setRevealSecret] = useState<string | null>(null);

  const filtersRef = useRef({ page, statusF, typeF, q });
  filtersRef.current = { page, statusF, typeF, q };
  const credRef = useRef<{ apiKey?: string; webhookSecret?: string }>({});
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipPermitsOnce = useRef(true);

  const loadPermits = useCallback(async () => {
    const f = filtersRef.current;
    const params = new URLSearchParams({ page: String(f.page), pageSize: "8" });
    if (f.statusF !== "all") params.set("status", f.statusF);
    if (f.typeF !== "all") params.set("type", f.typeF);
    if (f.q) params.set("q", f.q);
    setPermitsLoading(true);
    try {
      const d = await apiGet<{ permits: NusukPermit[]; total: number; page: number; pages: number }>(`/api/nusuk/permits?${params.toString()}`);
      setPermits(d.permits);
      setTotal(d.total);
      setPages(Math.max(1, d.pages));
      setPage(d.page);
    } catch {
      setPermits([]);
      setTotal(0);
      setPages(1);
    } finally {
      setPermitsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    apiGet<{ connection: NusukConnection }>("/api/nusuk/connection").then((d) => setConn(d.connection)).catch(() => setConn(null));
    apiGet<NusukPublicData>("/api/nusuk/public").then(setPublicData).catch(() => setPublicData(null));
    apiGet<{ logs: NusukSyncLog[] }>("/api/nusuk/logs?limit=20").then((d) => setLogs(d.logs)).catch(() => setLogs([]));
    loadPermits();
  }, [loadPermits]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Muat ulang izin saat filter/pagination berubah (pemuatan awal sudah ditangani refresh()).
  useEffect(() => {
    if (skipPermitsOnce.current) {
      skipPermitsOnce.current = false;
      return;
    }
    loadPermits();
  }, [loadPermits, page, statusF, typeF, q]);

  // Debounce pencarian 400ms.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQ(qInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
  }, []);

  const applySearchNow = () => {
    setPage(1);
    setQ(qInput.trim());
  };

  const maskAgainSoon = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => {
      setRevealKey(null);
      setRevealSecret(null);
    }, 10000);
  };

  const revealCredential = async (field: "apiKey" | "webhookSecret") => {
    const revealed = field === "apiKey" ? revealKey : revealSecret;
    if (revealed) {
      if (field === "apiKey") setRevealKey(null);
      else setRevealSecret(null);
      return;
    }
    try {
      const d = await apiGet<{ connection: NusukConnection }>("/api/nusuk/connection?reveal=1");
      credRef.current = { apiKey: d.connection.apiKey, webhookSecret: d.connection.webhookSecret };
      const value = d.connection[field];
      if (!value) throw new Error("Kredensial belum tersedia — hubungkan Nusuk terlebih dahulu.");
      if (field === "apiKey") setRevealKey(value);
      else setRevealSecret(value);
      maskAgainSoon();
    } catch (e) {
      toast({ title: "Gagal menampilkan kredensial", description: (e as Error).message, variant: "destructive" });
    }
  };

  const copyCredential = async (field: "apiKey" | "webhookSecret") => {
    try {
      let value = field === "apiKey" ? revealKey : revealSecret;
      if (!value) value = credRef.current[field] ?? null;
      if (!value) {
        const d = await apiGet<{ connection: NusukConnection }>("/api/nusuk/connection?reveal=1");
        credRef.current = { apiKey: d.connection.apiKey, webhookSecret: d.connection.webhookSecret };
        value = d.connection[field] ?? null;
      }
      if (!value) throw new Error("Kredensial belum tersedia — hubungkan Nusuk terlebih dahulu.");
      await navigator.clipboard.writeText(value);
      toast({ title: field === "apiKey" ? "API key disalin ✓" : "Webhook secret disalin ✓", description: "Nilai lengkap kini ada di clipboard Anda." });
    } catch (e) {
      toast({ title: "Gagal menyalin", description: (e as Error).message, variant: "destructive" });
    }
  };

  const connect = async () => {
    setConnecting(true);
    try {
      const d = await apiSend<{ connection?: NusukConnection }>("/api/nusuk/connection", "POST", { environment: selectedEnv });
      toast({ title: "Terhubung ke Nusuk ✓", description: `Lingkungan ${selectedEnv} kini aktif.` });
      if (d.connection) setConn({ ...d.connection, apiKeyMasked: d.connection.apiKeyMasked ?? conn?.apiKeyMasked });
      refresh();
    } catch (e) {
      toast({ title: "Gagal terhubung", description: (e as Error).message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!confirmDisconnect) {
      setConfirmDisconnect(true);
      setTimeout(() => setConfirmDisconnect(false), 3000);
      return;
    }
    setConfirmDisconnect(false);
    setConnecting(true);
    try {
      await apiSend("/api/nusuk/connection", "DELETE");
      toast({ title: "Koneksi diputus", description: "Sinkronisasi data dengan Nusuk dihentikan sementara." });
      setSyncResult(null);
      refresh();
    } catch (e) {
      toast({ title: "Gagal memutus koneksi", description: (e as Error).message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const toggleAutoSync = async (v: boolean) => {
    if (!conn) return;
    setConn({ ...conn, autoSync: v });
    try {
      await apiSend("/api/nusuk/connection", "PUT", { autoSync: v });
      toast({
        title: v ? "Sinkronisasi otomatis aktif ✓" : "Sinkronisasi otomatis dimatikan",
        description: v ? "Perubahan izin dari Nusuk akan ditarik berkala." : "Sinkronisasi hanya berjalan saat dipicu manual.",
      });
    } catch (e) {
      toast({ title: "Gagal mengubah pengaturan", description: (e as Error).message, variant: "destructive" });
      refresh();
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      // Backend mengembalikan { summary, logId, message } — normalisasi agar toleran terhadap bentuk flat.
      const res = await apiSend<{
        summary?: Partial<NusukSyncResult>;
        logId?: string;
        status?: string;
        message?: string;
        created?: number;
        updated?: number;
        expired?: number;
        skipped?: number;
        recordsAffected?: number;
        durationMs?: number;
      }>("/api/nusuk/sync", "POST");
      const s = res.summary ?? res;
      setSyncResult({
        logId: res.logId ?? "",
        status: res.status ?? "SUCCESS",
        message: res.message ?? "",
        created: s.created ?? 0,
        updated: s.updated ?? 0,
        expired: s.expired ?? 0,
        skipped: s.skipped ?? 0,
        recordsAffected: s.recordsAffected ?? 0,
        durationMs: s.durationMs ?? 0,
      });
      toast({ title: "Sinkronisasi selesai ✓", description: res.message || "Data izin jamaah diperbarui dari Nusuk." });
      refresh();
    } catch (e) {
      toast({ title: "Sinkronisasi gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const rotate = async () => {
    setRotating(true);
    try {
      const res = await apiSend<{ message?: string }>("/api/nusuk/rotate", "POST");
      setRevealKey(null);
      setRevealSecret(null);
      credRef.current = {};
      toast({ title: "Kredensial dirotasi ✓", description: res.message || "API key & webhook secret baru telah diterbitkan. Perbarui konfigurasi mitra." });
      refresh();
    } catch (e) {
      toast({ title: "Gagal rotasi kredensial", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRotating(false);
    }
  };

  const testWebhook = async () => {
    setTesting(true);
    try {
      const d = await apiGet<{ connection: NusukConnection }>("/api/nusuk/connection?reveal=1");
      const secret = d.connection.webhookSecret;
      if (!secret) throw new Error("Webhook secret belum tersedia.");
      credRef.current = { apiKey: d.connection.apiKey, webhookSecret: secret };
      let permitNo = permits && permits.length > 0 ? permits[0].permitNo : undefined;
      if (!permitNo) {
        const p = await apiGet<{ permits: NusukPermit[] }>("/api/nusuk/permits?page=1&pageSize=1");
        permitNo = p.permits[0]?.permitNo;
      }
      if (!permitNo) throw new Error("Belum ada izin terdaftar untuk dipakai sebagai sampel event — jalankan sinkronisasi dahulu.");
      const res = await fetch(withPort("/api/nusuk/webhook"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Nusuk-Signature": secret },
        body: JSON.stringify({ permitNo, event: "PERMIT.RENEWED", note: "Uji pipeline dari CMS" }),
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast({ title: "Event uji diterima ✓", description: `Status izin kini ${data.status || res.status}${data.message ? ` — ${data.message}` : ""}` });
      refresh();
    } catch (e) {
      toast({ title: "Simulasi webhook gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const connected = conn?.status === "CONNECTED";
  const metrics = publicData?.metrics ?? null;

  if (!conn && !publicData && !logs) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
              <Icon name="satellite" className="h-5 w-5" />
            </span>
            Integrasi Nusuk
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Jembatan data resmi MUHDIN ↔ Kementerian Hajj &amp; Umrah KSA
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Badge
            variant="outline"
            className={conn?.environment === "PRODUCTION" ? "border-gold/50 bg-gold/15 text-gold-deep" : "text-muted-foreground"}
          >
            <Icon name="globe" className="h-3 w-3 mr-1" />
            {conn?.environment || "—"}
          </Badge>
          <Badge className={connected ? "bg-primary text-white border-transparent" : "bg-muted text-muted-foreground border-transparent"}>
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${connected ? "bg-white" : "bg-muted-foreground/60"}`} />
            {connected ? "Terhubung" : "Terputus"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ===== Card A — Status Koneksi ===== */}
        <section aria-label="Status Koneksi" className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
              <Icon name="wifi" className="h-4 w-4" />
            </span>
            Status Koneksi
          </h3>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? "bg-primary" : "bg-muted-foreground/40"}`} />
              </span>
              <p className="text-sm font-bold">{connected ? "Terhubung dengan Nusuk" : "Belum terhubung"}</p>
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Pilih lingkungan Nusuk">
              {(["SANDBOX", "PRODUCTION"] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setSelectedEnv(env)}
                  className={`rounded-lg px-3 h-8 text-[11px] font-bold tracking-wide transition-all ${
                    selectedEnv === env
                      ? "bg-primary text-white shadow-sm"
                      : "border border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={connect}
              disabled={connecting || (connected && selectedEnv === conn?.environment)}
              className="flex-1 min-w-40 h-9 bg-gradient-to-r from-primary to-forest text-white"
            >
              {connecting ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="plug" className="h-4 w-4 mr-2" />}
              Hubungkan Nusuk
            </Button>
            <Button
              variant="outline"
              disabled={connecting || !connected}
              onClick={disconnect}
              className={`h-9 ${confirmDisconnect ? "border-destructive bg-destructive/10 text-destructive" : "text-destructive border-destructive/40 hover:bg-destructive/10"}`}
            >
              <Icon name="cable" className="h-4 w-4 mr-2" />
              {confirmDisconnect ? "Klik lagi untuk konfirmasi" : "Putuskan"}
            </Button>
          </div>
          {connected && selectedEnv !== conn?.environment && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="info" className="h-3.5 w-3.5 text-gold-deep shrink-0" />
              Klik “Hubungkan Nusuk” untuk berpindah ke lingkungan {selectedEnv}.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Sinkronisasi Otomatis</p>
              <p className="text-xs text-muted-foreground">Tarik perubahan izin dari Nusuk secara berkala.</p>
            </div>
            <Switch checked={!!conn?.autoSync} onCheckedChange={toggleAutoSync} disabled={!conn} aria-label="Sinkronisasi otomatis" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sinkron terakhir</p>
              <p className="mt-1 text-sm font-bold">{timeAgo(conn?.lastSyncAt)}</p>
              <p className="text-[11px] text-muted-foreground">{conn?.lastSyncAt ? formatDateTime(conn.lastSyncAt) : "—"}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total sinkronisasi</p>
              <p className="mt-1 text-sm font-bold">{(conn?.totalSyncs ?? 0).toLocaleString("id-ID")}×</p>
              <p className="text-[11px] text-muted-foreground">sejak koneksi pertama</p>
            </div>
          </div>
        </section>

        {/* ===== Card B — Kredensial API & Webhook ===== */}
        <section aria-label="Kredensial API dan Webhook" className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <span className="h-8 w-8 rounded-lg bg-gold/15 grid place-items-center text-gold-deep shrink-0">
              <Icon name="keyround" className="h-4 w-4" />
            </span>
            Kredensial API &amp; Webhook
          </h3>

          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">API Key</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => revealCredential("apiKey")} aria-label="Tampilkan / sembunyikan API key">
                  <Icon name="eye" className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyCredential("apiKey")} aria-label="Salin API key">
                  <Icon name="braces" className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-1 font-mono text-xs break-all">{revealKey || conn?.apiKeyMasked || maskKey(credRef.current.apiKey || "")}</p>
            {revealKey && <p className="mt-1 text-[10px] text-gold-deep">Disembunyikan otomatis dalam 10 detik.</p>}
          </div>

          <div className="mt-3 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Webhook Secret</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => revealCredential("webhookSecret")} aria-label="Tampilkan / sembunyikan webhook secret">
                  <Icon name="eye" className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyCredential("webhookSecret")} aria-label="Salin webhook secret">
                  <Icon name="braces" className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-1 font-mono text-xs break-all">{revealSecret || maskKey(credRef.current.webhookSecret || "••••••••••••••••")}</p>
            {revealSecret && <p className="mt-1 text-[10px] text-gold-deep">Disembunyikan otomatis dalam 10 detik.</p>}
          </div>

          <div className="mt-3 rounded-xl border border-dashed p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Endpoint Webhook Masuk</p>
            <p className="mt-1.5 font-mono text-xs font-bold text-primary">POST /api/nusuk/webhook</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground break-all">X-Nusuk-Signature: &lt;webhook-secret&gt;</p>
          </div>

          <Button
            variant="outline"
            onClick={rotate}
            disabled={rotating}
            className="mt-4 w-full h-9 border-gold/50 text-gold-deep hover:bg-gold/10"
          >
            {rotating ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="keyround" className="h-4 w-4 mr-2" />}
            Rotasi Kredensial
          </Button>
        </section>

        {/* ===== Card C — Sinkronisasi Manual ===== */}
        <section aria-label="Sinkronisasi Manual" className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 mb-1">
            <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
              <Icon name="database-zap" className="h-4 w-4" />
            </span>
            Sinkronisasi Manual
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Tarik ulang seluruh izin jamaah dari portal Nusuk — proses aman dan idempoten.
          </p>
          <Button
            onClick={runSync}
            disabled={syncing || !connected}
            className="w-full h-12 text-base bg-gradient-to-r from-primary to-forest text-white shadow-lg"
          >
            {syncing ? <Icon name="loader-2" className="h-5 w-5 mr-2 animate-spin" /> : <Icon name="refresh" className="h-5 w-5 mr-2" />}
            {syncing ? "Menyinkronkan…" : "Sinkronkan Sekarang"}
          </Button>
          {!connected && (
            <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
              <Icon name="info" className="h-3.5 w-3.5 text-gold-deep shrink-0 mt-0.5" />
              Hubungkan Nusuk terlebih dahulu pada kartu Status Koneksi untuk menjalankan sinkronisasi.
            </p>
          )}
          {syncResult && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Hasil sinkronisasi terakhir</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 border border-primary/30 text-primary px-3 py-1 text-xs font-bold">+{syncResult.created} baru</span>
                <span className="rounded-full bg-gold/15 border border-gold/40 text-gold-deep px-3 py-1 text-xs font-bold">{syncResult.updated} diperbarui</span>
                <span className="rounded-full bg-muted border border-border text-muted-foreground px-3 py-1 text-xs font-bold">{syncResult.expired} kedaluwarsa</span>
                <span className="rounded-full bg-muted border border-border text-muted-foreground px-3 py-1 text-xs font-bold">{syncResult.skipped} dilewati</span>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-mono font-bold">{syncResult.durationMs}ms</span>
              </div>
            </div>
          )}
        </section>

        {/* ===== Card D — Metrik Izin ===== */}
        <section aria-label="Metrik Izin" className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <span className="h-8 w-8 rounded-lg bg-gold/15 grid place-items-center text-gold-deep shrink-0">
              <Icon name="activity" className="h-4 w-4" />
            </span>
            Metrik Izin
          </h3>
          {metrics ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { label: "Total", value: metrics.permitsTotal, cls: "text-foreground" },
                  { label: "Aktif", value: metrics.permitsActive, cls: "text-primary" },
                  { label: "Pending", value: metrics.permitsPending, cls: "text-gold-deep" },
                  { label: "Kedaluwarsa", value: metrics.permitsExpired, cls: "text-muted-foreground" },
                  { label: "Ditolak", value: metrics.permitsRejected, cls: "text-destructive" },
                  { label: "Anggota Tersinkron", value: metrics.membersConnected, cls: "text-forest" },
                ].map((t) => (
                  <div key={t.label} className="rounded-xl border bg-muted/30 p-3 text-center">
                    <p className={`text-xl font-extrabold ${t.cls}`}>{t.value.toLocaleString("id-ID")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 border-t pt-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <Icon name="shield-check" className="h-3.5 w-3.5 text-primary" />
                  Tingkat sukses <b>{metrics.successRate}%</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="timer" className="h-3.5 w-3.5 text-gold-deep" />
                  Durasi rata-rata <b>{metrics.avgDurationMs}ms</b>
                </span>
              </div>
            </>
          ) : (
            <Skeleton className="h-44 rounded-xl" />
          )}
        </section>
      </div>

      {/* ===== Card E — Registri Izin ===== */}
      <section aria-label="Registri Izin" className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-4">
          <h3 className="font-bold flex items-center gap-2 shrink-0">
            <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
              <Icon name="radar" className="h-4 w-4" />
            </span>
            Registri Izin
          </h3>
          <div className="flex flex-wrap gap-2 xl:ml-auto">
            <Select value={statusF} onValueChange={(v) => { setStatusF(v); setPage(1); }}>
              <SelectTrigger className="w-[150px] h-9 text-xs" aria-label="Filter status izin">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {PERMIT_STATUS_OPTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeF} onValueChange={(v) => { setTypeF(v); setPage(1); }}>
              <SelectTrigger className="w-[170px] h-9 text-xs" aria-label="Filter jenis izin">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {PERMIT_TYPE_OPTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applySearchNow(); }}
                placeholder="Cari izin / pemegang / anggota…"
                className="pl-9 h-9 text-xs w-full sm:w-56"
                aria-label="Cari izin"
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={refresh} aria-label="Muat ulang registri izin">
              <Icon name="refresh" className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin rounded-xl border" aria-busy={permitsLoading}>
          <table className="w-full text-sm min-w-[760px]">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b">
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-semibold">Nomor Izin</th>
                <th className="px-3 py-2.5 font-semibold">Jenis</th>
                <th className="px-3 py-2.5 font-semibold">Pemegang</th>
                <th className="px-3 py-2.5 font-semibold hidden md:table-cell">Anggota</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold hidden lg:table-cell">Berlaku Hingga</th>
                <th className="px-3 py-2.5 font-semibold hidden lg:table-cell">Sinkron</th>
              </tr>
            </thead>
            <tbody className={permitsLoading ? "opacity-50 transition-opacity" : "transition-opacity"}>
              {permits && permits.length > 0
                ? permits.map((p) => {
                    const st = PERMIT_STATUS_META[p.status] || { label: p.status, cls: "bg-muted text-muted-foreground border-transparent" };
                    return (
                      <tr key={p.id} className="border-t last:border-b-0 hover:bg-primary/5 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold whitespace-nowrap">{p.permitNo}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="secondary" className="text-[10px]">{PERMIT_TYPE_LABELS[p.type] || p.type}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium max-w-[10rem] truncate">{p.holderName}</p>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell">
                          {p.member ? (
                            <div className="max-w-[12rem]">
                              <p className="text-xs font-semibold truncate">{p.member.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{p.member.city} · {p.member.type}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={`text-[10px] font-bold ${st.cls}`}>{st.label}</Badge>
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell text-xs whitespace-nowrap">{formatDate(p.expiresAt)}</td>
                        <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">{timeAgo(p.syncedAt)}</td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
          {permits === null && (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          )}
          {permits && permits.length === 0 && !permitsLoading && (
            <div className="py-14 text-center">
              <Icon name="radar" className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada izin cocok filter</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Halaman {page}/{pages} · {total.toLocaleString("id-ID")} izin
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={page <= 1 || permitsLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <Icon name="chevron-right" className="h-4 w-4 mr-1 rotate-180" /> Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={page >= pages || permitsLoading}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              Berikutnya <Icon name="chevron-right" className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ===== Card F — Log Sinkronisasi ===== */}
        <section aria-label="Log Sinkronisasi" className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
              <Icon name="terminal" className="h-4 w-4" />
            </span>
            Log Sinkronisasi
          </h3>
          {!logs ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center">
              <Icon name="terminal" className="h-8 w-8 mx-auto text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">Belum ada aktivitas sinkronisasi.</p>
            </div>
          ) : (
            <div className="relative max-h-80 overflow-y-auto scrollbar-thin pr-1">
              <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" aria-hidden />
              <ul className="space-y-3">
                {logs.map((l) => {
                  const failed = l.status === "FAILED";
                  const meta = LOG_TYPE_META[l.type] || { label: l.type, icon: "activity" };
                  return (
                    <li key={l.id} className={`relative flex items-start gap-3 rounded-xl p-2.5 ${failed ? "bg-destructive/5 border border-destructive/20" : ""}`}>
                      <div className={`relative z-10 h-8 w-8 rounded-lg grid place-items-center shrink-0 border bg-card ${failed ? "text-destructive border-destructive/30" : "text-primary border-primary/30"}`}>
                        <Icon name={meta.icon} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{l.message}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-semibold">{meta.label}</span>
                          <span>· {l.recordsAffected} rekaman</span>
                          <span>· {l.durationMs}ms</span>
                          <span>· {timeAgo(l.createdAt)}</span>
                          {failed && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-destructive/40 text-destructive">GAGAL</Badge>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* ===== Card G — Simulasi Webhook ===== */}
        <section aria-label="Simulasi Webhook" className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 mb-1">
            <span className="h-8 w-8 rounded-lg bg-gold/15 grid place-items-center text-gold-deep shrink-0">
              <Icon name="webhook" className="h-4 w-4" />
            </span>
            Simulasi Webhook
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Uji pipeline end-to-end tanpa menunggu event nyata: sistem menandatangani event{" "}
            <span className="font-mono font-semibold text-foreground">PERMIT.RENEWED</span> dengan webhook secret aktif,
            lalu mengirimkannya ke <span className="font-mono font-semibold text-foreground">/api/nusuk/webhook</span>.
          </p>
          {connected ? (
            <>
              <Button
                onClick={testWebhook}
                disabled={testing}
                variant="outline"
                className="w-full h-11 border-gold/50 text-gold-deep hover:bg-gold/10"
              >
                {testing ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="radio-tower" className="h-4 w-4 mr-2" />}
                Kirim Event Uji (PERMIT.RENEWED)
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Izin sampel:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {permits && permits.length > 0 ? permits[0].permitNo : "menarik dari halaman pertama…"}
                </span>
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-3.5 text-xs flex items-start gap-2">
              <Icon name="info" className="h-4 w-4 text-gold-deep shrink-0 mt-0.5" />
              <p>
                Koneksi Nusuk belum aktif. Hubungkan terlebih dahulu pada kartu <b>Status Koneksi</b> untuk menguji pipeline webhook.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ============ STATUS SERVER HOSTING & KEAMANAN AKUN (Deployment) ============ */

type HealthPayload = {
  ok: boolean;
  service: string;
  checks: { database: { ok: boolean; latencyMs: number; error: string | null } };
  runtime: { node: string; nodeEnv: string; platform: string; uptimeSec: number; memoryMb: number };
  timestamp: string;
};

function formatUptime(sec: number) {
  if (sec < 60) return `${sec} detik`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} menit`;
  const h = Math.floor(m / 60);
  return `${h} jam ${m % 60} mnt`;
}

/** Kartu Status Server — membaca /api/health untuk verifikasi hosting. */
export function AdminServerStatusCard() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<HealthPayload>("/api/health")
      .then((d) => {
        if (!cancelled) setHealth(d);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const dbOk = health?.checks.database.ok;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
          <Icon name="server" className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold leading-tight">Status Server (Hosting)</h3>
          <p className="text-xs text-muted-foreground">
            Healthcheck <code className="font-mono">/api/health</code> — dipakai saat verifikasi
            deployment di shared hosting.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto shrink-0"
          onClick={() => {
            setLoading(true);
            setAttempt((a) => a + 1);
          }}
          aria-label="Muat ulang status server"
        >
          <Icon name={loading ? "loader-2" : "refresh"} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline sm:ml-2">Cek Ulang</span>
        </Button>
      </div>

      {loading && !health ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !health ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <Icon name="alert-triangle" className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Server tidak terjangkau / health gagal. Jika baru selesai upload, lihat bagian
            <strong> Troubleshooting</strong> pada <code className="font-mono">PANDUAN-SHARED-HOSTING.md</code>.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/30">
              <span className={`h-2 w-2 rounded-full ${dbOk ? "bg-primary animate-pulse" : "bg-destructive"}`} />
              {dbOk ? "Server & Database Berjalan" : "Database Bermasalah"}
            </span>
            <Badge variant="outline" className="text-xs font-mono">{health.runtime.nodeEnv}</Badge>
            {health.checks.database.error && (
              <span className="text-xs text-destructive font-mono truncate max-w-full">
                {health.checks.database.error}
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "cpu", label: "Node.js", value: health.runtime.node },
              { icon: "hard-drive", label: "Platform", value: health.runtime.platform },
              { icon: "database-zap", label: "Latensi DB", value: `${health.checks.database.latencyMs} ms` },
              { icon: "gauge", label: "RAM · Uptime", value: `${health.runtime.memoryMb} MB · ${formatUptime(health.runtime.uptimeSec)}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Icon name={s.icon} className="h-3.5 w-3.5" />
                  {s.label}
                </div>
                <div className="text-sm font-bold font-mono truncate" title={s.value}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Kartu Keamanan Akun — ganti password admin (wajib setelah go-live). */
export function AdminSecurityCard() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const weak = next.length > 0 && next.length < 8;
  const mismatch = confirmPw.length > 0 && next !== confirmPw;
  const canSubmit = !!current && next.length >= 8 && next === confirmPw && !saving;

  const strength = (() => {
    if (!next) return 0;
    let s = 0;
    if (next.length >= 8) s++;
    if (next.length >= 12) s++;
    if (/[A-Z]/.test(next) && /[a-z]/.test(next)) s++;
    if (/\d/.test(next) && /[^A-Za-z0-9]/.test(next)) s++;
    return s;
  })();
  const strengthMeta = [
    { label: "Sangat lemah", cls: "bg-destructive" },
    { label: "Lemah", cls: "bg-destructive" },
    { label: "Cukup", cls: "bg-gold" },
    { label: "Kuat", cls: "bg-primary" },
    { label: "Sangat kuat", cls: "bg-primary" },
  ][strength];

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await apiSend<{ ok: boolean; message: string }>("/api/auth/password", "PUT", {
        currentPassword: current,
        newPassword: next,
      });
      toast({ title: "Password diperbarui ✓", description: res.message });
      setCurrent("");
      setNext("");
      setConfirmPw("");
    } catch (e) {
      toast({ title: "Gagal mengganti password", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-1">
        <div className="h-9 w-9 rounded-lg bg-gold/15 grid place-items-center text-gold-deep shrink-0">
          <Icon name="keyround" className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold leading-tight">Keamanan Akun</h3>
          <p className="text-xs text-muted-foreground">
            Ganti password default <code className="font-mono">muhdin2026</code> segera setelah situs
            go-live di muhdin.web.id. Perangkat lain akan otomatis dikeluarkan.
          </p>
        </div>
      </div>

      <div className="grid gap-4 mt-4 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="pw-current" className="text-xs">Password Saat Ini</Label>
          <div className="relative">
            <Input
              id="pw-current"
              type={showPw ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Password yang sedang dipakai"
              className="text-sm pr-9"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
            >
              <Icon name={showPw ? "eye-off" : "eye"} className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pw-new" className="text-xs">Password Baru</Label>
          <Input
            id="pw-new"
            type={showPw ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Minimal 8 karakter"
            className={`text-sm ${weak ? "border-destructive" : ""}`}
            autoComplete="new-password"
          />
          {next && (
            <div className="flex items-center gap-2" aria-live="polite">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${strengthMeta.cls}`} style={{ width: `${(strength / 4) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{strengthMeta.label}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm" className="text-xs">Konfirmasi Password Baru</Label>
          <Input
            id="pw-confirm"
            type={showPw ? "text" : "password"}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Ulangi password baru"
            className={`text-sm ${mismatch ? "border-destructive" : ""}`}
            autoComplete="new-password"
          />
          {mismatch && <p className="text-[11px] text-destructive">Konfirmasi tidak sama dengan password baru.</p>}
          {weak && <p className="text-[11px] text-destructive">Minimal 8 karakter.</p>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
        <Button
          onClick={submit}
          disabled={!canSubmit}
          className="bg-gradient-to-r from-primary to-forest text-white"
        >
          {saving ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="shield-check" className="h-4 w-4 mr-2" />}
          Perbarui Password
        </Button>
        <p className="text-xs text-muted-foreground sm:ml-1">
          Gunakan kombinasi huruf besar-kecil, angka, dan simbol untuk kekuatan maksimal.
        </p>
      </div>
    </div>
  );
}

/* ================= PENERJEMAH CERDAS (custom) ================= */

type TranslatorLocale = "en" | "ar";

type TranslatorEntityStatus = {
  entity: string;
  total: number;
  translated: Record<string, number>;
};

type TranslatorJobState = {
  running: boolean;
  locale: TranslatorLocale | null;
  entity: string | null;
  entityIndex: number;
  entityTotal: number;
  entityDone: number;
  done: number;
  total: number;
  translated: number;
  failed: number;
  errors: string[];
  startedAt: string | null;
  finishedAt: string | null;
};

type TranslatorStatusPayload = {
  entities: TranslatorEntityStatus[];
  locales: string[];
  job: TranslatorJobState;
  entityNames: string[];
};

const TRANSLATOR_ENTITY_LABELS: Record<string, string> = {
  Article: "Berita & Artikel",
  Tutorial: "Tutorial",
  Ecosystem: "13 Ekosistem",
  JourneyStep: "Alur Perjalanan",
  Roadmap: "Roadmap 2026-2030",
  Member: "Direktori Anggota",
  Faq: "FAQ",
  Testimonial: "Testimoni",
  Management: "Struktur Organisasi",
  SiteSetting: "Pengaturan Situs",
};

const TRANSLATOR_LOCALES: { code: TranslatorLocale; name: string; flag: string; aria: string }[] = [
  { code: "en", name: "English", flag: "🇬🇧", aria: "Inggris" },
  { code: "ar", name: "العربية", flag: "🇸🇦", aria: "Arab" },
];

/** Persen cakupan 0-100 (total 0 dianggap lengkap). */
function translatorPct(translated: number, total: number) {
  if (total <= 0) return 100;
  return Math.min(100, Math.round((translated / total) * 100));
}

/** Bar mini cakupan pada tabel entitas. */
function TranslatorMiniBar({ pct, tone, countLabel, ariaLabel }: { pct: number; tone: "en" | "ar"; countLabel: string; ariaLabel: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[9.5rem]">
      <div
        className="h-1.5 w-16 lg:w-20 rounded-full bg-muted overflow-hidden shrink-0"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={ariaLabel}
      >
        <div className={`h-full rounded-full transition-all ${tone === "en" ? "bg-primary" : "bg-gold"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">{countLabel}</span>
    </div>
  );
}

/** Modul CMS "Penerjemah Cerdas" — kelola terjemahan konten database (EN/AR) oleh AI. */
export function AdminTranslator() {
  const { toast } = useToast();
  const [status, setStatus] = useState<TranslatorStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState<TranslatorLocale | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const statusRef = useRef<TranslatorStatusPayload | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const d = await apiGet<TranslatorStatusPayload>("/api/translations");
      const prev = statusRef.current;
      statusRef.current = d;
      setStatus(d);
      setLoadError("");
      if (prev?.job.running && !d.job.running && d.job.finishedAt) {
        toast({
          title: "Terjemahan selesai ✓",
          description: `${d.job.translated.toLocaleString("id-ID")} field diterjemahkan ke ${d.job.locale === "ar" ? "العربية" : "English"}${d.job.failed > 0 ? `, ${d.job.failed.toLocaleString("id-ID")} gagal` : ""} — cakupan situs publik kini diperbarui.`,
        });
      }
    } catch (e) {
      if (!statusRef.current) setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus, attempt]);

  const job = status?.job ?? null;
  const running = job?.running ?? false;

  // Polling progres job tiap 2 detik — interval dibersihkan saat unmount & berhenti otomatis saat running=false.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      void loadStatus();
    }, 2000);
    return () => clearInterval(t);
  }, [running, loadStatus]);

  // Transisi berjalan → selesai: muat sekali lagi agar cakupan & finishedAt terbaru tampil.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !running) void loadStatus();
    wasRunning.current = running;
  }, [running, loadStatus]);

  const refreshNow = async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  };

  const startTranslation = async (locale: TranslatorLocale, entities?: string[]) => {
    if (entities) setRowBusy(`${entities[0]}:${locale}`);
    else setStarting(locale);
    try {
      const res = await apiSend<{ started: boolean; job: TranslatorJobState; message?: string }>(
        "/api/translations",
        "POST",
        entities ? { locale, entities } : { locale }
      );
      if (res.started) {
        if (statusRef.current) {
          statusRef.current = { ...statusRef.current, job: res.job };
          setStatus(statusRef.current);
        }
        const target = entities
          ? TRANSLATOR_ENTITY_LABELS[entities[0]] || entities[0]
          : "seluruh entitas";
        toast({
          title: "Terjemahan dimulai ✓",
          description: `AI sedang menerjemahkan ${target} ke ${locale === "ar" ? "العربية" : "English"} — pantau panel progres di bawah tabel entitas.`,
        });
        await loadStatus();
      } else {
        toast({ title: "Job lain sedang berjalan", description: res.message || "Tunggu job yang berjalan selesai sebelum memulai yang baru." });
      }
    } catch (e) {
      toast({ title: "Gagal memulai terjemahan", description: (e as Error).message, variant: "destructive" });
    } finally {
      setStarting(null);
      setRowBusy(null);
    }
  };

  const entities = status?.entities ?? [];
  const sumTotal = entities.reduce((a, e) => a + (e.total || 0), 0);
  const sumFor = (loc: TranslatorLocale) => entities.reduce((a, e) => a + (e.translated?.[loc] ?? 0), 0);

  // Progres total job = entitas selesai + fraksi entitas berjalan (done/total direset per entitas oleh backend).
  const jobOverall = job
    ? job.running
      ? job.entityTotal > 0
        ? Math.max(0, Math.min(100, Math.round((((job.entityIndex - 1) + (job.total > 0 ? job.done / job.total : 0)) / job.entityTotal) * 100)))
        : 0
      : 100
    : 0;
  const jobErrors = job?.errors ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-6">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
              <Icon name="languages" className="h-5 w-5" />
            </span>
            Penerjemah Cerdas
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            AI menerjemahkan konten database ke English &amp; العربية — konten yang belum diterjemahkan
            otomatis tampil dalam Bahasa Indonesia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto sm:mt-1.5">
          <Badge variant="outline" className="text-muted-foreground">
            <Icon name="sparkles" className="h-3 w-3 mr-1 text-gold-deep" />
            AI Engine
          </Badge>
          {running && (
            <Badge className="bg-primary text-white border-transparent">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Job berjalan
            </Badge>
          )}
        </div>
      </div>

      {loadError && !status ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <Icon name="alert-triangle" className="h-8 w-8 mx-auto text-destructive" />
          <p className="mt-2 text-sm text-destructive font-medium">{loadError || "Gagal memuat status terjemahan."}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setLoading(true);
              setLoadError("");
              setAttempt((a) => a + 1);
            }}
          >
            <Icon name="refresh" className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      ) : !status ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Kartu ringkasan per locale */}
          <div className="grid gap-4 lg:grid-cols-2">
            {TRANSLATOR_LOCALES.map((l) => {
              const done = sumFor(l.code);
              const pct = translatorPct(done, sumTotal);
              const remaining = Math.max(0, sumTotal - done);
              return (
                <section key={l.code} aria-label={`Cakupan terjemahan ${l.name}`} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-xl bg-muted/60 grid place-items-center text-2xl shrink-0" aria-hidden>
                      {l.flag}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold leading-tight">{l.name}</h3>
                      <p className="text-xs text-muted-foreground">Locale <span className="font-mono font-semibold">{l.code}</span></p>
                    </div>
                    <p className={`ml-auto text-2xl font-extrabold ${l.code === "en" ? "text-primary" : "text-gold-deep"}`} aria-hidden>
                      {pct}%
                    </p>
                  </div>

                  <div
                    className="mt-4 h-2.5 rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-label={`Cakupan terjemahan ${l.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${l.code === "en" ? "bg-gradient-to-r from-primary to-forest" : "bg-gradient-to-r from-gold to-gold-deep"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    <b className="text-foreground">{done.toLocaleString("id-ID")}</b> dari {sumTotal.toLocaleString("id-ID")} field telah
                    diterjemahkan{remaining > 0 ? <> · sisa <b className="text-gold-deep">{remaining.toLocaleString("id-ID")}</b></> : " · lengkap ✓"}
                  </p>

                  <Button
                    onClick={() => void startTranslation(l.code)}
                    disabled={running || starting !== null}
                    aria-label={`Terjemahkan konten yang belum ada ke ${l.aria}`}
                    className={
                      l.code === "en"
                        ? "mt-4 w-full h-9 bg-gradient-to-r from-primary to-forest text-white"
                        : "mt-4 w-full h-9 border-gold/50 bg-gold/10 text-gold-deep hover:bg-gold/15 hover:text-gold-deep"
                    }
                    variant={l.code === "en" ? "default" : "outline"}
                  >
                    {starting === l.code
                      ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" />
                      : <Icon name="sparkles" className="h-4 w-4 mr-2" />}
                    Terjemahkan {l.name} — yang belum ada
                  </Button>
                </section>
              );
            })}
          </div>

          {/* Tabel cakupan per entitas */}
          <section aria-label="Cakupan per entitas" className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <h3 className="font-bold flex items-center gap-2 shrink-0">
                <span className="h-8 w-8 rounded-lg bg-gold/15 grid place-items-center text-gold-deep shrink-0">
                  <Icon name="boxes" className="h-4 w-4" />
                </span>
                Cakupan per Entitas
              </h3>
              <p className="text-xs text-muted-foreground sm:ml-auto">
                {entities.length.toLocaleString("id-ID")} entitas · {sumTotal.toLocaleString("id-ID")} field terjemahable
              </p>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin rounded-xl border" aria-busy={refreshing}>
              <table className="w-full text-sm min-w-[720px]">
                <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-semibold">Entitas</th>
                    <th className="px-3 py-2.5 font-semibold">Total Field</th>
                    <th className="px-3 py-2.5 font-semibold">Terjemahan EN</th>
                    <th className="px-3 py-2.5 font-semibold">Terjemahan AR</th>
                    <th className="px-3 py-2.5 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map((e) => {
                    const label = TRANSLATOR_ENTITY_LABELS[e.entity] || e.entity;
                    return (
                      <tr key={e.entity} className="border-t last:border-b-0 hover:bg-primary/5 transition-colors">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold">{label}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{e.entity}</p>
                        </td>
                        <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{e.total.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2.5">
                          <TranslatorMiniBar
                            pct={translatorPct(e.translated?.en ?? 0, e.total)}
                            tone="en"
                            countLabel={`${(e.translated?.en ?? 0).toLocaleString("id-ID")}/${e.total.toLocaleString("id-ID")}`}
                            ariaLabel={`Terjemahan English ${label}`}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <TranslatorMiniBar
                            pct={translatorPct(e.translated?.ar ?? 0, e.total)}
                            tone="ar"
                            countLabel={`${(e.translated?.ar ?? 0).toLocaleString("id-ID")}/${e.total.toLocaleString("id-ID")}`}
                            ariaLabel={`Terjemahan العربية ${label}`}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {TRANSLATOR_LOCALES.map((l) => {
                              const complete = e.total > 0 && (e.translated?.[l.code] ?? 0) >= e.total;
                              const busy = rowBusy === `${e.entity}:${l.code}`;
                              return (
                                <Button
                                  key={l.code}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={running || rowBusy !== null}
                                  onClick={() => void startTranslation(l.code, [e.entity])}
                                  aria-label={`Terjemahkan ${label} ke ${l.aria}`}
                                  title={complete ? "Semua field entitas ini sudah diterjemahkan" : `Antrekan terjemahan ${l.name} untuk ${label} (idempoten — hanya yang belum ada)`}
                                >
                                  {busy
                                    ? <Icon name="loader-2" className="h-3 w-3 mr-1 animate-spin" />
                                    : complete
                                      ? <Icon name="check-circle-2" className="h-3 w-3 mr-1 text-primary" />
                                      : null}
                                  Isi {l.code.toUpperCase()}
                                </Button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {entities.length === 0 && (
                <div className="py-14 text-center">
                  <Icon name="languages" className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">Belum ada konten yang dapat diterjemahkan.</p>
                </div>
              )}
            </div>
          </section>

          {/* Panel progres job */}
          {job && (job.running || job.finishedAt) && (
            <section aria-label="Progres job terjemahan" className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                  <Icon name={job.running ? "loader-2" : "check-circle-2"} className={`h-4 w-4 ${job.running ? "animate-spin" : ""}`} />
                </span>
                <h3 className="font-bold">Progres Terjemahan</h3>
                <Badge variant="outline" className={job.running ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground"}>
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${job.running ? "bg-primary animate-pulse" : "bg-muted-foreground/50"}`} />
                  {job.running ? "Berjalan" : "Selesai"}
                </Badge>
                {job.locale && (
                  <Badge variant="secondary" className="text-[10px]">
                    {job.locale === "ar" ? "العربية (ar)" : "English (en)"}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {job.running ? `Dimulai ${timeAgo(job.startedAt)}` : `Selesai ${timeAgo(job.finishedAt)}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto h-8"
                  onClick={() => void refreshNow()}
                  disabled={refreshing}
                  aria-label="Segarkan status job terjemahan"
                >
                  <Icon name={refreshing ? "loader-2" : "refresh"} className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="ml-1.5">Segarkan</span>
                </Button>
              </div>

              <div
                className="h-2.5 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-label="Progres total job terjemahan"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={jobOverall}
              >
                <div
                  className={`h-full rounded-full transition-all ${job.running ? "bg-gradient-to-r from-primary to-forest" : "bg-primary"}`}
                  style={{ width: `${jobOverall}%` }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs" aria-live="polite">
                <p className="font-medium">
                  {job.running
                    ? job.entity
                      ? <>Entitas <b>{job.entityIndex}/{job.entityTotal}</b> — {TRANSLATOR_ENTITY_LABELS[job.entity] || job.entity}</>
                      : "Menyiapkan antrean terjemahan…"
                    : "Semua entitas selesai diproses."}
                </p>
                {job.running && (
                  <p className="font-mono text-muted-foreground">
                    {job.done.toLocaleString("id-ID")}/{job.total.toLocaleString("id-ID")} item
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 border border-primary/30 text-primary px-3 py-1 text-xs font-bold">
                  {job.translated.toLocaleString("id-ID")} diterjemahkan
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold border ${job.failed > 0 ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-muted border-border text-muted-foreground"}`}>
                  {job.failed.toLocaleString("id-ID")} gagal
                </span>
                {jobErrors.length > 0 && (
                  <span className="rounded-full bg-destructive/10 border border-destructive/30 text-destructive px-3 py-1 text-xs font-bold">
                    {jobErrors.length.toLocaleString("id-ID")} pesan galat
                  </span>
                )}
              </div>

              <div className="mt-3 max-h-40 overflow-y-auto scrollbar-thin rounded-lg border bg-muted/30 p-3">
                {jobErrors.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">Tidak ada galat.</p>
                ) : (
                  <ul className="space-y-1 font-mono text-xs text-destructive">
                    {jobErrors.map((er, i) => (
                      <li key={i}>• {er}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* Catatan teknis */}
      <p className="mt-4 text-xs text-muted-foreground flex items-start gap-1.5">
        <Icon name="info" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gold-deep" />
        <span>
          Terjemahan disimpan di tabel <code className="font-mono">ContentTranslation</code> dan langsung dipakai
          situs publik (<code className="font-mono">?locale=en|ar</code>).
        </span>
      </p>
    </div>
  );
}
