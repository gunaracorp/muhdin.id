"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { MuhdinBrand, MuhdinLogo } from "@/components/site/logo";
import { Icon } from "@/components/site/icon";
import { ThemeSwitcher } from "@/components/site/theme-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import {
  AdminArticles, AdminEcosystems, AdminJourney, AdminRoadmap, AdminMembers,
  AdminTutorials, AdminFaqs, AdminTestimonials, AdminManagement,
  AdminMessages, AdminApplications, AdminNusuk, AdminSettings, AdminTranslator,
} from "@/components/admin/admin-sections";
import { AdminUsers } from "@/components/admin/admin-users";
import { AdminWhatsAppCard } from "@/components/admin/admin-whatsapp";
import { AdminEmailCard, AdminNotificationLog, AdminNotificationSetupChecklist } from "@/components/admin/admin-notifications";
import { AdminBell } from "@/components/admin/admin-bell";
import { AdminGallery } from "@/components/admin/admin-gallery";
import { AdminAgenda } from "@/components/admin/admin-agenda";
import { AdminResources } from "@/components/admin/admin-resources";
import { AdminComplaints } from "@/components/admin/admin-complaints";
import { AdminSubscribers } from "@/components/admin/admin-subscribers";
import { AdminAudit } from "@/components/admin/admin-audit";
import { AdminBranches } from "@/components/admin/admin-branches";
// v5.0 — Marketplace paket, forum jamaah, kartu jamaah digital
import { AdminPackages } from "@/components/admin/admin-packages";
import { AdminForum } from "@/components/admin/admin-forum";
import { AdminPilgrimCards } from "@/components/admin/admin-pilgrim-cards";
// v6.0 — Ekosistem hulu-hilir: Pusat Bisnis B2B + Operasi Jamaah
import { AdminBisnis } from "@/components/admin/admin-bisnis";
import { AdminCompliance } from "@/components/admin/admin-compliance";
// v12.2 — 99 Roadmap Upgrade
import { AdminRoadmapItems } from "@/components/admin/admin-roadmap-items";
// v12.3 «AMANAH» — Keamanan Akun (2FA TOTP)
import { AdminSecurity } from "@/components/admin/admin-security";
import { AdminPrivacyRequests } from "@/components/admin/admin-privacy";
import { AdminObservability } from "@/components/admin/admin-observability";
import { AdminGrowth } from "@/components/admin/admin-growth";
// v13.0 «GERBANG» — Dashboard Omzet (R-051) + Kampanye Musiman (R-089)
import { AdminOmzet } from "@/components/admin/admin-omzet";
import { AdminCampaigns } from "@/components/admin/admin-campaigns";
// v12.4 «LUNAS» — Pesanan & Invoice (checkout + payment gateway)
import { AdminOrders } from "@/components/admin/admin-orders";
import { AdminJamaahOps } from "@/components/admin/admin-jamaah-ops";
// v4.0 — AI Content Studio: redaksi berbantuan AI (topik → draf artikel).
import { AdminAiStudio } from "@/components/admin/admin-ai-studio";
// GABUNG v11 — Power Pack (Akademi/Booking/Benefit, Paspor & GPS, Tur 360°)
import { AdminAcademy, AdminBooking, AdminBenefits } from "@/components/admin/admin-membership";
import { AdminPassport } from "@/components/admin/admin-passport";
import { AdminTour } from "@/components/admin/admin-tour";
import { visibleSections, ROLE_LABELS } from "@/lib/roles";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const MENU = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "ai-studio", label: "AI Content Studio", icon: "sparkles" },
  { id: "nusuk", label: "Integrasi Nusuk", icon: "satellite" },
  { id: "articles", label: "Berita & Artikel", icon: "newspaper" },
  { id: "ecosystems", label: "13 Ekosistem", icon: "boxes" },
  { id: "journey", label: "Alur Perjalanan", icon: "workflow" },
  { id: "roadmap", label: "Roadmap 2026-2030", icon: "target" },
  { id: "members", label: "Direktori Anggota", icon: "grid-3x3" },
  { id: "applications", label: "Pendaftaran", icon: "user-plus" },
  { id: "packages", label: "Marketplace Paket", icon: "package" },
  { id: "bookings", label: "Booking Paket", icon: "clipboard-list" },
  // v12.4 «LUNAS» — Pesanan & Invoice
  { id: "orders", label: "Pesanan & Invoice", icon: "wallet" },
  // v13.0 «GERBANG» — Dashboard Omzet Manajemen (R-051)
  { id: "omzet", label: "Dashboard Omzet", icon: "bar-chart-3" },
  // v13.0 «GERBANG» — Kampanye Musiman (R-089)
  { id: "kampanye", label: "Kampanye Musiman", icon: "megaphone" },
  { id: "tutorials", label: "Tutorial", icon: "graduation-cap" },
  { id: "messages", label: "Pesan Masuk", icon: "inbox" },
  { id: "complaints", label: "Pengaduan", icon: "shield-alert" },
  { id: "forum", label: "Forum Jamaah", icon: "message-square" },
  { id: "cards", label: "Kartu Jamaah", icon: "qr-code" },
  { id: "bisnis", label: "Pusat Bisnis B2B", icon: "briefcase" },
  { id: "jamaahops", label: "Operasi Jamaah", icon: "clipboard-check" },
  // v12.1 — God-Mode Izin Compliance Checker
  { id: "compliance", label: "Compliance Checker", icon: "shield-check" },
  // v12.2 — 99 Roadmap Upgrade
  { id: "roadmap99", label: "Roadmap 99 Upgrade", icon: "map" },
  // v12.3 «AMANAH» — Keamanan Akun
  { id: "keamanan", label: "Keamanan Akun", icon: "fingerprint" },
  // v12.5 — Permintaan PDP (R-078)
  { id: "pdp", label: "Permintaan PDP", icon: "user-cog" },
  // v12.5 — Kesehatan Sistem (R-062)
  { id: "sistem", label: "Kesehatan Sistem", icon: "gauge" },
  // v12.5 — Broadcast WA & Skor Vendor (R-094/R-047)
  { id: "growth", label: "Broadcast & Vendor", icon: "radio-tower" },
  // GABUNG v11 — Power Pack Layanan Digital
  { id: "passport", label: "Paspor & GPS", icon: "wallet-cards" },
  { id: "academy", label: "Akademi & Sertifikat", icon: "graduation-cap" },
  { id: "booking", label: "Booking & Slot", icon: "calendar-check" },
  { id: "benefits", label: "Benefit & Poin KTA", icon: "gift" },
  { id: "tour", label: "Tur Virtual 360°", icon: "orbit" },
  { id: "subscribers", label: "Pelanggan Berita", icon: "mail" },
  { id: "faqs", label: "FAQ", icon: "help-circle" },
  { id: "testimonials", label: "Testimoni", icon: "quote" },
  { id: "management", label: "Struktur Organisasi", icon: "users" },
  { id: "branches", label: "Jaringan Daerah (DPD)", icon: "landmark" },
  { id: "settings", label: "Pengaturan Situs", icon: "settings" },
  { id: "translator", label: "Penerjemah Cerdas", icon: "languages" },
  { id: "gallery", label: "Galeri Kegiatan", icon: "instagram" },
  { id: "agenda", label: "Agenda Kegiatan", icon: "calendar" },
  { id: "resources", label: "Pusat Unduhan", icon: "download" },
  { id: "audit", label: "Log Aktivitas", icon: "activity" },
  { id: "users", label: "Kelola Admin", icon: "user-cog" },
];

