// Shared client-side types mirroring Prisma models

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover: string | null;
  status: string;
  featured: boolean;
  views: number;
  author: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ecosystem {
  id: string;
  number: number;
  name: string;
  cluster: string;
  scope: string;
  standard: string;
  icon: string;
  color: string;
  description: string;
  image: string | null;
}

export interface JourneyStep {
  id: string;
  step: number;
  title: string;
  activity: string;
  actor: string;
  output: string;
  icon: string;
}

export interface Roadmap {
  id: string;
  phase: string;
  period: string;
  focus: string;
  deliverables: string;
  order: number;
}

// v12.2 «99 ROADMAP UPGRADE» — item upgrade granular.
export type RoadmapPillar = "JAMAAH" | "AKADEMI" | "BISNIS" | "PLATFORM" | "KEAMANAN" | "EKOSISTEM";
export type RoadmapStatus = "DONE" | "IN_PROGRESS" | "PLANNED";
export interface RoadmapItem {
  id: string;
  code: string;
  pillar: RoadmapPillar | string;
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2" | "P3" | string;
  effort: "S" | "M" | "L" | "XL" | string;
  status: RoadmapStatus | string;
  target: string;
  order: number;
}

export interface Member {
  id: string;
  name: string;
  type: string;
  city: string;
  province: string;
  licenseNo: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  rating: number;
  status: string;
  memberSince: number;
}

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  duration: number;
  summary: string;
  content: string;
  order: number;
  published: boolean;
  views: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface MembershipApplication {
  id: string;
  orgName: string;
  type: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  licenseNo: string;
  message: string | null;
  status: string;
  ticketCode?: string;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  published: boolean;
}

export interface ManagementMember {
  id: string;
  name: string;
  position: string;
  bio: string | null;
  order: number;
}

/** Jaringan kepengurusan daerah — DPD/DPC & Branch Office (Task 19). */
export interface RegionalBranchItem {
  id: string;
  name: string;
  code: string;
  province: string;
  city: string;
  officeName: string;
  address: string;
  picName: string;
  picPhone: string;
  email: string | null;
  description: string | null;
  published: boolean;
  order: number;
}

export interface SiteSettings {
  [key: string]: string;
}

export interface AdminStats {
  articles: number;
  tutorials: number;
  members: number;
  pendingMembers: number;
  unreadMessages: number;
  pendingApplications: number;
  unreadComplaints?: number;
  subscribers?: number;
  totalViews: number;
  testimonials: number;
  faqs: number;
  byCategory: { category: string; count: number }[];
  memberByType?: { type: string; count: number }[]; // Task 33 — grup keanggotaan per jenis
  recentMessages: ContactMessage[];
  recentApplications: MembershipApplication[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
}

/** Task 15-c — baris daftar akun admin (tanpa password). */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Task 15-d — konfigurasi notifikasi WhatsApp (token tidak pernah dikirim balik). */
export interface WhatsAppConfig {
  provider: string;
  apiUrl: string;
  target: string;
  enabled: boolean;
  notifyContact: boolean;
  notifyApplication: boolean;
  notifyAcademy: boolean; // v11.1 — pendaftaran kursus & sertifikat
  notifyBooking: boolean; // v11.1 — booking slot layanan
  notifyBenefit: boolean; // v11.1 — penebusan benefit mitra
  notifyCompliance: boolean; // v12.1 — audit kepatuhan izin (god-mode)
  hasToken: boolean;
  tokenMasked: string;
  botEnabled: boolean; // v5 Fase 2 — chatbot AI WhatsApp
  botSecretSet: boolean;
  botSecretMasked: string;
  lastTestAt: string | null;
  lastTestStatus: string;
}

/** Task 60 — konfigurasi notifikasi email sekretariat (App Password dimasking). */
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  fromName: string;
  recipients: string[];
  enabled: boolean;
  notifyContact: boolean;
  notifyApplication: boolean;
  notifyComplaint: boolean;
  notifySubscriber: boolean;
  notifyTestimonial: boolean;
  notifyAcademy: boolean; // v11.1 — pendaftaran kursus & sertifikat
  notifyBooking: boolean; // v11.1 — booking slot layanan
  notifyBenefit: boolean; // v11.1 — penebusan benefit mitra
  notifyCompliance: boolean; // v12.1 — audit kepatuhan izin (god-mode)
  hasPass: boolean;
  passMasked: string;
  envFallback: boolean;
  effective: boolean;
  lastTestAt: string | null;
  lastTestStatus: string;
}

/** Task 60 — baris log audit notifikasi (email & WhatsApp). */
export interface NotificationLogItem {
  id: string;
  channel: string;
  eventType: string;
  status: string;
  recipient: string;
  subject: string;
  detail: string;
  refId: string | null;
  createdAt: string;
}

