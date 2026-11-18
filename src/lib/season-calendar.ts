/**
 * season-calendar.ts — R-017 v14.0 «KAMPANYE & KAWAL».
 *
 * Peta musim Umrah & Haji 12 bulan (pola tahunan Makkah/Madinah, zona Asia/
 * Indonesia): tingkat permintaan, indikasi harga, dan catatan praktis per
 * bulan. Ini pola musiman umum industri — BUKAN harga final; harga riil
 * selalu ada di halaman paket masing-masing penyelenggara.
 *
 * Bulan pakai indeks 1–12 (Januari = 1). Teks dibawa tri-bahasa (id/en/ar)
 * langsung di sumber agar data & terjemahan tidak tercecer.
 */

export type DemandLevel = "RENDAH" | "SEDANG" | "TINGGI" | "PUNCAK";
export type PriceTier = "HEMAT" | "BAIK" | "NORMAL" | "PREMIUM" | "PUNCAK";

export interface SeasonMonth {
  month: number; // 1–12
  seasonKey: "quiet" | "shoulder" | "busy" | "ramadan" | "hajj" | "hajjTail";
  demand: DemandLevel;
  price: PriceTier;
  note: { id: string; en: string; ar: string };
  tip: { id: string; en: string; ar: string };
}

export const SEASON_MONTHS: SeasonMonth[] = [
  {
    month: 1, seasonKey: "quiet", demand: "RENDAH", price: "HEMAT",
    note: {
      id: "Pasca-libur akhir tahun, permintaan menurun. Cuaca Makkah sejuk, kepadatan relatif longgar.",
      en: "After the year-end holidays demand drops. Makkah weather is cool and the crowds relatively light.",
      ar: "بعد عطلة نهاية العام ينخفض الطلب، والجو في مكة بارد والزحام خفيف نسبيًا.",
    },
    tip: {
      id: "Jendela harga paling bersahabat untuk keluarga dengan anggaran ketat.",
      en: "The most budget-friendly window for families on a tight budget.",
      ar: "الخيار الأكثر توفيرًا للعائلات ذات الميزانية المحدودة.",
    },
  },
  {
    month: 2, seasonKey: "shoulder", demand: "SEDANG", price: "BAIK",
    note: {
      id: "Awal kebangkitan musim umrah; grup-grup mulai kembali memenuhi hotel dekat Masjidil Haram.",
      en: "Umrah season starts picking up; groups begin filling hotels near the Grand Mosque again.",
      ar: "يبدأ موسم العمرة بالتعافي؛ تعود الجِمَع لملء الفنادق القريبة من الحرم.",
    },
    tip: {
      id: "Pesan 2–3 bulan di muka masih mudah mendapat hotel dekat masjid.",
      en: "Book 2–3 months ahead and hotels near the mosque are still easy to get.",
      ar: "احجز قبل شهرين إلى ثلاثة لتحصل بسهولة على فنادق قريبة من الحرم.",
    },
  },
  {
    month: 3, seasonKey: "busy", demand: "TINGGI", price: "PREMIUM",
    note: {
      id: "Musim sibuk pra-Ramadan: program umbi-umbian sekolah dan grup panitia memenuhi slot keberangkatan.",
      en: "Pre-Ramadan busy season: school breaks and committee groups fill departure slots.",
      ar: "موسم مزدحم قبل رمضان: تملأ الرحلات المدرسية والجِمَع المنظمة مواعيد السفر.",
    },
    tip: {
      id: "Kunci hotel & kursi lebih awal — harga naik cepat menjelang Ramadan.",
      en: "Lock hotels and seats early — prices climb fast toward Ramadan.",
      ar: "ثبّت الفندق والمقعد مبكرًا — الأسعار ترتفع بسرعة مع اقتراب رمضان.",
    },
  },
  {
    month: 4, seasonKey: "ramadan", demand: "PUNCAK", price: "PUNCAK",
    note: {
      id: "Puncak permintaan tahunan: umrah Ramadan, khususnya 10 hari terakhir (pola Itikaf & Lailatul Qadar).",
      en: "Annual demand peak: Ramadan umrah, especially the last ten nights (I'tikaf & Laylat al-Qadr).",
      ar: "قمة الطلب السنوي: عمرة رمضان، ولا سيما العشر الأواخر (الاعتكاف وليلة القدر).",
    },
    tip: {
      id: "Slot Ramadan terakhir habis berbulan-bulan sebelumnya — pesan sejak awal tahun.",
      en: "Last-ten-nights slots sell out months ahead — book at the start of the year.",
      ar: "مواعيد العشر الأواخر تنفد قبل شهور — احجز منذ مطلع العام.",
    },
  },
  {
    month: 5, seasonKey: "hajjTail", demand: "SEDANG", price: "NORMAL",
    note: {
      id: "Penutupan musim umrah menjelang Hajj; visa umrah dibatasi. Bersih-bersih operasional menjelang musim haji.",
      en: "Umrah season closes toward Hajj; umrah visas are restricted. Operators reset before the Hajj season.",
      ar: "يُغلق موسم العمرة استعدادًا للحج؛ تُقيّد تأشيرات العمرة وتُرتب شؤون التشغيل.",
    },
    tip: {
      id: "Cocok untuk yang ingin suasana tenang sebelum musim haji total ditutup.",
      en: "Good for those who prefer a quiet atmosphere before the Hajj closure.",
      ar: "مناسبة لمن يفضل الأجواء الهادئة قبل إغلاق موسم الحج.",
    },
  },
  {
    month: 6, seasonKey: "hajj", demand: "PUNCAK", price: "PUNCAK",
    note: {
      id: "Musim penuh Haji (Dzulqa'dah–Dzulhijjah): seluruh kuota untuk jemaah haji; umrah umum tidak berjalan.",
      en: "Full Hajj season: quotas reserved for hajj pilgrims; general umrah is paused.",
      ar: "موسم الحج الكامل: الحصص لحجاج الحج، وتتوقف العمرة العامة.",
    },
    tip: {
      id: "Pastikan PPIU/pihak Anda terdaftar resmi SISKOPATUH sebelum transfer biaya haji.",
      en: "Make sure your PPIU/agent is officially listed on SISKOPATUH before paying hajj fees.",
      ar: "تأكد أن شركتك مسجلة رسميًا في نظام سكوباتوح قبل دفع تكاليف الحج.",
    },
  },
  {
    month: 7, seasonKey: "hajj", demand: "PUNCAK", price: "PUNCAK",
    note: {
      id: "Ekor musim haji + libur sekolah: permintaan tinggi, kapasitas mulai pulih bertahap.",
      en: "Tail of the hajj season plus school holidays: demand is high and capacity recovers gradually.",
      ar: "نهاية موسم الحج مع الإجازات المدرسية: الطلب مرتفع والطاقة تسترد تدريجيًا.",
    },
    tip: {
      id: "Harga belum turun maksimal — pilih akhir Juli bila ingin lebih hemat.",
      en: "Prices have not bottomed out — pick late July for better value.",
      ar: "الأسعار لم تصل أدنى مستوياتها — اختر أواخر يوليو لتوفير أكثر.",
    },
  },
  {
    month: 8, seasonKey: "shoulder", demand: "SEDANG", price: "BAIK",
    note: {
      id: "Musim umrah dibuka kembali bertahap; masih bertepatan libur sekolah Indonesia.",
      en: "Umrah season reopens gradually; still overlapping Indonesia's school holidays.",
      ar: "يُعاد افتتاح موسم العمرة تدريجيًا مع استمرار الإجازات المدرسية.",
    },
    tip: {
      id: "Alternatif terbaik bagi keluarga beranak sekolah yang melewatkan Juni–Juli.",
      en: "Best alternative for families with school kids who missed June–July.",
      ar: "الخيار الأفضل للعائلات ذات الأطفال المدرسيين التي فوّتت يونيو–يوليو.",
    },
  },
  {
    month: 9, seasonKey: "busy", demand: "TINGGI", price: "PREMIUM",
    note: {
      id: "Kembalinya musim bisnis: perusahaan & komunitas menjadwalkan program akhir tahun.",
      en: "Business season returns: companies and communities schedule year-end programs.",
      ar: "عودة موسم الأعمال: الشركات والجِمَع تبرمج رحلات آخر العام.",
    },
    tip: {
      id: "Grup besar dapat menegosiasikan harga khusus di luar puncak Ramadan.",
      en: "Large groups can negotiate special rates outside the Ramadan peak.",
      ar: "الجِمَع الكبيرة يمكنها التفاوض على أسعار خاصة خارج قمة رمضان.",
    },
  },
  {
    month: 10, seasonKey: "shoulder", demand: "SEDANG", price: "BAIK",
    note: {
      id: "Stabil dan nyaman: cuaca mulai sejuk, kepadatan moderat di seluruh titik layanan.",
      en: "Stable and comfortable: weather cools and density is moderate at all service points.",
      ar: "استقرار وراحة: الجو يبرد والازدحام معتدل في جميع نقاط الخدمة.",
    },
    tip: {
      id: "Salah satu bulan paling seimbang antara harga, cuaca, dan kenyamanan.",
      en: "One of the most balanced months between price, weather, and comfort.",
      ar: "من أكثر الأشهر توازنًا بين السعر والجو والراحة.",
    },
  },
  {
    month: 11, seasonKey: "busy", demand: "TINGGI", price: "PREMIUM",
    note: {
      id: "Musim sibuk menjelang akhir tahun; umrah Awal Muharram mulai diminati grup-grup besar.",
      en: "Busy season toward year-end; Muharram umrah draws large groups.",
      ar: "موسم مزدحم نحو نهاية العام؛ عمرة محرم تجذب جِمَعًا كبيرة.",
    },
    tip: {
      id: "Manfaatkan promo pra-akhir tahun yang biasanya muncul di bulan ini.",
      en: "Take advantage of pre-year-end promos that usually appear this month.",
      ar: "استفد من العروض التي تظهر عادة في هذا الشهر قبل نهاية العام.",
    },
  },
  {
    month: 12, seasonKey: "shoulder", demand: "SEDANG", price: "NORMAL",
    note: {
      id: "Libur akhir tahun menaikkan permintaan sesaat, lalu menurun tajam pada pekan terakhir.",
      en: "Year-end holidays lift demand briefly, then it drops sharply in the last week.",
      ar: "ترفع إجازات نهاية العام الطلب مؤقتًا ثم ينخفض حدة في الأسبوع الأخير.",
    },
    tip: {
      id: "Pekan terakhir Desember sering menjadi jendela harga terbaik sebelum Januari.",
      en: "The last week of December is often the best price window before January.",
      ar: "غالبًا ما يكون الأسبوع الأخير من ديسمبر أفضل نافذة سعرية قبل يناير.",
    },
  },
];

export const DEMAND_ORDER: Record<DemandLevel, number> = { RENDAH: 1, SEDANG: 2, TINGGI: 3, PUNCAK: 4 };

export function monthLabel(month: number, locale: string): string {
  const ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const list = locale === "en" ? EN : locale === "ar" ? AR : ID;
  return list[(month - 1) % 12] ?? String(month);
}
