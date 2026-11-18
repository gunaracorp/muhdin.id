"use client";

/**
 * v6.0 — CMS "Pusat Bisnis B2B": kelola ekosistem hulu PPIU/PIHK/BPW.
 * Tab 1 Vendor     : CRUD jaringan vendor (hotel/transport/katering/handler…).
 * Tab 2 Kepatuhan  : dokumen SIUJK/COP/PTA + verifikasi; kedaluwarsa otomatis.
 * Tab 3 Bursa      : listing kursi + pipeline OPEN → RESERVED → DEAL/CLOSED.
 * Tab 4 Muthowif   : kolam pembimbing bersertifikat + ketersediaan.
 * Pola UI mengikuti AdminPackages (kartu + dialog + toast + audit di server).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDate } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { VendorItem, ComplianceDocItem, SeatListingItem, MuthowifItem, RegistryCompanyItem } from "@/lib/types";
import { LICENSE_CATALOG } from "@/lib/license-catalog"; // v7.0 — katalog syarat a–l
import { CERT_LEVELS, CERT_REQUIREMENTS } from "@/lib/muthawwif-cert"; // R-021 v13.3 — jalur berjenjang

interface MemberOption { id: string; name: string; type: string; city: string; status: string }
interface PkgOption { id: string; title: string }

const VENDOR_CATS = ["HOTEL_MAKKAH", "HOTEL_MADINAH", "TRANSPORT", "CATERING", "HANDLER", "AVIATION", "TPA", "FINANCE"];
const DOC_KINDS = ["SIUJK", "COP", "PTA", "SKAI", "ASURANSI", "RENCANA_KERJA", "NPWP", "AKTA"];

const CAT_LABELS: Record<string, string> = {
  HOTEL_MAKKAH: "Hotel Makkah", HOTEL_MADINAH: "Hotel Madinah", TRANSPORT: "Transportasi",
  CATERING: "Katering", HANDLER: "Handler Saudi", AVIATION: "Aviasi", TPA: "Asuransi/TPA", FINANCE: "Pembiayaan",
};
const KIND_LABELS: Record<string, string> = {
  SIUJK: "SIUJK", COP: "COP", PTA: "PTA", SKAI: "SKAI", ASURANSI: "Asuransi",
  RENCANA_KERJA: "Rencana Kerja", NPWP: "NPWP", AKTA: "Akta",
};

// v7.0 — katalog syarat Pindai Izin (label huruf a–l)
const REQ_LABELS: Record<string, string> = Object.fromEntries(
  LICENSE_CATALOG.map((r) => [r.key, `${r.letter}) ${r.key.replace(/_/g, " ")}`])
);
const LEGAL_ENTITIES = ["PT", "CV", "KOPERASI", "UD", "YAYASAN"];

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function LifecycleBadge({ lc, daysLeft }: { lc: string; daysLeft: number | null }) {
  const map: Record<string, { cls: string; label: string }> = {
    VALID: { cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400", label: "Berlaku" },
    EXPIRING: { cls: "bg-gold/15 text-gold-deep border-gold/40", label: daysLeft !== null ? `Berakhir ${daysLeft} hari` : "Segera" },
    EXPIRED: { cls: "bg-destructive/10 text-destructive border-destructive/30", label: "Kedaluwarsa" },
  };
  const m = map[lc] ?? map.VALID;
  return <Badge variant="outline" className={cn("text-[10px] font-bold", m.cls)}>{m.label}</Badge>;
}

function emptyVendor() {
  return { name: "", category: "HOTEL_MAKKAH", city: "", country: "SA", contact: "", phone: "", email: "", website: "", services: "", rating: "4.5", verified: false, status: "ACTIVE", note: "" };
}
function emptyDoc() {
  return { memberId: "", kind: "SIUJK", docNo: "", issuedBy: "Kemenag RI", issuedAt: "", expiresAt: "", fileUrl: "", verified: false, note: "" };
}
function emptySeat() {
  return { memberId: "", packageId: "", side: "OFFER", seats: "10", pricePerSeat: "", departureDate: "", route: "Jakarta – Jeddah", note: "" };
}
function emptyMuthowif() {
  return { fullName: "", certNo: "", agency: "", languages: "ID,AR", specialties: "", experienceYears: "3", phone: "", rating: "4.5", availability: "AVAILABLE", memberId: "" };
}
function emptyRegistry() {
  return { nib: "", name: "", legalEntity: "PT", city: "", province: "", phone: "", website: "", note: "" };
}
function emptyRegDoc() {
  return { requirementKey: "NIB", docNo: "", issuedBy: "", validUntil: "" };
}

export function AdminBisnis() {
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [pkgs, setPkgs] = useState<PkgOption[]>([]);

  const [vendors, setVendors] = useState<VendorItem[] | null>(null);
  const [docs, setDocs] = useState<ComplianceDocItem[] | null>(null);
  const [seats, setSeats] = useState<SeatListingItem[] | null>(null);
  const [muthowifs, setMuthowifs] = useState<MuthowifItem[] | null>(null);
  const [registries, setRegistries] = useState<RegistryCompanyItem[] | null>(null); // v7.0

  const [vendorForm, setVendorForm] = useState(emptyVendor());
  const [vendorEdit, setVendorEdit] = useState<VendorItem | null>(null);
  const [vendorDialog, setVendorDialog] = useState(false);

  const [docForm, setDocForm] = useState(emptyDoc());
  const [docEdit, setDocEdit] = useState<ComplianceDocItem | null>(null);
  const [docDialog, setDocDialog] = useState(false);

  const [seatForm, setSeatForm] = useState(emptySeat());
  const [seatDialog, setSeatDialog] = useState(false);
  const [seatAction, setSeatAction] = useState<{ item: SeatListingItem; action: "CLAIM" | "DEAL" | "CLOSE" | "REOPEN" } | null>(null);
  const [seatTaker, setSeatTaker] = useState("");
  const [seatTakerNote, setSeatTakerNote] = useState("");

  const [mutForm, setMutForm] = useState(emptyMuthowif());
  const [mutEdit, setMutEdit] = useState<MuthowifItem | null>(null);
  const [mutDialog, setMutDialog] = useState(false);
  // R-021 v13.3 — jalur sertifikasi berjenjang per muthawif
  const [certFor, setCertFor] = useState<MuthowifItem | null>(null);
  const [certInputs, setCertInputs] = useState<Record<string, { serviceHours: string; examScore: string }>>({});
  const [certResults, setCertResults] = useState<Record<string, { status: string; certNo: string | null; reasons: string[] }>>({});

  // v7.0 — Registri Pindai Izin
  const [regForm, setRegForm] = useState(emptyRegistry());
  const [regDocs, setRegDocs] = useState<ReturnType<typeof emptyRegDoc>[]>([emptyRegDoc()]);
  const [regEdit, setRegEdit] = useState<RegistryCompanyItem | null>(null);
  const [regDialog, setRegDialog] = useState(false);

  const [deleting, setDeleting] = useState<{ kind: "vendor" | "doc" | "seat" | "mut" | "reg"; id: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiGet<VendorItem[]>("/api/vendors?status=all").then(setVendors).catch(() => setVendors([]));
    apiGet<ComplianceDocItem[]>("/api/compliance-docs").then(setDocs).catch(() => setDocs([]));
    apiGet<SeatListingItem[]>("/api/seat-exchange?status=all").then(setSeats).catch(() => setSeats([]));
    apiGet<MuthowifItem[]>("/api/muthowif").then(setMuthowifs).catch(() => setMuthowifs([]));
    apiGet<RegistryCompanyItem[]>("/api/license-registry").then(setRegistries).catch(() => setRegistries([])); // v7.0
  }, []);

  useEffect(() => {
    load();
    apiGet<MemberOption[]>("/api/members?status=all")
      .then((rows) => setMembers(rows.filter((m) => m.status === "TERVERIFIKASI")))
      .catch(() => setMembers([]));
    apiGet<PkgOption[]>("/api/packages?status=all")
      .then(setPkgs)
      .catch(() => setPkgs([]));
  }, [load]);

  const errToast = (title: string, err: unknown) =>
    toast({ title, description: (err as Error).message, variant: "destructive" });

  /* ===== VENDOR ===== */
  const saveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...vendorForm, rating: Number(vendorForm.rating) };
      if (vendorEdit) {
        await apiSend(`/api/vendors/${vendorEdit.id}`, "PUT", payload);
        toast({ title: "Vendor diperbarui ✓", description: vendorForm.name });
      } else {
        await apiSend("/api/vendors", "POST", payload);
        toast({ title: "Vendor ditambahkan ✓", description: vendorForm.name });
      }
      setVendorDialog(false);
      setVendorEdit(null);
      load();
    } catch (err) { errToast("Gagal menyimpan vendor", err); } finally { setSaving(false); }
  };

  /* ===== COMPLIANCE ===== */
  const saveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...docForm, issuedAt: docForm.issuedAt || undefined, expiresAt: docForm.expiresAt || undefined };
      if (docEdit) {
        await apiSend(`/api/compliance-docs/${docEdit.id}`, "PUT", payload);
        toast({ title: "Dokumen diperbarui ✓", description: `${docForm.kind} — ${members.find((m) => m.id === docForm.memberId)?.name ?? ""}` });
      } else {
        await apiSend("/api/compliance-docs", "POST", payload);
        toast({ title: "Dokumen ditambahkan ✓", description: docForm.kind });
      }
      setDocDialog(false);
      setDocEdit(null);
      load();
    } catch (err) { errToast("Gagal menyimpan dokumen", err); } finally { setSaving(false); }
  };

  const toggleDocVerified = async (d: ComplianceDocItem) => {
    try {
      await apiSend(`/api/compliance-docs/${d.id}`, "PUT", { verified: !d.verified });
      toast({ title: d.verified ? "Verifikasi dicabut ✓" : "Dokumen terverifikasi ✓", description: `${d.member?.name} — ${KIND_LABELS[d.kind] ?? d.kind}` });
      load();
    } catch (err) { errToast("Gagal memperbarui verifikasi", err); }
  };

  /* ===== SEAT EXCHANGE ===== */
  const saveSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiSend("/api/seat-exchange", "POST", {
        ...seatForm,
        packageId: seatForm.packageId || undefined,
        seats: Number(seatForm.seats),
        pricePerSeat: Number(seatForm.pricePerSeat) || 0,
        departureDate: seatForm.departureDate || undefined,
      });
      toast({ title: "Listing dipasang ✓", description: `${seatForm.side} ${seatForm.seats} kursi` });
      setSeatDialog(false);
      load();
    } catch (err) { errToast("Gagal memasang listing", err); } finally { setSaving(false); }
  };

  const doSeatAction = async () => {
    if (!seatAction) return;
    const { item, action } = seatAction;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === "CLAIM") { payload.takerMemberId = seatTaker; payload.takerNote = seatTakerNote || undefined; }
      await apiSend(`/api/seat-exchange/${item.id}`, "PUT", payload);
      toast({ title: "Status bursa diperbarui ✓", description: `${item.seats} kursi → ${action}` });
      setSeatAction(null);
      setSeatTaker("");
      setSeatTakerNote("");
      load();
    } catch (err) { errToast("Gagal memperbarui listing", err); } finally { setSaving(false); }
  };

  /* ===== MUTHOWIF ===== */
  const saveMut = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...mutForm, experienceYears: Number(mutForm.experienceYears), rating: Number(mutForm.rating), memberId: mutForm.memberId || undefined };
      if (mutEdit) {
        await apiSend(`/api/muthowif/${mutEdit.id}`, "PUT", payload);
        toast({ title: "Muthowif diperbarui ✓", description: mutForm.fullName });
      } else {
        await apiSend("/api/muthowif", "POST", payload);
        toast({ title: "Muthowif ditambahkan ✓", description: mutForm.fullName });
      }
      setMutDialog(false);
      setMutEdit(null);
      load();
    } catch (err) { errToast("Gagal menyimpan muthowif", err); } finally { setSaving(false); }
  };

  /* ===== REGISTRY PINDAI IZIN (v7.0) ===== */
  const saveRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docsPayload = regDocs
        .filter((d) => d.requirementKey)
        .map((d) => ({ requirementKey: d.requirementKey, docNo: d.docNo, issuedBy: d.issuedBy, validUntil: d.validUntil || undefined }));
      const payload = { ...regForm, docs: docsPayload };
      if (regEdit) {
        await apiSend(`/api/license-registry/${regEdit.id}`, "PUT", payload);
        toast({ title: "Perusahaan registri diperbarui ✓", description: regForm.name });
      } else {
        await apiSend("/api/license-registry", "POST", payload);
        toast({ title: "Perusahaan ditambahkan ke registri ✓", description: regForm.name });
      }
      setRegDialog(false);
      setRegEdit(null);
      load();
    } catch (err) { errToast("Gagal menyimpan registri", err); } finally { setSaving(false); }
  };

  /* ===== DELETE bersama ===== */
  const doDelete = async () => {
    if (!deleting) return;
    const path = { vendor: "vendors", doc: "compliance-docs", seat: "seat-exchange", mut: "muthowif", reg: "license-registry" }[deleting.kind];
    try {
      await apiSend(`/api/${path}/${deleting.id}`, "DELETE");
      toast({ title: "Dihapus ✓", description: deleting.label });
      load();
    } catch (err) { errToast("Gagal menghapus", err); } finally { setDeleting(null); }
  };

  /* ===== SERTIFIKASI MUTHAWWIF BERJENJANG (R-021 v13.3) ===== */
  const openCert = (m: MuthowifItem) => {
    setCertFor(m);
    const inputs: Record<string, { serviceHours: string; examScore: string }> = {};
    for (const lv of CERT_LEVELS) {
      const row = m.certs?.find((c) => c.level === lv);
      inputs[lv] = { serviceHours: row ? String(row.serviceHours) : "", examScore: row ? String(row.examScore) : "" };
    }
    setCertInputs(inputs);
    setCertResults({});
  };

  const saveCert = async (lv: (typeof CERT_LEVELS)[number]) => {
    if (!certFor) return;
    const inp = certInputs[lv];
    if (!inp) return;
    setSaving(true);
    try {
      const res = await apiSend<{ cert: { level: string; status: string; certNo: string | null; serviceHours: number; examScore: number }; evaluation: { eligible: boolean; reasons: string[] } }>(
        "/api/muthowif/cert",
        "POST",
        { muthowifId: certFor.id, level: lv, serviceHours: Number(inp.serviceHours) || 0, examScore: Number(inp.examScore) || 0 },
      );
      setCertResults((prev) => ({ ...prev, [lv]: { status: res.cert.status, certNo: res.cert.certNo, reasons: res.evaluation.reasons } }));
      // Perbarui daftar lokal agar lencana portal ikut segar.
      const row = { level: res.cert.level, status: res.cert.status, certNo: res.cert.certNo, serviceHours: res.cert.serviceHours, examScore: res.cert.examScore };
      setMuthowifs((prev) =>
        (prev ?? []).map((x) =>
          x.id === certFor.id ? { ...x, certs: [...(x.certs ?? []).filter((c) => c.level !== lv), row] } : x,
        ),
      );
      toast({
        title: res.cert.status === "PASSED" ? `Jenjang ${lv} lulus ✓` : `Jenjang ${lv} belum lulus`,
        description: res.cert.status === "PASSED" ? `No. ${res.cert.certNo}` : res.evaluation.reasons.join(" ") || undefined,
      });
    } catch (err) {
      errToast("Gagal menyimpan sertifikasi", err);
    } finally {
      setSaving(false);
    }
  };

  const memberName = (id?: string | null) => members.find((m) => m.id === id)?.name ?? "—";
  const selCls = "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm";

  const openSeats = (seats ?? []).filter((s) => s.status === "OPEN").length;
  const expiringDocs = (docs ?? []).filter((d) => d.lifecycle === "EXPIRING").length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">
          Pusat Bisnis B2B (Hulu)
          {openSeats > 0 && <Badge className="danger-solid">{openSeats} listing terbuka</Badge>}
          {expiringDocs > 0 && <Badge variant="outline" className="border-gold/40 bg-gold/15 text-[10px] font-bold text-gold-deep">{expiringDocs} dokumen segera berakhir</Badge>}
        </h2>
        <p className="text-sm text-muted-foreground">
          Jaringan vendor, kepatuhan perizinan, bursa kursi antar penyelenggara, dan kolam muthowif — tampil publik di #/bisnis.
        </p>
      </div>

      <Tabs defaultValue="vendors">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="vendors" className="gap-1.5"><Icon name="boxes" className="h-3.5 w-3.5" aria-hidden /> Vendor ({vendors?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="docs" className="gap-1.5"><Icon name="file-check" className="h-3.5 w-3.5" aria-hidden /> Kepatuhan ({docs?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="seats" className="gap-1.5"><Icon name="git-merge" className="h-3.5 w-3.5" aria-hidden /> Bursa Kursi ({seats?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="muthowif" className="gap-1.5"><Icon name="moon-star" className="h-3.5 w-3.5" aria-hidden /> Muthowif ({muthowifs?.length ?? 0})</TabsTrigger>
          {/* v7.0 — Registri Pindai Izin */}
          <TabsTrigger value="registry" className="gap-1.5"><Icon name="scan" className="h-3.5 w-3.5" aria-hidden /> Registri Izin ({registries?.length ?? 0})</TabsTrigger>
        </TabsList>

        {/* ===== TAB VENDOR ===== */}
        <TabsContent value="vendors">
          <Button onClick={() => { setVendorForm(emptyVendor()); setVendorEdit(null); setVendorDialog(true); }} className="mb-4 bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Tambah Vendor
          </Button>
          {!vendors ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : vendors.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="boxes" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada vendor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {vendors.map((v) => (
                <div key={v.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{CAT_LABELS[v.category] ?? v.category} · {v.city || "—"} ({v.country})</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {v.verified ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-[10px] font-bold text-emerald-700 border-emerald-500/30 dark:text-emerald-400">Terverifikasi</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">Belum terverifikasi</Badge>
                      )}
                      {v.status !== "ACTIVE" && <Badge variant="outline" className="bg-destructive/10 text-[10px] font-bold text-destructive border-destructive/30">Suspended</Badge>}
                      <span className="text-xs font-extrabold text-gold-deep">{v.rating.toFixed(1)} ★</span>
                    </div>
                  </div>
                  {v.services && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{v.services}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setVendorForm({
                        name: v.name, category: v.category, city: v.city, country: v.country, contact: v.contact,
                        phone: v.phone, email: v.email ?? "", website: v.website ?? "", services: v.services,
                        rating: String(v.rating), verified: v.verified, status: v.status, note: v.note ?? "",
                      });
                      setVendorEdit(v); setVendorDialog(true);
                    }}>
                      <Icon name="pencil" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ubah
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try { await apiSend(`/api/vendors/${v.id}`, "PUT", { verified: !v.verified }); toast({ title: v.verified ? "Verifikasi dicabut ✓" : "Vendor terverifikasi ✓" }); load(); }
                      catch (err) { errToast("Gagal", err); }
                    }}>
                      <Icon name="badge-check" className="h-3.5 w-3.5 mr-1" aria-hidden /> {v.verified ? "Cabut Verifikasi" : "Verifikasi"}
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto" onClick={() => setDeleting({ kind: "vendor", id: v.id, label: v.name })}>
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB KEPATUHAN ===== */}
        <TabsContent value="docs">
          <Button onClick={() => { setDocForm({ ...emptyDoc(), memberId: members[0]?.id ?? "" }); setDocEdit(null); setDocDialog(true); }} className="mb-4 bg-gradient-to-r from-primary to-forest text-white" disabled={members.length === 0}>
            <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Tambah Dokumen
          </Button>
          {!docs ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          ) : docs.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="file-check" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada dokumen kepatuhan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {docs.map((d) => (
                <div key={d.id} className={cn("rounded-2xl border bg-card p-5 shadow-sm", d.lifecycle === "EXPIRED" && "border-destructive/40", d.lifecycle === "EXPIRING" && "border-gold/50")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{d.member?.name ?? "—"} <span className="font-normal text-muted-foreground">· {KIND_LABELS[d.kind] ?? d.kind}</span></p>
                      <p className="text-xs text-muted-foreground">{d.docNo || "tanpa nomor"} · {d.issuedBy || "—"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.issuedAt ? `Terbit ${formatDate(d.issuedAt)}` : "—"} → {d.expiresAt ? `berakhir ${formatDate(d.expiresAt)}` : "tanpa masa berakhir"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <LifecycleBadge lc={d.lifecycle} daysLeft={d.daysLeft} />
                      {d.verified ? (
                        <Badge variant="outline" className="bg-primary/10 text-[10px] font-bold text-primary border-primary/30">Terverifikasi</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-[10px] font-bold text-muted-foreground">Menunggu</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setDocForm({
                        memberId: d.memberId, kind: d.kind, docNo: d.docNo, issuedBy: d.issuedBy,
                        issuedAt: d.issuedAt ? d.issuedAt.slice(0, 10) : "", expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : "",
                        fileUrl: d.fileUrl ?? "", verified: d.verified, note: d.note ?? "",
                      });
                      setDocEdit(d); setDocDialog(true);
                    }}>
                      <Icon name="pencil" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ubah
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleDocVerified(d)}>
                      <Icon name="badge-check" className="h-3.5 w-3.5 mr-1" aria-hidden /> {d.verified ? "Cabut Verifikasi" : "Verifikasi"}
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto" onClick={() => setDeleting({ kind: "doc", id: d.id, label: `${d.member?.name} — ${d.kind}` })}>
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB BURSA KURSI ===== */}
        <TabsContent value="seats">
          <Button onClick={() => { setSeatForm({ ...emptySeat(), memberId: members[0]?.id ?? "" }); setSeatDialog(true); }} className="mb-4 bg-gradient-to-r from-primary to-forest text-white" disabled={members.length === 0}>
            <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Pasang Listing
          </Button>
          {!seats ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : seats.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="git-merge" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada listing di bursa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {seats.map((s) => (
                <div key={s.id} className={cn("rounded-2xl border bg-card p-5 shadow-sm", s.status === "OPEN" && s.side === "OFFER" && "border-l-4 border-l-emerald-500", s.status === "OPEN" && s.side === "WANTED" && "border-l-4 border-l-gold")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {s.seats} kursi {s.side === "OFFER" ? "dijual" : "dicari"} {s.pricePerSeat > 0 && <span className="text-gold-deep">· {rupiah(s.pricePerSeat)}/kursi</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{s.member?.name ?? "—"} · {s.route || "—"} · {s.departureDate ? formatDate(s.departureDate) : "fleksibel"}</p>
                      {s.pkg && <p className="mt-0.5 text-xs font-semibold text-primary truncate">{s.pkg.title}</p>}
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px] font-bold",
                      s.status === "OPEN" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                      : s.status === "RESERVED" ? "bg-gold/15 text-gold-deep border-gold/40"
                      : s.status === "DEAL" ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted text-muted-foreground")}>
                      {s.status}
                    </Badge>
                  </div>
                  {s.taker && <p className="mt-2 text-xs text-muted-foreground">Diambil oleh: <b>{s.taker.name}</b>{s.takerNote ? ` — “${s.takerNote}”` : ""}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.status === "OPEN" && (
                      <Button variant="outline" size="sm" onClick={() => { setSeatAction({ item: s, action: "CLAIM" }); setSeatTaker(members.find((m) => m.id !== s.memberId)?.id ?? ""); setSeatTakerNote(""); }}>
                        <Icon name="handshake" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ambil (Reserve)
                      </Button>
                    )}
                    {(s.status === "RESERVED" || s.status === "OPEN") && (
                      <Button size="sm" className="bg-gradient-to-r from-primary to-forest text-white" onClick={() => setSeatAction({ item: s, action: "DEAL" })}>
                        <Icon name="check-circle-2" className="h-3.5 w-3.5 mr-1" aria-hidden /> Sepakati (Deal)
                      </Button>
                    )}
                    {s.status !== "CLOSED" && (
                      <Button variant="outline" size="sm" onClick={() => setSeatAction({ item: s, action: "CLOSE" })}>
                        <Icon name="ban" className="h-3.5 w-3.5 mr-1" aria-hidden /> Tutup
                      </Button>
                    )}
                    {(s.status === "RESERVED" || s.status === "CLOSED") && (
                      <Button variant="outline" size="sm" onClick={() => setSeatAction({ item: s, action: "REOPEN" })}>
                        <Icon name="rotate-ccw" className="h-3.5 w-3.5 mr-1" aria-hidden /> Buka Lagi
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto" onClick={() => setDeleting({ kind: "seat", id: s.id, label: `${s.seats} kursi — ${s.member?.name}` })}>
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB MUTHOWIF ===== */}
        <TabsContent value="muthowif">
          <Button onClick={() => { setMutForm(emptyMuthowif()); setMutEdit(null); setMutDialog(true); }} className="mb-4 bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Tambah Muthowif
          </Button>
          {!muthowifs ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          ) : muthowifs.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="moon-star" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Kolam muthowif masih kosong.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {muthowifs.map((m) => (
                <div key={m.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft font-extrabold">{m.fullName.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{m.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.agency || "—"} · {m.experienceYears} thn · {m.certNo || "tanpa sertifikat"}</p>
                        <p className="text-xs text-muted-foreground">Bahasa: {m.languages} · Afiliasi: {m.member?.name ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-xs font-extrabold text-gold-deep">{m.rating.toFixed(1)} ★</span>
                      <Badge variant="outline" className={cn("text-[10px] font-bold",
                        m.availability === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                        : m.availability === "ASSIGNED" ? "bg-gold/15 text-gold-deep border-gold/40"
                        : "bg-muted text-muted-foreground")}>
                        {m.availability}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setMutForm({
                        fullName: m.fullName, certNo: m.certNo, agency: m.agency, languages: m.languages,
                        specialties: m.specialties, experienceYears: String(m.experienceYears), phone: m.phone,
                        rating: String(m.rating), availability: m.availability, memberId: m.memberId ?? "",
                      });
                      setMutEdit(m); setMutDialog(true);
                    }}>
                      <Icon name="pencil" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ubah
                    </Button>
                    {/* R-021 v13.3 — catat jam & ujian, evaluasi jenjang otomatis */}
                    <Button variant="outline" size="sm" className="text-gold-deep border-gold/40 hover:bg-gold/10" onClick={() => openCert(m)}>
                      <Icon name="award" className="h-3.5 w-3.5 mr-1" aria-hidden /> Sertifikasi
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto" onClick={() => setDeleting({ kind: "mut", id: m.id, label: m.fullName })}>
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB REGISTRY PINDAI IZIN (v7.0) ===== */}
        <TabsContent value="registry">
          <Button onClick={() => {
            setRegForm(emptyRegistry());
            setRegDocs([emptyRegDoc()]);
            setRegEdit(null);
            setRegDialog(true);
          }} className="mb-4 bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Tambah Perusahaan
          </Button>
          {!registries ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          ) : registries.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="scan" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada perusahaan pada registri pindai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {registries.map((r) => (
                <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{r.name}</p>
                      <p className="font-mono text-xs text-muted-foreground" dir="ltr">NIB {r.nib}</p>
                      <p className="text-xs text-muted-foreground">{r.legalEntity} · {r.city || "—"}{r.province ? `, ${r.province}` : ""}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-gold/10 text-[10px] font-bold text-gold-deep border-gold/40">
                      {r.docs.length} dokumen
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.docs.map((d) => (
                      <Badge key={d.id} variant="outline" className="text-[9px] font-bold text-muted-foreground">
                        {REQ_LABELS[d.requirementKey] ?? d.requirementKey}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setRegForm({
                        nib: r.nib, name: r.name, legalEntity: r.legalEntity, city: r.city, province: r.province,
                        phone: r.phone, website: r.website ?? "", note: r.note ?? "",
                      });
                      setRegDocs(r.docs.map((d) => ({
                        requirementKey: d.requirementKey, docNo: d.docNo, issuedBy: d.issuedBy,
                        validUntil: d.validUntil ? d.validUntil.slice(0, 10) : "",
                      })));
                      setRegEdit(r); setRegDialog(true);
                    }}>
                      <Icon name="pencil" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ubah
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto" onClick={() => setDeleting({ kind: "reg", id: r.id, label: `${r.name} (NIB ${r.nib})` })}>
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== DIALOG VENDOR ===== */}
      <Dialog open={vendorDialog} onOpenChange={(o) => !o && setVendorDialog(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left">{vendorEdit ? "Ubah Vendor" : "Tambah Vendor"}</DialogTitle>
            <DialogDescription className="text-left">Vendor tampil publik di #/bisnis → Jaringan Vendor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveVendor} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nama Vendor *</Label>
                <Input value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} required minLength={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori *</Label>
                <select value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })} className={selCls}>
                  {VENDOR_CATS.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              <div className="space-y-1.5"><Label>Kota</Label><Input value={vendorForm.city} onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })} placeholder="Makkah" /></div>
              <div className="space-y-1.5"><Label>Negara</Label><Input value={vendorForm.country} onChange={(e) => setVendorForm({ ...vendorForm, country: e.target.value })} maxLength={2} /></div>
              <div className="space-y-1.5"><Label>Narahubung</Label><Input value={vendorForm.contact} onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Telepon</Label><Input value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Website</Label><Input value={vendorForm.website} onChange={(e) => setVendorForm({ ...vendorForm, website: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Rating (0–5)</Label><Input type="number" min={0} max={5} step={0.1} value={vendorForm.rating} onChange={(e) => setVendorForm({ ...vendorForm, rating: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Ringkasan Layanan</Label>
              <Textarea rows={3} value={vendorForm.services} onChange={(e) => setVendorForm({ ...vendorForm, services: e.target.value })} placeholder="Hotel 4★ 400 kamar, 200 m dari Haram…" />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Switch checked={vendorForm.verified} onCheckedChange={(v) => setVendorForm({ ...vendorForm, verified: v })} /> Terverifikasi
              </label>
              <div className="space-y-1.5">
                <select value={vendorForm.status} onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })} className={selCls}>
                  <option value="ACTIVE">Aktif</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setVendorDialog(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-forest text-white">
                {saving ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden /> Menyimpan…</> : <><Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Simpan</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG KEPATUHAN ===== */}
      <Dialog open={docDialog} onOpenChange={(o) => !o && setDocDialog(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left">{docEdit ? "Ubah Dokumen Kepatuhan" : "Tambah Dokumen Kepatuhan"}</DialogTitle>
            <DialogDescription className="text-left">Sistem menghitung otomatis: berlaku, segera berakhir (≤90 hari), atau kedaluwarsa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveDoc} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Anggota *</Label>
                <select value={docForm.memberId} onChange={(e) => setDocForm({ ...docForm, memberId: e.target.value })} className={selCls} required>
                  {members.length === 0 && <option value="">— memuat anggota… —</option>}
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.city})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Dokumen *</Label>
                <select value={docForm.kind} onChange={(e) => setDocForm({ ...docForm, kind: e.target.value })} className={selCls}>
                  {DOC_KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Nomor Dokumen</Label><Input value={docForm.docNo} onChange={(e) => setDocForm({ ...docForm, docNo: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Penerbit</Label><Input value={docForm.issuedBy} onChange={(e) => setDocForm({ ...docForm, issuedBy: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Tanggal Terbit</Label><Input type="date" value={docForm.issuedAt} onChange={(e) => setDocForm({ ...docForm, issuedAt: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Tanggal Berakhir *</Label><Input type="date" value={docForm.expiresAt} onChange={(e) => setDocForm({ ...docForm, expiresAt: e.target.value })} required /></div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Switch checked={docForm.verified} onCheckedChange={(v) => setDocForm({ ...docForm, verified: v })} /> Terverifikasi
              </label>
              <div className="flex-1 min-w-48 space-y-1.5"><Label>URL File (opsional)</Label><Input value={docForm.fileUrl} onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })} placeholder="https://…" /></div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDocDialog(false)}>Batal</Button>
              <Button type="submit" disabled={saving || !docForm.memberId} className="bg-gradient-to-r from-primary to-forest text-white">
                {saving ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden /> Menyimpan…</> : <><Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Simpan</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG BURSA ===== */}
      <Dialog open={seatDialog} onOpenChange={(o) => !o && setSeatDialog(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left">Pasang Listing Bursa Kursi</DialogTitle>
            <DialogDescription className="text-left">OFFER = menjual sisa kursi; WANTED = mencari kursi rombongan lain.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveSeat} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Anggota *</Label>
                <select value={seatForm.memberId} onChange={(e) => setSeatForm({ ...seatForm, memberId: e.target.value })} className={selCls} required>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Listing *</Label>
                <select value={seatForm.side} onChange={(e) => setSeatForm({ ...seatForm, side: e.target.value })} className={selCls}>
                  <option value="OFFER">OFFER — jual sisa kursi</option>
                  <option value="WANTED">WANTED — mencari kursi</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              <div className="space-y-1.5"><Label>Jumlah Kursi *</Label><Input type="number" min={1} value={seatForm.seats} onChange={(e) => setSeatForm({ ...seatForm, seats: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Harga/Kursi (IDR)</Label><Input type="number" min={0} step={100000} value={seatForm.pricePerSeat} onChange={(e) => setSeatForm({ ...seatForm, pricePerSeat: e.target.value })} placeholder="0 = nego" /></div>
              <div className="space-y-1.5"><Label>Keberangkatan</Label><Input type="date" value={seatForm.departureDate} onChange={(e) => setSeatForm({ ...seatForm, departureDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Rute</Label><Input value={seatForm.route} onChange={(e) => setSeatForm({ ...seatForm, route: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Paket Terkait (opsional)</Label>
              <select value={seatForm.packageId} onChange={(e) => setSeatForm({ ...seatForm, packageId: e.target.value })} className={selCls}>
                <option value="">— tanpa paket —</option>
                {pkgs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea rows={2} value={seatForm.note} onChange={(e) => setSeatForm({ ...seatForm, note: e.target.value })} placeholder="Bus 33 kursi,  handler Siap, harga transfer… " />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setSeatDialog(false)}>Batal</Button>
              <Button type="submit" disabled={saving || !seatForm.memberId} className="bg-gradient-to-r from-primary to-forest text-white">
                {saving ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden /> Menyimpan…</> : <><Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Pasang</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog CLAIM */}
      <Dialog open={!!seatAction && seatAction.action === "CLAIM"} onOpenChange={(o) => !o && setSeatAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left">Ambil Listing (Reserve)</DialogTitle>
            <DialogDescription className="text-left">{seatAction?.item.seats} kursi dari {seatAction?.item.member?.name} — pilih anggota pengambil.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label>Anggota Pengambil *</Label>
              <select value={seatTaker} onChange={(e) => setSeatTaker(e.target.value)} className={selCls}>
                {members.filter((m) => m.id !== seatAction?.item.memberId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan Pengambil</Label>
              <Textarea rows={2} value={seatTakerNote} onChange={(e) => setSeatTakerNote(e.target.value)} placeholder="Kesepakatan harga & pembayaran…" />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setSeatAction(null)}>Batal</Button>
              <Button onClick={doSeatAction} disabled={saving || !seatTaker} className="bg-gradient-to-r from-primary to-forest text-white">Reserve</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG MUTHOWIF ===== */}
      <Dialog open={mutDialog} onOpenChange={(o) => !o && setMutDialog(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left">{mutEdit ? "Ubah Muthowif" : "Tambah Muthowif"}</DialogTitle>
            <DialogDescription className="text-left">Tampil publik di #/bisnis → Kolam Muthowif.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveMut} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Nama Lengkap *</Label><Input value={mutForm.fullName} onChange={(e) => setMutForm({ ...mutForm, fullName: e.target.value })} required minLength={3} /></div>
              <div className="space-y-1.5"><Label>No. Sertifikat</Label><Input value={mutForm.certNo} onChange={(e) => setMutForm({ ...mutForm, certNo: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Lembaga / Afiliasi</Label><Input value={mutForm.agency} onChange={(e) => setMutForm({ ...mutForm, agency: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Bahasa (pisah koma)</Label><Input value={mutForm.languages} onChange={(e) => setMutForm({ ...mutForm, languages: e.target.value.toUpperCase() })} placeholder="ID,AR,EN" /></div>
              <div className="space-y-1.5"><Label>Pengalaman (tahun)</Label><Input type="number" min={0} value={mutForm.experienceYears} onChange={(e) => setMutForm({ ...mutForm, experienceYears: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Telepon</Label><Input value={mutForm.phone} onChange={(e) => setMutForm({ ...mutForm, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Rating (0–5)</Label><Input type="number" min={0} max={5} step={0.1} value={mutForm.rating} onChange={(e) => setMutForm({ ...mutForm, rating: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Ketersediaan</Label>
                <select value={mutForm.availability} onChange={(e) => setMutForm({ ...mutForm, availability: e.target.value })} className={selCls}>
                  <option value="AVAILABLE">Siap tugas</option>
                  <option value="ASSIGNED">Terjadwal</option>
                  <option value="UNAVAILABLE">Belum tersedia</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Spesialisasi</Label><Input value={mutForm.specialties} onChange={(e) => setMutForm({ ...mutForm, specialties: e.target.value })} placeholder="Manasik wanita, pendampingan lansia…" /></div>
              <div className="space-y-1.5">
                <Label>Afiliasi Anggota</Label>
                <select value={mutForm.memberId} onChange={(e) => setMutForm({ ...mutForm, memberId: e.target.value })} className={selCls}>
                  <option value="">— independen —</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setMutDialog(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-forest text-white">
                {saving ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden /> Menyimpan…</> : <><Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Simpan</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG SERTIFIKASI BERJENJANG (R-021 v13.3) ===== */}
      <Dialog open={!!certFor} onOpenChange={(o) => !o && setCertFor(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left">Jalur Sertifikasi — {certFor?.fullName}</DialogTitle>
            <DialogDescription className="text-left">
              Catat jam pelayanan + skor ujian per jenjang. Lulus otomatis bila seluruh syarat terpenuhi; nomor sertifikat terbit dari server.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {CERT_LEVELS.map((lv) => {
              const req = CERT_REQUIREMENTS[lv];
              const row = certFor?.certs?.find((c) => c.level === lv);
              const res = certResults[lv];
              const status = res?.status ?? row?.status ?? "CANDIDATE";
              return (
                <div key={lv} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold/15 text-gold-deep"><Icon name="award" className="h-4 w-4" aria-hidden /></span>
                      <div>
                        <p className="text-sm font-extrabold">{req.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Syarat: skor ≥ {req.minScore}{req.minHours ? ` · jam ≥ ${req.minHours}` : ""}{req.prior ? ` · lulus ${CERT_REQUIREMENTS[req.prior].label}` : ""}{req.minYears ? ` · pengalaman ≥ ${req.minYears} thn` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-extrabold",
                      status === "PASSED" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                      : status === "FAILED" ? "bg-destructive/10 text-destructive border-destructive/30"
                      : "bg-muted text-muted-foreground")}>
                      {status === "PASSED" ? "LULUS" : status === "FAILED" ? "GAGAL" : "CANDIDATE"}
                    </Badge>
                  </div>
                  {(res?.certNo ?? row?.certNo) && status === "PASSED" && (
                    <p className="mt-2 text-[11px] font-bold text-primary" dir="ltr">No. Sertifikat: {res?.certNo ?? row?.certNo}</p>
                  )}
                  {res && res.status !== "PASSED" && res.reasons.length > 0 && (
                    <p className="mt-2 text-[11px] font-semibold text-destructive">{res.reasons.join(" · ")}</p>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Jam Pelayanan</Label>
                      <Input type="number" min={0} value={certInputs[lv]?.serviceHours ?? ""} onChange={(e) => setCertInputs((p) => ({ ...p, [lv]: { ...(p[lv] ?? { examScore: "" }), serviceHours: e.target.value } }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Skor Ujian (0–100)</Label>
                      <Input type="number" min={0} max={100} value={certInputs[lv]?.examScore ?? ""} onChange={(e) => setCertInputs((p) => ({ ...p, [lv]: { ...(p[lv] ?? { serviceHours: "" }), examScore: e.target.value } }))} />
                    </div>
                  </div>
                  <Button type="button" size="sm" disabled={saving} onClick={() => saveCert(lv)} className="mt-3 w-full bg-gradient-to-r from-primary to-forest text-white">
                    {saving ? "Menilai…" : "Nilai & Evaluasi Jenjang"}
                  </Button>
                </div>
              );
            })}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Pengalaman tercatat: {certFor?.experienceYears ?? 0} tahun. Jenjang MENTOR menuntut lulus Lanjutan, ≥500 jam, ujian ≥85, dan pengalaman ≥3 tahun.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG REGISTRY PINDAI IZIN (v7.0) ===== */}
      <Dialog open={regDialog} onOpenChange={(o) => !o && setRegDialog(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left">{regEdit ? "Ubah Perusahaan Registri" : "Tambah Perusahaan Registri"}</DialogTitle>
            <DialogDescription className="text-left">
              Sumber data pemindaian publik #/pindai — NIB unik. Dokumen diganti-total saat disimpan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveRegistry} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>NIB *</Label><Input value={regForm.nib} onChange={(e) => setRegForm({ ...regForm, nib: e.target.value })} required minLength={6} placeholder="13 digit OSS" dir="ltr" /></div>
              <div className="space-y-1.5"><Label>Nama Perusahaan *</Label><Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} required minLength={3} /></div>
              <div className="space-y-1.5">
                <Label>Bentuk Badan</Label>
                <select value={regForm.legalEntity} onChange={(e) => setRegForm({ ...regForm, legalEntity: e.target.value })} className={selCls}>
                  {LEGAL_ENTITIES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label>Kota</Label><Input value={regForm.city} onChange={(e) => setRegForm({ ...regForm, city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Provinsi</Label><Input value={regForm.province} onChange={(e) => setRegForm({ ...regForm, province: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Telepon</Label><Input value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Website</Label><Input value={regForm.website} onChange={(e) => setRegForm({ ...regForm, website: e.target.value })} dir="ltr" /></div>
              <div className="space-y-1.5"><Label>Catatan</Label><Input value={regForm.note} onChange={(e) => setRegForm({ ...regForm, note: e.target.value })} /></div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="font-extrabold">Dokumen Izin (checklist a–l)</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setRegDocs([...regDocs, emptyRegDoc()])}>
                  <Icon name="plus" className="h-3.5 w-3.5 mr-1" aria-hidden /> Baris
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {regDocs.map((d, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border bg-card p-2 sm:grid-cols-12">
                    <select
                      value={d.requirementKey}
                      onChange={(e) => setRegDocs(regDocs.map((x, j) => (j === i ? { ...x, requirementKey: e.target.value } : x)))}
                      className="h-9 rounded-lg border border-border bg-card px-2 text-xs sm:col-span-3"
                    >
                      {LICENSE_CATALOG.map((r) => <option key={r.key} value={r.key}>{r.letter}) {r.key.replace(/_/g, " ")}</option>)}
                    </select>
                    <Input className="h-9 text-xs sm:col-span-3" placeholder="No. dokumen" value={d.docNo} onChange={(e) => setRegDocs(regDocs.map((x, j) => (j === i ? { ...x, docNo: e.target.value } : x)))} dir="ltr" />
                    <Input className="h-9 text-xs sm:col-span-3" placeholder="Penerbit" value={d.issuedBy} onChange={(e) => setRegDocs(regDocs.map((x, j) => (j === i ? { ...x, issuedBy: e.target.value } : x)))} />
                    <Input className="h-9 text-xs sm:col-span-2" type="date" value={d.validUntil} onChange={(e) => setRegDocs(regDocs.map((x, j) => (j === i ? { ...x, validUntil: e.target.value } : x)))} />
                    <Button type="button" variant="outline" size="sm" className="h-9 text-destructive sm:col-span-1" onClick={() => setRegDocs(regDocs.filter((_, j) => j !== i))} aria-label="Hapus baris">
                      <Icon name="trash" className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                ))}
                {regDocs.length === 0 && <p className="text-center text-xs text-muted-foreground">Tanpa dokumen — seluruh syarat akan tampak “BELUM ADA”.</p>}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setRegDialog(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-forest text-white">
                {saving ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden /> Menyimpan…</> : <><Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Simpan</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus ini?</AlertDialogTitle>
            <AlertDialogDescription>“{deleting?.label}” akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="danger-solid" onClick={doDelete}>Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
