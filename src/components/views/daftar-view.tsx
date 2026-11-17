"use client";

/**
 * daftar-view.tsx — Engine Pendaftaran Cerdas "/daftar" (Task 33-d).
 *
 * Alur: Langkah 0 (pilih 1 dari 15 peran REG_ROLES) → 01 Profil (dinamis per
 * peran) → 02 Dokumen (checklist konfirmasi, tanpa upload) → 03 Layanan &
 * Minat (multi-pilih, opsional) → 04 Tinjau + persetujuan privasi wajib →
 * 05 Kirim (tombol besar, POST /api/applications) → layar sukses + kode tiket.
 *
 * Aturan mutu: satu layar satu fokus, tombol ≥44px, mobile-first, RTL aman
 * (ps-/pe-/me-/ms-), aria pada stepper & input, tanpa klaim pemerintah
 * (ROLE 25 — lihat frasa disclaimer di bawah).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { PromoSlotLine, dispatchPromoRefresh } from "@/components/site/slot-counter"; // Task 44 — kuota live
import { LiveSlotBoardSection, QueueSuccessCard } from "@/components/site/live-slot-board"; // Task 53 — papan slot realtime
import { REG_ROLES } from "@/lib/indonesia";
import { cn } from "@/lib/utils";

/* ---------- Konstanta lokal (mapping didefinisikan di view) ---------- */

const NS = "nusJoin";

const GROUP_ORDER = ["INDIVIDU", "ORGANISASI", "PENYEDIA", "TEKNOLOGI_PARTNER"] as const;

/** Peran ORGANISASI yang wajib memiliki nomor izin. */
const LICENSED_CODES = ["PPIU", "PIHK", "KBIHU"];

type Kind = "individual" | "org" | "provider" | "tech";

function kindOfRole(group: string): Kind {
  if (group === "INDIVIDU") return "individual";
  if (group === "ORGANISASI") return "org";
  if (group === "PENYEDIA") return "provider";
  return "tech";
}

/** Set dokumen (id) per jenis pendaftar — label via nusJoin.doc.{id}. */
const DOC_SETS: Record<Kind, string[]> = {
  org: ["legalitas", "license", "orgProfile"],
  individual: ["identity", "trackRecord"],
  provider: ["companyLegal", "authorization", "references"],
  tech: ["companyLegal", "teamProfile", "references"],
};

/** Pilihan layanan & minat per kode peran — label via nusJoin.svc.{id}.
 *  Task 49 — entri INDIVIDUAL & PROFESSIONAL dihapus (peran ditiadakan). */
const SVC_BY_ROLE: Record<string, string[]> = {
  JAMAAH: ["pilgrimInfo", "pilgrimCommunity", "pilgrimManasik"],
  ORGANIZATION: ["orgCollab", "orgNetwork", "orgTraining"],
  PPIU: ["ppiuRegular", "ppiuSpecial", "ppiuPlus"],
  PIHK: ["pihkLodging", "pihkCatering", "pihkTransport", "pihkMentor"],
  KBIHU: ["kbihuQuota", "kbihuOps", "kbihuTraining"],
  PROVIDER_ID: ["lodgingDomestic", "bus", "catering", "visaDoc"],
  PROVIDER_SAUDI: ["hotelMakkah", "hotelMadinah", "hotelJeddah", "bus", "vip", "catering"],
  VISA_DOC: ["visaUmroh", "visaZiyarah", "visaAmil", "visaHaji"],
  HOTEL: ["hotelMakkah", "hotelMadinah", "hotelJeddah", "star3", "star4", "star5"],
  TICKETING: ["ticketGroup", "ticketIndividual", "ticketCharter"],
  TRANSPORT: ["bus", "gmc", "keretaCepat"],
  INSURANCE: ["insTravel", "insHealth", "insAccident"],
  HEALTH: ["vaksinMeningitis", "vaksinPolio", "vaksinFlu"],
  TECHNOLOGY: ["techIntegration", "techReseller", "techAlliance"],
  STRATEGIC_PARTNER: ["partnerAlliance", "partnerMarketing", "partnerProgram"],
};

