/**
 * namespace "push" — R-011 Web Push Pengumuman Keberangkatan.
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const pushDict = {
  id: {
    push: {
      enable: {
        title: "Notifikasi Keberangkatan",
        desc: "Aktifkan notifikasi push untuk pengumuman perubahan jadwal, gate, dan informasi keberangkatan MUHDIN — langsung di perangkat Anda tanpa membuka aplikasi.",
        bound: "Pengumuman akan terikat pada tiket Anda",
        btn: "Aktifkan Notifikasi",
        busy: "Mengaktifkan…",
        on: "Notifikasi aktif di perangkat ini.",
      },
    },
  },
  en: {
    push: {
      enable: {
        title: "Departure Notifications",
        desc: "Turn on push notifications for MUHDIN schedule changes, gate updates and departure announcements — straight to your device without opening the app.",
        bound: "Announcements will be bound to your ticket",
        btn: "Enable Notifications",
        busy: "Enabling…",
        on: "Notifications are active on this device.",
      },
    },
  },
  ar: {
    push: {
      enable: {
        title: "إشعارات المغادرة",
        desc: "فعّل إشعارات الدفع لتغييرات الجدول وبوابة المغادرة وإعلانات موهدين — مباشرة على جهازك دون فتح التطبيق.",
        bound: "سيُربط الإعلان بتذكرة",
        btn: "تفعيل الإشعارات",
        busy: "جارٍ التفعيل…",
        on: "الإشعارات مفعّلة على هذا الجهاز.",
      },
    },
  },
} as const;