export interface NotificationLogResponse {
  logs: NotificationLogItem[];
  stats: { sent: number; failed: number };
}

// ==================== KELENGKAPAN PORTAL (Task 18) ====================

export interface GalleryItem {
  id: string;
  title: string;
  caption: string | null;
  category: string;
  imageUrl: string;
  order: number;
  published: boolean;
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  category: string;
  published: boolean;
  createdAt: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileType: string;
  published: boolean;
  downloads: number;
  createdAt: string;
}

export interface SubscriberItem {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ComplaintItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  targetMember: string | null;
  category: string;
  content: string;
  status: string; // UNREAD | PROCESSED | CLOSED
  responseNote: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string;
  role: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
}

/** R-094 — broadcast WA template terjadwal. */
export interface BroadcastItem {
  id: string;
  title: string;
  template: string;
  audience: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  sentCount: number;
  failCount: number;
  createdBy: string | null;
  createdAt: string;
}

/** R-047 — baris skor kualitas vendor. */
export interface VendorScoreRow {
  id: string;
  name: string;
  type: string;
  city: string;
  qualityScore: number | null;
  qualityGrade: string | null;
  qualityUpdatedAt: string | null;
  score: number;
  grade: string;
  reviewCount: number;
  avgRating: number | null;
  complaintCount: number;
  publishedPackages: number;
}

/** R-078 UU PDP — permintaan hak subjek data pribadi. */
export interface PrivacyRequestItem {
  id: string;
  type: "EXPORT" | "DELETE" | string;
  name: string;
  contact: string;
  message: string | null;
  status: "PENDING" | "PROCESSED" | "REJECTED" | string;
  result: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
}