const STEP_ITEMS = [
  { n: "01", key: "stepperProfile" },
  { n: "02", key: "stepperDocs" },
  { n: "03", key: "stepperServices" },
  { n: "04", key: "stepperReview" },
  { n: "05", key: "stepperSend" },
] as const;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Animasi centang sukses — murni CSS, menghormati prefers-reduced-motion. */
const SUCCESS_CSS = `
@keyframes mhd-pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes mhd-draw{from{stroke-dashoffset:48}to{stroke-dashoffset:0}}
.mhd-success-circle{animation:mhd-pop .5s ease-out both}
.mhd-success-check{stroke-dasharray:48;stroke-dashoffset:48;animation:mhd-draw .45s .35s ease-out forwards}
@media (prefers-reduced-motion: reduce){.mhd-success-circle,.mhd-success-check{animation:none}.mhd-success-check{stroke-dashoffset:0}}
`;

/* ---------- Profil ---------- */

type Profile = {
  name: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  country: string;
  licenseNo: string;
  capacity: string;
};

const EMPTY_PROFILE: Profile = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  city: "",
  province: "",
  country: "",
  licenseNo: "",
  capacity: "",
};

type FieldId =
  | "name" | "contact" | "email" | "phone" | "city"
  | "province" | "country" | "license" | "capacity";

const STATE_KEY: Record<FieldId, keyof Profile> = {
  name: "name",
  contact: "contact",
  email: "email",
  phone: "phone",
  city: "city",
  province: "province",
  country: "country",
  license: "licenseNo",
  capacity: "capacity",
};

type FieldCfg = { id: FieldId; required: boolean; full?: boolean; textarea?: boolean };

/* ---------- Kartu bagian ringkasan (Langkah 04) ---------- */

