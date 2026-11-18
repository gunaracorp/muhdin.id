/**
 * kalender.ts — namespace "kalender" (R-017 v14.0 «KAMPANYE & KAWAL»).
 * Kerangka UI halaman Kalender Musim Umrah & Haji; isi catatan per bulan
 * dibawa dari lib/season-calendar.ts (tri-bahasa di sumber data).
 */
export const kalenderDict = {
  id: {
    kalender: {
      eyebrow: "PETA MUSIM TAHUNAN",
      title: "Kalender Musim Umrah & Haji",
      subtitle:
        "Pola permintaan 12 bulan, indikasi harga, dan catatan praktis agar Anda memilih waktu keberangkatan terbaik — dibaca sekali, dipakai bertahun-tahun.",
      statBest: "Bulan Paling Hemat",
      statPeak: "Bulan Puncak",
      statNote: "Catatan Praktis",
      legendDemand: "Tingkat permintaan",
      demand: { RENDAH: "Rendah", SEDANG: "Sedang", TINGGI: "Tinggi", PUNCAK: "Puncak" },
      price: { HEMAT: "Hemat", BAIK: "Baik", NORMAL: "Normal", PREMIUM: "Premium", PUNCAK: "Puncak" },
      priceLabel: "Indikasi harga",
      noteLabel: "Catatan",
      tipLabel: "Saran",
      season: {
        quiet: "Musim Sepi",
        shoulder: "Musim Sedang",
        busy: "Musim Sibuk",
        ramadan: "Puncak Ramadan",
        hajj: "Musim Haji",
        hajjTail: "Transisi Haji",
      },
      disclaimer:
        "Indikasi musiman adalah pola umum industri ibadah, bukan harga final. Harga riil selalu ada di halaman paket masing-masing penyelenggara terverifikasi.",
      ctaTitle: "Sudah menentukan bulan keberangkatan?",
      ctaDesc: "Bandungkan paket terverifikasi pada bulan pilihan Anda — lengkap dengan itinerary harian dan ulasan jamaah.",
      ctaBtn: "Lihat Paket Terverifikasi",
    },
  },
  en: {
    kalender: {
      eyebrow: "ANNUAL SEASON MAP",
      title: "Umrah & Hajj Season Calendar",
      subtitle:
        "A 12-month demand pattern, price indication, and practical notes so you pick the best departure window — read once, useful for years.",
      statBest: "Most Affordable Months",
      statPeak: "Peak Months",
      statNote: "Practical Notes",
      legendDemand: "Demand level",
      demand: { RENDAH: "Low", SEDANG: "Moderate", TINGGI: "High", PUNCAK: "Peak" },
      price: { HEMAT: "Budget", BAIK: "Good", NORMAL: "Normal", PREMIUM: "Premium", PUNCAK: "Peak" },
      priceLabel: "Price indication",
      noteLabel: "Notes",
      tipLabel: "Tip",
      season: {
        quiet: "Quiet Season",
        shoulder: "Shoulder Season",
        busy: "Busy Season",
        ramadan: "Ramadan Peak",
        hajj: "Hajj Season",
        hajjTail: "Hajj Transition",
      },
      disclaimer:
        "Seasonal indications reflect common industry patterns, not final prices. Actual prices are always on each verified provider's package page.",
      ctaTitle: "Already picked your departure month?",
      ctaDesc: "Compare verified packages for your chosen month — complete with daily itinerary and pilgrim reviews.",
      ctaBtn: "Browse Verified Packages",
    },
  },
  ar: {
    kalender: {
      eyebrow: "خريطة المواسم السنوية",
      title: "تقويم مواسم العمرة والحج",
      subtitle:
        "نمط الطلب على مدى ١٢ شهرًا ومؤشر الأسعار وملاحظات عملية لتختار أفضل وقت للسفر — تقرأه مرة ويفيدك سنوات.",
      statBest: "أكثر الشهور توفيرًا",
      statPeak: "شهور الذروة",
      statNote: "ملاحظات عملية",
      legendDemand: "مستوى الطلب",
      demand: { RENDAH: "منخفض", SEDANG: "متوسط", TINGGI: "مرتفع", PUNCAK: "ذروة" },
      price: { HEMAT: "اقتصادي", BAIK: "جيد", NORMAL: "عادي", PREMIUM: "مرتفع", PUNCAK: "الذروة" },
      priceLabel: "مؤشر السعر",
      noteLabel: "ملاحظات",
      tipLabel: "نصيحة",
      season: {
        quiet: "الموسم الهادئ",
        shoulder: "الموسم المتوسط",
        busy: "الموسم المزدحم",
        ramadan: "ذروة رمضان",
        hajj: "موسم الحج",
        hajjTail: "انتقال الحج",
      },
      disclaimer:
        "المؤشرات الموسمية أنماط عامة للصناعة وليست أسعارًا نهائية؛ السعر الفعلي دائمًا في صفحة باقة كل مزود موثّق.",
      ctaTitle: "اخترت شهر سفرك؟",
      ctaDesc: "قارن الباقات الموثّقة في الشهر الذي تختاره — مع البرنامج اليومي وآراء الحُجّاج.",
      ctaBtn: "استعرض الباقات الموثّقة",
    },
  },
};
