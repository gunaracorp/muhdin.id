/**
 * fitur-v12b.ts — kamus i18n v12.2 «99 ROADMAP UPGRADE» (root `roadmap99`).
 * Satu file berisi ketiga locale { id, en, ar } dengan key identik.
 * Nilai kanonik di DB (JAMAAH/P0/DONE) dipetakan ke label via kunci di bawah.
 */
export const roadmap99Dict = {
  id: {
    roadmap99: {
      eyebrow: "99 ROADMAP UPGRADE — MENUJU v20",
      badge: "v12.2 · 99 ITEM",
      title: "PETA JALAN 99 UPGRADE MUHDIN.ID",
      subtitle:
        "Dibawah 4 fase makro 2026-2030, 99 upgrade granular dipetakan dalam 6 pilar — lengkap prioritas, upaya, status, dan target versi. Transparan untuk seluruh ekosistem: apa yang sudah hidup, sedang dikerjakan, dan direncanakan.",
      stats: {
        total: "Total upgrade",
        done: "Sudah hidup",
        inprogress: "Sedang dikerjakan",
        planned: "Direncanakan",
      },
      progress: { label: "Progres keseluruhan", unit: "selesai" },
      filter: { all: "Semua pilar", status: "Status", allStatus: "Semua status" },
      pillar: {
        JAMAAH: "Pengalaman Jamaah",
        AKADEMI: "Akademi & KTA",
        BISNIS: "Marketplace & Bisnis",
        PLATFORM: "Platform & Teknologi",
        KEAMANAN: "Keamanan & Kepatuhan",
        EKOSISTEM: "Ekosistem & Pertumbuhan",
      },
      status: { DONE: "Sudah hidup", IN_PROGRESS: "Dikerjakan", PLANNED: "Direncanakan" },
      priority: {
        label: "Prioritas",
        P0: "Kritis",
        P1: "Tinggi",
        P2: "Menengah",
        P3: "Nisbah",
      },
      effort: { label: "Upaya", S: "Kecil", M: "Sedang", L: "Besar", XL: "Sangat besar" },
      target: { label: "Target" },
      item: { count: "item upgrade" },
      empty: "Tidak ada item pada filter ini.",
      cta: {
        title: "Ingin mengusulkan upgrade ke-100?",
        sub: "Ide Anda bisa menjadi bagian peta jalan MUHDIN — sampaikan lewat WhatsApp resmi kami.",
        button: "Diskusikan via WhatsApp",
      },
    },
  },
  en: {
    roadmap99: {
      eyebrow: "99 ROADMAP UPGRADES — TOWARD v20",
      badge: "v12.2 · 99 ITEMS",
      title: "MUHDIN.ID 99-UPGRADE ROADMAP",
      subtitle:
        "Beneath the four macro phases of 2026-2030, 99 granular upgrades are mapped across 6 pillars — with priority, effort, status, and target version. Fully transparent to the whole ecosystem: what already lives, what is in progress, and what is planned.",
      stats: {
        total: "Total upgrades",
        done: "Already live",
        inprogress: "In progress",
        planned: "Planned",
      },
      progress: { label: "Overall progress", unit: "completed" },
      filter: { all: "All pillars", status: "Status", allStatus: "All statuses" },
      pillar: {
        JAMAAH: "Pilgrim Experience",
        AKADEMI: "Academy & KTA",
        BISNIS: "Marketplace & Business",
        PLATFORM: "Platform & Technology",
        KEAMANAN: "Security & Compliance",
        EKOSISTEM: "Ecosystem & Growth",
      },
      status: { DONE: "Live", IN_PROGRESS: "In progress", PLANNED: "Planned" },
      priority: {
        label: "Priority",
        P0: "Critical",
        P1: "High",
        P2: "Medium",
        P3: "Nice-to-have",
      },
      effort: { label: "Effort", S: "Small", M: "Medium", L: "Large", XL: "Very large" },
      target: { label: "Target" },
      item: { count: "upgrades" },
      empty: "No items match this filter.",
      cta: {
        title: "Want to propose upgrade #100?",
        sub: "Your idea could join the MUHDIN roadmap — reach us on our official WhatsApp.",
        button: "Discuss via WhatsApp",
      },
    },
  },
  ar: {
    roadmap99: {
      eyebrow: "٩٩ ترقية في خريطة الطريق — باتجاه v20",
      badge: "v12.2 · ٩٩ بندًا",
      title: "خريطة طريق الترقيات التسع والخمسين لمنصة MUHDIN.ID",
      subtitle:
        "تحت المراحل الكبرى الأربع ٢٠٢٦-٢٠٣٠، تم رسم ٩٩ ترقية تفصيلية عبر ٦ محاور — مع الأولوية والجهد والحالة والإصدار المستهدف. شفافية كاملة للمنظومة كلها: ما هو حيّ بالفعل، وما قيد العمل، وما هو مخطط له.",
      stats: {
        total: "إجمالي الترقيات",
        done: "قيد التشغيل",
        inprogress: "قيد التنفيذ",
        planned: "مخطط له",
      },
      progress: { label: "التقدم الإجمالي", unit: "مكتمل" },
      filter: { all: "كل المحاور", status: "الحالة", allStatus: "كل الحالات" },
      pillar: {
        JAMAAH: "تجربة الحجاج",
        AKADEMI: "الأكاديمية والعضوية",
        BISNIS: "السوق والأعمال",
        PLATFORM: "المنصة والتقنية",
        KEAMANAN: "الأمن والامتثال",
        EKOSISTEM: "المنظومة والنمو",
      },
      status: { DONE: "قيد التشغيل", IN_PROGRESS: "قيد التنفيذ", PLANNED: "مخطط له" },
      priority: {
        label: "الأولوية",
        P0: "حرجة",
        P1: "عالية",
        P2: "متوسطة",
        P3: "تكميلية",
      },
      effort: { label: "الجهد", S: "صغير", M: "متوسط", L: "كبير", XL: "كبير جدًا" },
      target: { label: "الهدف" },
      item: { count: "ترقيات" },
      empty: "لا توجد بنود مطابقة لهذا المرشّح.",
      cta: {
        title: "تريد اقتراح الترقية رقم ١٠٠؟",
        sub: "قد تنضم فكرتك إلى خريطة طريق MUHDIN — تواصل معنا عبر واتساب الرسمي.",
        button: "ناقش عبر واتساب",
      },
    },
  },
} as const;