function ReviewSection({
  title,
  editAria,
  onEdit,
  children,
}: {
  title: string;
  editAria: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold-deep">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          aria-label={editAria}
          className="inline-flex min-h-[32px] items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="pencil" className="h-3.5 w-3.5" />
          {t("nusJoin.rEdit")}
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/* ================= View ================= */

export function DaftarView() {
  const { t } = useT();
  const { toast } = useToast();

  // Langkah: 0 = pilih peran, 1..5 = Profil..Kirim, 6 = sukses.
  const [step, setStep] = useState(0);
  const [roleCode, setRoleCode] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [truth, setTruth] = useState(false);
  const [truthErr, setTruthErr] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);

  // Task 22 — AUTO-ISI dari registri: nomor izin diketik → nama/kota/provinsi/kontak terisi.
  const [licAuto, setLicAuto] = useState<{ state: "idle" | "checking" | "ok" | "miss"; name?: string }>({ state: "idle" });
  const licTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoIsiLicense = (value: string) => {
    const v = value.trim();
    if (v.length < 4) {
      setLicAuto({ state: "idle" });
      return;
    }
    setLicAuto({ state: "checking" });
    fetch(`/api/members/lookup?licenseNo=${encodeURIComponent(v)}`)
      .then((r) => r.json())
      .then((d: { found: boolean; member?: { name: string; city: string; province: string; phone: string | null; email: string | null } }) => {
        if (d?.found && d.member) {
          const m = d.member;
          setProfile((p) => ({
            ...p,
            name: p.name || m.name,
            city: p.city || m.city || "",
            province: p.province || m.province || "",
            phone: p.phone || m.phone || "",
            email: p.email || m.email || "",
          }));
          setLicAuto({ state: "ok", name: m.name });
        } else setLicAuto({ state: "miss" });
      })
      .catch(() => setLicAuto({ state: "idle" }));
  };

  const onLicenseChange = (value: string) => {
    setProfile((p) => ({ ...p, licenseNo: value }));
    if (licTimer.current) clearTimeout(licTimer.current);
    licTimer.current = setTimeout(() => autoIsiLicense(value), 600);
  };
  const [queue, setQueue] = useState<number | null>(null); // Task 53 — nomor urut realtime

  /* Turunan dari peran terpilih */
  const role = useMemo(() => REG_ROLES.find((r) => r.code === roleCode) ?? null, [roleCode]);
  const kind: Kind | null = role ? kindOfRole(role.group) : null;
  const licenseRequired = role ? kind === "org" && LICENSED_CODES.includes(role.code) : false;
  const docSet = useMemo(
    () => (kind === "org" && !licenseRequired
      ? ["legalitas", "orgProfile", "orgStructure"]
      : kind ? DOC_SETS[kind] : []),
    [kind, licenseRequired]
  );
  const svcList = useMemo(() => (role ? SVC_BY_ROLE[role.code] ?? [] : []), [role]);
  const roleLabel = role ? t(`nusJoin.role.${role.code}`) : "";
  const checkedDocs = useMemo(() => docSet.filter((id) => docs[id]), [docSet, docs]);

  /* Kolom profil dinamis per peran */
  const fields: FieldCfg[] = useMemo(() => {
    if (kind === "individual") {
      return [
        { id: "name", required: true, full: true },
        { id: "email", required: true },
        { id: "phone", required: true },
        { id: "city", required: true },
        { id: "province", required: true },
      ];
    }
    if (kind === "org") {
      return [
        { id: "license", required: licenseRequired, full: true },
        { id: "name", required: true, full: true },
        { id: "contact", required: true },
        { id: "email", required: true },
        { id: "phone", required: true },
        { id: "city", required: true },
        { id: "province", required: true },
      ];
    }
    if (kind === "provider") {
      return [
        { id: "name", required: true, full: true },
        { id: "country", required: true },
        { id: "contact", required: true },
        { id: "email", required: true },
        { id: "phone", required: true },
        { id: "city", required: true },
        { id: "capacity", required: false, full: true, textarea: true },
      ];
    }
    // Teknologi / Partner
    return [
      { id: "name", required: true, full: true },
      { id: "contact", required: true },
      { id: "email", required: true },
      { id: "phone", required: true },
      { id: "city", required: true },
    ];
  }, [kind, licenseRequired]);

  const labelKey = (id: FieldId): string => {
    if (id === "name") {
      if (kind === "individual") return "labelFullName";
      if (kind === "org") return "labelOrgName";
      if (kind === "provider") return "labelBrandName";
      return "labelOrgBrand";
    }
    if (id === "contact") return kind === "org" ? "labelContact" : "labelPic";
    if (id === "city") return kind === "tech" ? "labelCityCountry" : "labelCity";
    return `label${id.charAt(0).toUpperCase()}${id.slice(1)}`;
  };

  const phKey = (id: FieldId): string => {
    if (id === "name") {
      if (kind === "individual") return "phFullName";
      if (kind === "org") return "phOrgName";
      if (kind === "provider") return "phBrandName";
      return "phOrgBrand";
    }
    if (id === "contact") return kind === "org" ? "phContact" : "phPic";
    if (id === "city") return kind === "tech" ? "phCityCountry" : "phCity";
    return `ph${id.charAt(0).toUpperCase()}${id.slice(1)}`;
  };

  /* Scroll halus ke atas setiap pergantian langkah (hormati reduced motion) */
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step]);

  /* ---------- Aksi ---------- */

  const pickRole = (code: string) => {
    if (code !== roleCode) {
      const r = REG_ROLES.find((x) => x.code === code);
      const k = kindOfRole(r?.group ?? "");
      setRoleCode(code);
      setProfile({
        ...EMPTY_PROFILE,
        country: k === "provider" ? (code === "PROVIDER_SAUDI" ? "Saudi Arabia" : "Indonesia") : "",
      });
      setErrors({});
      setDocs({});
      setServices([]);
      setTruth(false);
      setTruthErr(false);
      setConsent(false);
    }
    setStep(1);
  };

  const go = (n: number) => setStep(Math.max(0, Math.min(5, n)));

  const setField = (id: FieldId) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const key = STATE_KEY[id];
    setProfile((p) => ({ ...p, [key]: e.target.value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validateProfile = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const val = profile[STATE_KEY[f.id]];
      if (f.required && !val.trim()) errs[f.id] = t("nusJoin.errRequired");
    }
    if (profile.email.trim() && !EMAIL_RE.test(profile.email.trim())) {
      errs.email = t("nusJoin.errEmail");
    }
    if (profile.phone.trim() && profile.phone.replace(/\D/g, "").length < 8) {
      errs.phone = t("nusJoin.errPhone");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextProfile = () => {
    if (validateProfile()) go(2);
  };

  const toggleDoc = (id: string, v: boolean | "indeterminate") => {
    setDocs((prev) => ({ ...prev, [id]: v === true }));
  };

  const toggleSvc = (id: string) => {
    setServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const nextDocs = () => {
    if (!truth) {
      setTruthErr(true);
      return;
    }
    setTruthErr(false);
    go(3);
  };

  const buildMessage = (): string => {
    const svcText = services.length ? services.map((id) => t(`nusJoin.svc.${id}`)).join(", ") : "-";
    const docText = checkedDocs.length ? checkedDocs.map((id) => t(`nusJoin.doc.${id}`)).join(", ") : "-";
    let msg = `Peran: ${roleLabel}\nLayanan: ${svcText}\nDokumen: ${docText}`;
    if (kind === "provider") msg += `\nNegara: ${profile.country.trim()}`;
    return msg.length > 400 ? `${msg.slice(0, 397)}...` : msg;
  };

  const submit = async () => {
    if (!role || loading) return;
    setLoading(true);
    try {
      const body = {
        orgName: profile.name.trim(),
        type: role.type,
        contactName: (kind === "individual" ? profile.name : profile.contact).trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        city: profile.city.trim(),
        province: profile.province.trim(),
        licenseNo: profile.licenseNo.trim() || "",
        message: buildMessage(),
      };
      const res = await apiSend<{ ticketCode: string; queueNumber: number | null }>(
        "/api/applications",
        "POST",
        body
      );
      try {
        localStorage.setItem("muhdin-ticket", res.ticketCode);
      } catch {
        /* penyimpanan lokal tidak tersedia — kode tetap ditampilkan */
      }
      setTicket(res.ticketCode);
      setQueue(res.queueNumber ?? null);
      if (typeof res.queueNumber === "number" && res.queueNumber > 0) {
        try {
          localStorage.setItem("muhdin-queue-number", String(res.queueNumber));
        } catch {
          /* penyimpanan lokal tidak tersedia */
        }
        // Task 53 — tandai slot milik pengunjung di seluruh papan yang terbuka.
        window.dispatchEvent(
          new CustomEvent<number | null>("muhdin:queue-set", { detail: res.queueNumber })
        );
      }
      setStep(6);
      dispatchPromoRefresh(); // Task 52 — perbarui counter pendaftar gratis di seluruh situs seketika
      toast({ title: t("nusJoin.toastSuccessTitle"), description: t("nusJoin.toastSuccessDesc") });
    } catch (e) {
      toast({
        title: t("nusJoin.toastFailTitle"),
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyTicket = async () => {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket);
      toast({ title: t("nusJoin.toastCopiedTitle"), description: t("nusJoin.toastCopiedDesc") });
    } catch {
      toast({
        title: t("nusJoin.toastCopyFailTitle"),
        description: t("nusJoin.toastCopyFailDesc"),
        variant: "destructive",
      });
    }
  };

  /* ---------- Sub-render ---------- */

  const progress = step >= 6 ? 100 : (step / 6) * 100;

  const renderStepper = () => (
    <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <ol
          aria-label={t(`${NS}.stepperAria`)}
          className="scrollbar-thin flex items-center gap-1 overflow-x-auto py-2.5"
        >
          {STEP_ITEMS.map((s, idx) => {
            const n = idx + 1;
            const done = step > n;
            const active = step === n;
            return (
              <li key={s.n} className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={!done || active}
                  onClick={() => go(n)}
                  aria-label={`${s.n} ${t(`${NS}.${s.key}`)}`}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[11px] font-extrabold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                    active && "bg-gold/15 text-gold-deep ring-1 ring-gold/50",
                    done && !active && "text-primary hover:bg-primary/5",
                    !done && !active && "text-muted-foreground/70"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-extrabold",
                      done ? "bg-primary text-white" : active ? "bg-gold text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? <Icon name="check-circle-2" className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  <span className="whitespace-nowrap">{t(`${NS}.${s.key}`)}</span>
                </button>
                {idx < STEP_ITEMS.length - 1 && (
                  <span aria-hidden className="h-px w-3 shrink-0 bg-border" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <Progress value={progress} className="h-0.5 rounded-none bg-border" aria-hidden />
    </div>
  );

  const backBtn = (
    <Button
      type="button"
      variant="outline"
      onClick={() => go(step - 1)}
      disabled={loading}
      className="min-h-11 sm:min-w-36"
    >
      <Icon name="chevron-right" className="me-1.5 h-4 w-4 rotate-180 rtl:rotate-0" />
      {t(`${NS}.btnBack`)}
    </Button>
  );

  const nextBtn = (onClick: () => void, disabled?: boolean, label?: string) => (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="min-h-11 flex-1 bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg sm:flex-none sm:px-8"
    >
      {label ?? t(`${NS}.btnNext`)}
      <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" />
    </Button>
  );

  const renderFieldError = (id: FieldId) =>
    errors[id] ? (
      <p role="alert" className="flex items-center gap-1 text-xs font-semibold text-destructive">
        <Icon name="alert-triangle" className="h-3 w-3 shrink-0" />
        {errors[id]}
      </p>
    ) : null;

  /* ---------- LANGKAH 0 — pilih peran ---------- */

  const renderStep0 = () => (
    <div>
      <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t(`${NS}.pickTitle`)}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
        {t(`${NS}.pickDesc`)}
      </p>
      {GROUP_ORDER.map((group) => {
        const roles = REG_ROLES.filter((r) => r.group === group);
        if (!roles.length) return null;
        return (
          <div key={group} className="mt-8">
            <h3 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold-deep">
              <span aria-hidden className="h-px w-5 bg-gold/60" />
              {t(`${NS}.group.${group}`)}
              <span aria-hidden className="h-px flex-1 bg-border" />
            </h3>
            <div
              role="group"
              aria-label={t(`${NS}.group.${group}`)}
              className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {roles.map((r) => {
                const selected = roleCode === r.code;
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => pickRole(r.code)}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-[60px] items-center gap-3 rounded-2xl border bg-card p-3.5 text-start transition-all hover:border-gold/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      selected ? "border-gold bg-gold/5 ring-2 ring-gold/60" : "border-border"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                        selected ? "bg-gold/20 text-gold-deep" : "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon name={r.icon} className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold leading-tight">{t(`nusJoin.role.${r.code}`)}</span>
                    {selected && (
                      <Icon name="check-circle-2" className="ms-auto h-4 w-4 shrink-0 text-gold-deep" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ---------- LANGKAH 01 — profil ---------- */

  const renderStep1 = () => (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{t(`${NS}.pHeading`)}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t(`${NS}.pDesc`)}</p>
        </div>
        <button
          type="button"
          onClick={() => go(0)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-xs font-bold text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="refresh" className="h-3.5 w-3.5" />
          {t(`${NS}.changeRole`)}
        </button>
      </div>

      {role && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-gold/40 bg-gold/5 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-deep">
            <Icon name={role.icon} className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold">{roleLabel}</span>
        </div>
      )}

      {(kind === "org" || kind === "provider") && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed bg-muted/30 p-3">
          <span className="text-xs font-bold text-muted-foreground">
            {t(`${NS}.${kind === "org" ? "labelTypeAuto" : "labelCategoryAuto"}`)}
          </span>
          <Badge variant="outline" className="border-gold/50 bg-gold/10 text-gold-deep">
            <Icon name={role?.icon ?? "hexagon"} className="me-1 h-3 w-3" />
            {roleLabel}
          </Badge>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `d-${f.id}`;
          const key = STATE_KEY[f.id];
          return (
            <div key={f.id} className={cn("space-y-1.5", f.full && "sm:col-span-2")}>
              <Label htmlFor={id}>
                {t(`${NS}.${labelKey(f.id)}`)}
                {f.required && <span aria-hidden> *</span>}
              </Label>
              {f.textarea ? (
                <Textarea
                  id={id}
                  value={profile[key]}
                  onChange={setField(f.id)}
                  rows={1}
                  placeholder={t(`${NS}.${phKey(f.id)}`)}
                  aria-label={t(`${NS}.${labelKey(f.id)}`)}
                  aria-invalid={!!errors[f.id]}
                  aria-required={f.required || undefined}
                  className="min-h-11"
                />
              ) : (
                <Input
                  id={id}
                  value={profile[key]}
                  onChange={f.id === "license" ? (e) => onLicenseChange(e.target.value) : setField(f.id)}
                  onBlur={f.id === "license" ? () => autoIsiLicense(profile.licenseNo) : undefined}
                  placeholder={t(`${NS}.${phKey(f.id)}`)}
                  type={f.id === "email" ? "email" : "text"}
                  autoComplete={
                    f.id === "email"
                      ? "email"
                      : f.id === "phone"
                        ? "tel"
                        : f.id === "name" || f.id === "contact"
                          ? "name"
                          : "off"
                  }
                  aria-label={t(`${NS}.${labelKey(f.id)}`)}
                  aria-invalid={!!errors[f.id]}
                  aria-required={f.required || undefined}
                />
              )}
              {f.id === "license" && (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {t(`${NS}.${licenseRequired ? "licenseHint" : "licenseOptHint"}`)}
                </p>
              )}
              {f.id === "license" && licAuto.state === "checking" && (
                <p className="text-[11px] text-muted-foreground" aria-live="polite">{t(`${NS}.autofillChecking`)}</p>
              )}
              {f.id === "license" && licAuto.state === "ok" && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400" aria-live="polite">
                  ✓ {t(`${NS}.autofillOk`)} — {licAuto.name}
                </p>
              )}
              {f.id === "license" && licAuto.state === "miss" && (
                <p className="text-[11px] text-muted-foreground" aria-live="polite">{t(`${NS}.autofillMiss`)}</p>
              )}
              {renderFieldError(f.id)}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        {backBtn}
        {nextBtn(nextProfile)}
      </div>
    </div>
  );

  /* ---------- LANGKAH 02 — dokumen ---------- */

  const renderStep2 = () => (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight">{t(`${NS}.dHeading`)}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{t(`${NS}.dDesc`)}</p>

      <div className="mt-5 space-y-2.5">
        {docSet.map((id) => (
          <label
            key={id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-gold/50 focus-within:ring-2 focus-within:ring-ring",
              docs[id] ? "border-primary/40 bg-primary/5" : "border-border"
            )}
          >
            <Checkbox
              checked={!!docs[id]}
              onCheckedChange={(v) => toggleDoc(id, v)}
              className="mt-0.5"
              aria-label={t(`nusJoin.doc.${id}`)}
            />
            <span>
              <span className="block text-sm font-bold">{t(`nusJoin.doc.${id}`)}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {t(`nusJoin.doc.${id}Desc`)}
              </span>
            </span>
          </label>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-xs leading-relaxed text-foreground/85">
        <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" />
        {t(`${NS}.uploadNote`)}
      </p>

      <label
        className={cn(
          "mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring",
          truth
            ? "border-primary/40 bg-primary/5"
            : truthErr
              ? "border-destructive/50 bg-destructive/5"
              : "border-border"
        )}
      >
        <Checkbox
          checked={truth}
          onCheckedChange={(v) => {
            setTruth(v === true);
            if (v === true) setTruthErr(false);
          }}
          className="mt-0.5"
          aria-label={t(`${NS}.truthLabel`)}
        />
        <span className="text-sm font-semibold leading-relaxed">{t(`${NS}.truthLabel`)}</span>
      </label>
      {truthErr && !truth && (
        <p role="alert" className="mt-2 flex items-center gap-1 text-xs font-semibold text-destructive">
          <Icon name="alert-triangle" className="h-3 w-3 shrink-0" />
          {t(`${NS}.errTruth`)}
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        {backBtn}
        {nextBtn(nextDocs)}
      </div>
    </div>
  );

  /* ---------- LANGKAH 03 — layanan ---------- */

  const renderStep3 = () => (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight">{t(`${NS}.sHeading`)}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{t(`${NS}.sDesc`)}</p>

      <div role="group" aria-label={t(`${NS}.sHeading`)} className="mt-5 flex flex-wrap gap-2">
        {svcList.map((id) => {
          const sel = services.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleSvc(id)}
              aria-pressed={sel}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                sel
                  ? "border-gold bg-gold/15 text-gold-deep ring-1 ring-gold/50"
                  : "border-border bg-card text-foreground hover:border-gold/50"
              )}
            >
              {sel && <Icon name="check-circle-2" className="h-3.5 w-3.5" />}
              {t(`nusJoin.svc.${id}`)}
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
        {t(`${NS}.sOptionalNote`)}
      </p>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        {backBtn}
        {nextBtn(() => go(4))}
      </div>
    </div>
  );

  /* ---------- LANGKAH 04 — tinjau ---------- */

  const renderStep4 = () => (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight">{t(`${NS}.rHeading`)}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{t(`${NS}.rDesc`)}</p>

      <div className="mt-5 space-y-3.5">
        {/* Peran */}
        <ReviewSection
          title={t(`${NS}.rRole`)}
          editAria={t(`${NS}.rEditAria`, { section: t(`${NS}.rRole`) })}
          onEdit={() => go(0)}
        >
          {role && (
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-deep">
                <Icon name={role.icon} className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold">{roleLabel}</span>
            </div>
          )}
        </ReviewSection>

        {/* Profil */}
        <ReviewSection
          title={t(`${NS}.rProfile`)}
          editAria={t(`${NS}.rEditAria`, { section: t(`${NS}.rProfile`) })}
          onEdit={() => go(1)}
        >
          <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t(`${NS}.rName`)}</dt>
              <dd className="mt-0.5 text-sm font-semibold">{profile.name || t(`${NS}.rNone`)}</dd>
            </div>
            {kind !== "individual" && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t(`${NS}.${kind === "org" ? "rContact" : "rPic"}`)}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">{profile.contact || t(`${NS}.rNone`)}</dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t(`${NS}.rEmail`)}</dt>
              <dd className="mt-0.5 text-sm font-semibold" dir="ltr">{profile.email || t(`${NS}.rNone`)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t(`${NS}.rPhone`)}</dt>
              <dd className="mt-0.5 text-sm font-semibold" dir="ltr">{profile.phone || t(`${NS}.rNone`)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t(`${NS}.rCity`)}</dt>
              <dd className="mt-0.5 text-sm font-semibold">{profile.city || t(`${NS}.rNone`)}</dd>
            </div>
            {(kind === "individual" || kind === "org") && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t(`${NS}.rProvince`)}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{profile.province || t(`${NS}.rNone`)}</dd>
              </div>
            )}
            {kind === "provider" && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t(`${NS}.rCountry`)}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{profile.country || t(`${NS}.rNone`)}</dd>
              </div>
            )}
            {kind === "org" && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t(`${NS}.rLicense`)}</dt>
                <dd className="mt-0.5 text-sm font-semibold" dir="ltr">
                  {profile.licenseNo.trim() || t(`${NS}.rNone`)}
                </dd>
              </div>
            )}
            {kind === "provider" && !!profile.capacity.trim() && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t(`${NS}.rCapacity`)}</dt>
                <dd className="mt-0.5 text-sm">{profile.capacity}</dd>
              </div>
            )}
          </dl>
        </ReviewSection>

        {/* Dokumen */}
        <ReviewSection
          title={t(`${NS}.rDocs`)}
          editAria={t(`${NS}.rEditAria`, { section: t(`${NS}.rDocs`) })}
          onEdit={() => go(2)}
        >
          {checkedDocs.length ? (
            <ul className="space-y-1.5">
              {checkedDocs.map((id) => (
                <li key={id} className="flex items-center gap-2 text-sm font-semibold">
                  <Icon name="check-circle-2" className="h-4 w-4 shrink-0 text-primary" />
                  {t(`nusJoin.doc.${id}`)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t(`${NS}.rNone`)}</p>
          )}
        </ReviewSection>

        {/* Layanan */}
        <ReviewSection
          title={t(`${NS}.rServices`)}
          editAria={t(`${NS}.rEditAria`, { section: t(`${NS}.rServices`) })}
          onEdit={() => go(3)}
        >
          {services.length ? (
            <div className="flex flex-wrap gap-1.5">
              {services.map((id) => (
                <Badge key={id} variant="outline" className="border-gold/50 bg-gold/10 text-gold-deep">
                  {t(`nusJoin.svc.${id}`)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t(`${NS}.rNone`)}</p>
          )}
        </ReviewSection>

        {/* Persetujuan privasi — WAJIB sebelum lanjut ke Langkah 05 */}
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring",
            consent ? "border-primary/40 bg-primary/5" : "border-destructive/30 bg-destructive/5"
          )}
        >
          <Checkbox
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
            aria-label={`${t(`${NS}.consentBefore`)} ${t(`${NS}.consentLink`)} ${t(`${NS}.consentAfter`)}`}
          />
          <span className="text-xs leading-relaxed sm:text-sm">
            {t(`${NS}.consentBefore`)}{" "}
            <a
              href="#/privasi"
              target="_self"
              className="font-bold text-primary underline underline-offset-2 hover:text-gold-deep"
            >
              {t(`${NS}.consentLink`)}
            </a>{" "}
            {t(`${NS}.consentAfter`)}
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {backBtn}
          {nextBtn(() => go(5), !consent)}
        </div>
      </div>
    </div>
  );

  /* ---------- LANGKAH 05 — kirim ---------- */

  const renderStep5 = () => (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold/15 text-gold-deep">
        <Icon name="send" className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight">{t(`${NS}.sendHeading`)}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t(`${NS}.sendDesc`)}</p>

      {role && (
        <div className="mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold/5 p-3.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-deep">
            <Icon name={role.icon} className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold">{roleLabel}</span>
          <span aria-hidden className="h-4 w-px bg-border" />
          <span className="truncate text-sm text-muted-foreground">{profile.name}</span>
        </div>
      )}

      <Button
        type="button"
        onClick={submit}
        disabled={!consent || loading}
        className="mt-6 min-h-14 w-full max-w-md text-lg bg-gradient-to-r from-primary to-forest text-white shadow-lg hover:shadow-xl"
        aria-label={t(`${NS}.btnSubmit`)}
      >
        {loading ? (
          <Icon name="loader-2" className="me-2 h-5 w-5 motion-safe:animate-spin" />
        ) : (
          <Icon name="send" className="me-2 h-5 w-5" />
        )}
        {loading ? t(`${NS}.btnSubmitting`) : t(`${NS}.btnSubmit`)}
      </Button>

      {!consent && (
        <p role="alert" className="mx-auto mt-3 flex max-w-md items-center justify-center gap-1.5 text-xs font-semibold text-destructive">
          <Icon name="alert-triangle" className="h-3.5 w-3.5 shrink-0" />
          {t(`${NS}.errConsentBack`)}
        </p>
      )}

      <p className="mx-auto mt-5 max-w-md text-[11px] leading-relaxed text-muted-foreground">
        {t(`${NS}.disclaimer`)}
      </p>

      <div className="mt-6 flex justify-center">
        {backBtn}
      </div>
    </div>
  );

  /* ---------- SUKSES ---------- */

  const renderSuccess = () => (
    <div
      role="status"
      aria-label={t(`${NS}.successAria`)}
      className="rounded-3xl border border-gold/40 bg-card p-6 text-center shadow-md sm:p-10"
    >
      <style>{SUCCESS_CSS}</style>
      <svg viewBox="0 0 52 52" className="mx-auto h-20 w-20" aria-hidden="true" focusable="false">
        <circle cx="26" cy="26" r="24" className="mhd-success-circle fill-gold/15 stroke-gold" strokeWidth="2" />
        <path
          d="M15 27l7.5 7.5L37 20"
          fill="none"
          className="mhd-success-check stroke-gold-deep"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h2 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t(`${NS}.successTitle`)}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t(`${NS}.successDesc`)}</p>

      {/* Task 53 — nomor urut realtime + konfeti */}
      <QueueSuccessCard queueNumber={queue} />

      <div className="mt-6 rounded-2xl border bg-muted/40 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t(`${NS}.ticketLabel`)}
        </p>
        <p
          className="mt-2 select-all break-all font-mono text-3xl font-extrabold tracking-widest text-primary sm:text-4xl"
          dir="ltr"
        >
          {ticket}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={copyTicket}
          aria-label={t(`${NS}.ticketCopyAria`)}
          className="mt-4 min-h-11"
        >
          <Icon name="file-text" className="me-1.5 h-4 w-4" />
          {t(`${NS}.ticketCopy`)}
        </Button>
      </div>

      <div className="mx-auto mt-7 grid max-w-xl gap-2.5 sm:grid-cols-3">
        <Button
          type="button"
          onClick={() => navigate("dashboard")}
          className="min-h-12 bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg"
        >
          <Icon name="layout-dashboard" className="me-1.5 h-4 w-4" />
          {t(`${NS}.ctaDashboard`)}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate("lacak")} className="min-h-12">
          <Icon name="search" className="me-1.5 h-4 w-4" />
          {t(`${NS}.ctaTrack`)}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate("beranda")} className="min-h-12">
          <Icon name="chevron-right" className="me-1.5 h-4 w-4 rotate-180 rtl:rotate-0" />
          {t(`${NS}.ctaHome`)}
        </Button>
      </div>
    </div>
  );

  /* ---------- Rangka halaman ---------- */

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span aria-hidden className="h-px w-6 bg-current opacity-60" />
              {t(`${NS}.eyebrow`)}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t(`${NS}.title`)}
            </h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t(`${NS}.subtitle`)}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-gold-soft">
              <Icon name="check-circle-2" className="h-4 w-4" aria-hidden />
              {t(`${NS}.freeBadge`)}
            </p>
            {/* Task 52 — penghitung pendaftar gratis live di header formulir */}
            <PromoSlotLine dark className="mt-3 justify-start" />
          </Reveal>
        </div>
      </section>

      {step < 6 && renderStepper()}

      <section className="py-8 sm:py-12">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-background/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full border-4 border-gold/25 border-t-gold motion-safe:animate-spin" />
                <p className="text-sm font-semibold text-muted-foreground">{t(`${NS}.sendingOverlay`)}</p>
              </div>
            </div>
          )}
          <Reveal key={step}>
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
            {step === 6 && renderSuccess()}
          </Reveal>
        </div>
      </section>

      {/* Task 53 — papan slot pendaftaran realtime (selalu tampil di halaman daftar) */}
      <LiveSlotBoardSection className="border-t border-border/60 bg-muted/20" />
    </div>
  );
}