/** Hasil pelacakan publik — data sensitif disamarkan. */
export interface TrackResult {
  found: boolean;
  ticketCode: string;
  queueNumber?: number | null; // Task 53 — nomor urut pendaftaran realtime
  orgName: string;
  type: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

// ==================== NUSUK ====================

export type NusukPermitType = "VISA" | "HANDLING" | "MUTAWIF" | "HOTEL" | "TRANSPORT" | "RAUDAH";

export interface NusukConnection {
  id: string;
  environment: string;
  status: string;
  autoSync: boolean;
  totalSyncs: number;
  lastSyncAt: string | null;
  apiKeyMasked?: string;
  apiKey?: string;
  webhookSecret?: string;
}

export interface NusukPermit {
  id: string;
  memberId: string;
  type: string;
  permitNo: string;
  holderName: string;
  meta: string | null;
  status: string;
  issuedAt: string;
  expiresAt: string;
  syncedAt: string;
  member?: { id: string; name: string; type: string; city: string; licenseNo: string };
}

export interface NusukSyncLog {
  id: string;
  type: string;
  status: string;
  message: string;
  recordsAffected: number;
  durationMs: number;
  createdAt: string;
}

export interface NusukMetrics {
  permitsTotal: number;
  permitsActive: number;
  permitsPending: number;
  permitsExpired: number;
  permitsRejected: number;
  membersConnected: number;
  successRate: number;
  syncsLast7d: number;
  avgDurationMs: number;
  byType: { type: string; total: number; active: number }[];
}

export interface NusukPublicData {
  connection: {
    status: string;
    environment: string;
    lastSyncAt: string | null;
    totalSyncs: number;
    autoSync: boolean;
  };
  metrics: NusukMetrics;
  ecosystems: { number: number; name: string; icon: string; cluster: string }[];
  recentLogs: NusukSyncLog[];
  topMembers: {
    id: string;
    name: string;
    type: string;
    city: string;
    activePermits: number;
    compliance: number;
  }[];
}

export interface NusukSyncResult {
  logId: string;
  status: string;
  message: string;
  created: number;
  updated: number;
  expired: number;
  skipped: number;
  recordsAffected: number;
  durationMs: number;
}

// ==================== v5.0 — MARKETPLACE / FORUM / KARTU ====================

export interface MemberLite {
  id: string;
  name: string;
  type: string;
  city: string;
  licenseNo: string;
  status: string;
  rating: number;
}

export interface TourPackageItem {
  id: string;
  memberId: string;
  member: MemberLite;
  title: string;
  type: string;
  city: string;
  description: string;
  price: number;
  durationDays: number;
  departureDate: string | null;
  slots: number;
  slotsTaken: number;
  hotelMakkah: string;
  hotelMadinah: string;
  airline: string;
  status: string;
  featured: boolean;
  slug?: string | null;
  image?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  /** R-043 v14.1 — label promo harga musiman/early bird aktif (dari API). */
  promos?: string[];
}

export interface PackageBookingItem {
  id: string;
  packageId: string;
  pkg?: { id: string; title: string; type: string; city: string; price: number };
  name: string;
  phone: string;
  email: string | null;
  pilgrims: number;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumThreadItem {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorContact?: string;
  category: string;
  status: string;
  pinned: boolean;
  views: number;
  spamScore?: number;
  spamReasons?: string | null;
  replyCount?: number;
  pendingReplies?: number;
  createdAt: string;
  updatedAt: string;
  replies?: ForumReplyItem[];
}

export interface ForumReplyItem {
  id: string;
  threadId: string;
  threadTitle?: string;
  threadStatus?: string;
  authorName: string;
  body: string;
  status: string;
  spamScore?: number;
  spamReasons?: string | null;
  createdAt: string;
}

export interface PilgrimCardItem {
  id: string;
  cardNo: string;
  fullName: string;
  phone: string;
  type: string;
  memberId: string | null;
  member?: { id: string; name: string; city: string } | null;
  groupName: string;
  status: string;
  validUntil: string | null;
  issuedBy: string;
  note: string | null;
  scans: number;
  lastScanAt: string | null;
  createdAt: string;
}

// ==================== V6.0 — EKOSISTEM HULU-HILIR ====================

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  contact: string;
  phone: string;
  email: string | null;
  website: string | null;
  services: string;
  rating: number;
  verified: boolean;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface ComplianceDocItem {
  id: string;
  memberId: string;
  member?: { id: string; name: string; type: string; city: string; licenseNo: string; status: string };
  kind: string;
  docNo: string;
  issuedBy: string;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  verified: boolean;
  note: string | null;
  /** dihitung server: VALID | EXPIRING (≤90 hari) | EXPIRED */
  lifecycle: string;
  daysLeft: number | null;
  createdAt: string;
}

export interface SeatListingItem {
  id: string;
  memberId: string;
  member?: { id: string; name: string; type: string; city: string; licenseNo: string; status: string };
  packageId: string | null;
  pkg?: { id: string; title: string; type: string; city: string } | null;
  side: string;
  seats: number;
  pricePerSeat: number;
  departureDate: string | null;
  route: string;
  note: string | null;
  status: string;
  takerMemberId: string | null;
  taker?: { id: string; name: string } | null;
  takerNote: string | null;
  createdAt: string;
}

export interface MuthowifItem {
  id: string;
  fullName: string;
  certNo: string;
  agency: string;
  languages: string;
  specialties: string;
  experienceYears: number;
  phone: string;
  rating: number;
  availability: string;
  memberId: string | null;
  member?: { id: string; name: string; city: string } | null;
  /** R-021 v13.3 — catatan sertifikasi berjenjang untuk lencana portal. */
  certs?: { level: string; status: string; certNo: string | null; serviceHours: number; examScore: number }[];
  createdAt: string;
}

export interface JamaahDocItem {
  id: string;
  pilgrimCardId: string;
  card?: { id: string; cardNo: string; fullName: string; groupName: string; status: string } | null;
  kind: string;
  docNo: string;
  issueDate: string | null;
  expiryDate: string | null;
  fileUrl: string | null;
  verifyStatus: string;
  note: string | null;
  /** dihitung server: VALID | EXPIRING (≤90 hari) | EXPIRED */
  lifecycle: string;
  daysLeft: number | null;
  createdAt: string;
}

export interface PilgrimReviewItem {
  id: string;
  packageId: string;
  pkg?: { id: string; title: string; type: string } | null;
  cardNo: string;
  authorName: string;
  rating: number;
  hotelRate: number;
  transportRate: number;
  guideRate: number;
  body: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface SosPointItem {
  id: string;
  category: string;
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  phone2: string | null;
  hours: string;
  note: string | null;
  featured: boolean;
  createdAt: string;
}

// ==================== V7.0 — PINDAI IZIN 360° ====================

export interface RegistryDocItem {
  id: string;
  companyId: string;
  /** kunci katalog izin: NIB | AKTA | NPWP | BPW | PPIU | PPIU_AKREDITASI | PIHK | PIHK_ESCROW | IATA | MUTHOWIF_SDM | ASURANSI | DIGITAL */
  requirementKey: string;
  docNo: string;
  issuedBy: string;
  validUntil: string | null;
}

export interface RegistryCompanyItem {
  id: string;
  nib: string;
  name: string;
  legalEntity: string;
  city: string;
  province: string;
  phone: string;
  website: string | null;
  note: string | null;
  docs: RegistryDocItem[];
}
