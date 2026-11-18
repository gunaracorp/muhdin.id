/**
 * namespace "branches" — dikelola oleh Task 19 (Jaringan Kepengurusan Daerah).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 * Tampil di halaman Tentang (#/tentang) dan Kontak (#/kontak).
 */
export const branchesDict = {
  id: {
    branches: {
      eyebrow: "Jaringan Daerah",
      title: "Kepengurusan Daerah & Branch Office",
      subtitle:
        "Badan Koordinasi Daerah (BKD) dan kantor cabang MUHDIN — dekat dengan jamaah di seluruh wilayah Indonesia.",
      countLabel: "{n} wilayah",
      picLabel: "Penanggung Jawab (PIC)",
      phoneLabel: "Kontak",
      officeLabel: "Kantor",
      addressLabel: "Alamat",
      waCta: "Chat WhatsApp",
      waAria: "Hubungi {name} via WhatsApp",
      mapAria: "Lihat lokasi {name} di Peta",
      mapCta: "Buka di Peta",
      emptyTitle: "Belum Ada Jaringan Daerah",
      emptyDesc: "Kepengurusan daerah akan segera diumumkan. Pantau halaman ini untuk info terbaru.",
    },
  },
  en: {
    branches: {
      eyebrow: "Regional Network",
      title: "Regional Leadership & Branch Offices",
      subtitle:
        "Regional Coordination Boards (BKD) and MUHDIN branch offices — close to pilgrims across Indonesia.",
      countLabel: "{n} regions",
      picLabel: "Person in Charge (PIC)",
      phoneLabel: "Contact",
      officeLabel: "Office",
      addressLabel: "Address",
      waCta: "WhatsApp Chat",
      waAria: "Contact {name} via WhatsApp",
      mapAria: "View {name} location on Map",
      mapCta: "Open in Map",
      emptyTitle: "No Regional Network Yet",
      emptyDesc: "Regional leadership will be announced soon. Stay tuned for updates.",
    },
  },
  ar: {
    branches: {
      eyebrow: "الشبكة الإقليمية",
      title: "القيادة الإقليمية والمكاتب الفرعية",
      subtitle:
        "هيئات التنسيق الإقليمية (BKD) والمكاتب الفرعية لمؤمن — قريبة من الحجاج في جميع أنحاء إندونيسيا.",
      countLabel: "{n} منطقة",
      picLabel: "الشخص المسؤول",
      phoneLabel: "جهة الاتصال",
      officeLabel: "المكتب",
      addressLabel: "العنوان",
      waCta: "محادثة واتساب",
      waAria: "تواصل مع {name} عبر واتساب",
      mapAria: "عرض موقع {name} على الخريطة",
      mapCta: "افتح في الخريطة",
      emptyTitle: "لا توجد شبكة إقليمية بعد",
      emptyDesc: "سيتم الإعلان عن القيادة الإقليمية قريباً. تابع هذه الصفحة لآخر المستجدات.",
    },
  },
} as const;