export function AdminView() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const check = useCallback(() => {
    apiGet<{ user: User | null }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const logout = async () => {
    try {
      await apiSend("/api/auth/logout", "POST");
      setUser(null);
      toast({ title: "Berhasil keluar", description: "Sampai jumpa kembali!" });
    } catch {
      toast({ title: "Gagal keluar", variant: "destructive" });
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginForm onSuccess={check} />;

  const current = MENU.find((m) => m.id === section);
  // Task 15-c — gating menu sesuai peran (SUPER_ADMIN / ADMIN / EDITOR).
  const allowed = visibleSections(user.role);
  const menu = MENU.filter((m) => allowed.has(m.id));
  const activeSection = allowed.has(section) ? section : "dashboard";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b">
        <MuhdinBrand compact />
        <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-semibold">
          CMS Admin Panel
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-0.5" aria-label="Menu admin">
        {menu.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setSection(m.id);
              setSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeSection === m.id
                ? "bg-gradient-to-r from-primary to-forest text-white shadow-md"
                : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
            )}
          >
            <Icon name={m.icon} className="h-4 w-4 shrink-0" />
            {m.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-forest grid place-items-center text-white font-bold text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={logout}>
          <Icon name="logout" className="h-4 w-4 mr-2" /> Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 shrink-0 border-r bg-sidebar sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu Admin</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 glass border-b">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Buka menu admin">
              <Icon name="menu" className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon name={current?.icon || "layout-dashboard"} className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-extrabold text-lg truncate">{current?.label || "Dashboard"}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <AdminBell onSection={setSection} />
              <ThemeSwitcher variant="compact" />
              <Button variant="ghost" size="sm" onClick={() => navigate("beranda")} className="hidden sm:inline-flex text-primary">
                <Icon name="external-link" className="h-4 w-4 mr-1.5" />
                Lihat Situs
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {section === "dashboard" && <AdminDashboard onNavigate={setSection} />}
          {section === "nusuk" && <AdminNusuk />}
          {section === "articles" && <AdminArticles />}
          {section === "ecosystems" && <AdminEcosystems />}
          {section === "journey" && <AdminJourney />}
          {section === "roadmap" && <AdminRoadmap />}
          {section === "members" && <AdminMembers />}
          {section === "applications" && <AdminApplications />}
          {section === "packages" && <AdminPackages />}
          {section === "bookings" && <AdminPackages />}
          {section === "orders" && <AdminOrders />}
          {section === "forum" && <AdminForum />}
          {section === "cards" && <AdminPilgrimCards />}
          {section === "bisnis" && <AdminBisnis />}
          {section === "jamaahops" && <AdminJamaahOps />}
          {section === "compliance" && <AdminCompliance />}
          {section === "roadmap99" && <AdminRoadmapItems />}
          {section === "keamanan" && <AdminSecurity />}
          {section === "tutorials" && <AdminTutorials />}
          {section === "messages" && <AdminMessages />}
          {section === "complaints" && <AdminComplaints />}
          {section === "subscribers" && <AdminSubscribers />}
          {section === "faqs" && <AdminFaqs />}
          {section === "testimonials" && <AdminTestimonials />}
          {section === "management" && <AdminManagement />}
          {section === "branches" && <AdminBranches />}
          {section === "settings" && (
            <>
              <AdminSettings />
              <AdminNotificationSetupChecklist />
              <AdminEmailCard />
              <AdminWhatsAppCard />
              <AdminNotificationLog />
            </>
          )}
          {section === "translator" && <AdminTranslator />}
          {section === "ai-studio" && <AdminAiStudio />}
          {section === "gallery" && <AdminGallery />}
          {section === "agenda" && <AdminAgenda />}
          {section === "resources" && <AdminResources />}
          {section === "pdp" && <AdminPrivacyRequests />}
          {section === "sistem" && <AdminObservability />}
          {section === "growth" && <AdminGrowth />}
          {section === "omzet" && <AdminOmzet />}
          {section === "kampanye" && <AdminCampaigns />}
          {section === "audit" && <AdminAudit />}
          {section === "users" && <AdminUsers meId={user.id} />}
          {/* GABUNG v11 — Power Pack */}
          {section === "passport" && <AdminPassport />}
          {section === "academy" && <AdminAcademy />}
          {section === "booking" && <AdminBooking />}
          {section === "benefits" && <AdminBenefits />}
          {section === "tour" && <AdminTour />}
        </main>

        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground pb-[max(1rem,env(safe-area-inset-bottom))]">
          MUHDIN CMS v1.0 — Bersama Melayani Tamu Allah
        </footer>
      </div>
    </div>
  );
}

/* ================= LOGIN ================= */
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [needTotp, setNeedTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiSend<{ user: User; needTotp?: boolean }>("/api/auth/login", "POST", {
        email,
        password,
        totpCode,
      });
      // v12.3 «AMANAH» — akun ber-2FA diminta kode TOTP tanpa sesi dibuat.
      if (res.needTotp) {
        setNeedTotp(true);
        setError("Kode autentikasi (2FA) diperlukan — buka aplikasi authenticator Anda.");
        return;
      }
      toast({ title: `Selamat datang, ${res.user.name}!`, description: "Anda berhasil masuk ke CMS MUHDIN." });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-between bg-forest-deep text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative">
          <MuhdinBrand light />
        </div>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            Portal Admin<br />
            <span className="text-gold-gradient">MUHDIN</span>
          </h2>
          <p className="mt-4 text-emerald-50/80 max-w-md">
            Kelola konten, anggota, tutorial, dan komunikasi ekosistem — semuanya dari
            satu dasbor terpadu.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: "newspaper", label: "Konten" },
              { icon: "users", label: "Keanggotaan" },
              { icon: "graduation-cap", label: "Tutorial" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <Icon name={f.icon} className="h-5 w-5 mx-auto text-gold" />
                <p className="mt-2 text-xs font-semibold">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-emerald-100/70">© {new Date().getFullYear()} MUHDIN — Bersama Melayani Tamu Allah</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <MuhdinLogo className="h-16 w-16" />
          </div>
          <h1 className="text-2xl font-extrabold">Masuk ke CMS</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Gunakan kredensial administrator MUHDIN.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@muhdin.web.id"
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Icon name="keyround" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>

            {needTotp && (
              <div className="space-y-1.5">
                <Label htmlFor="totp">Kode Autentikasi (2FA)</Label>
                <div className="relative">
                  <Icon name="fingerprint" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    placeholder="6 digit"
                    className="pl-9 h-11 font-mono tracking-[0.3em]"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
                <Icon name="alert-triangle" className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-forest text-white shadow-lg"
            >
              {loading ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="login" className="h-4 w-4 mr-2" />}
              Masuk ke Dashboard
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-gold/10 border border-gold/25 p-4 text-xs text-foreground/75">
            <p className="font-bold text-gold-deep flex items-center gap-1.5">
              <Icon name="info" className="h-3.5 w-3.5" />
              Kredensial Demo
            </p>
            <p className="mt-1.5 font-mono">
              Super Admin: <b>admin@muhdin.web.id</b> · <b>muhdin2026</b>
            </p>
            <p className="mt-1 font-mono">
              Verifikator: <b>verifikator@muhdin.web.id</b> · <b>verifikator2026</b>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Segera ganti password setelah implementasi produksi.
            </p>
          </div>

          <button
            onClick={() => navigate("beranda")}
            className="mt-6 text-sm text-primary font-medium hover:underline"
          >
            ← Kembali ke situs utama
          </button>
        </div>
      </div>
    </div>
  );
}
