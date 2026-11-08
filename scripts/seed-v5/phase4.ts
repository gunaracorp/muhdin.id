/**
 * phase4.ts — v5 Fase 4: seed 6 scene Virtual Tour 360° (situs suci).
 * Idempoten (upsert by slug). Jalankan: npx tsx scripts/seed-v5/phase4.ts
 */
import { makeDb } from "../_db";

type Tri = { id: string; en: string; ar: string };

type Hotspot =
  | { type: "info"; yaw: number; pitch: number; title: Tri; text: Tri; icon?: string }
  | { type: "link"; yaw: number; pitch: number; target: string; label: Tri };

const SCENES: {
  slug: string;
  site: string;
  image: string;
  name: Tri;
  description: Tri;
  initialView: { yaw: number; pitch: number; hfov: number };
  hotspots: Hotspot[];
  order: number;
}[] = [
  {
    slug: "makkah",
    site: "MAKKAH",
    image: "/tour/makkah.jpg",
    name: { id: "Masjidil Haram", en: "The Grand Mosque", ar: "المسجد الحرام" },
    description: {
      id: "Jantung ibadah haji dan umrah — Ka'bah berdiri megah di tengah mataf, dikelilingi jutaan jamaah yang bertawaf.",
      en: "The heart of Hajj and Umrah — the Ka'bah stands at the center of the mataf, surrounded by millions of circumambulating pilgrims.",
      ar: "قلب الحج والعمرة — الكعبة تقف في وسط المطاف، محاطة بملايين الحجاج الطائفين.",
    },
    initialView: { yaw: 0, pitch: -0.05, hfov: 105 },
    hotspots: [
      {
        type: "info",
        yaw: 0,
        pitch: -0.02,
        icon: "landmark",
        title: { id: "Ka'bah", en: "The Ka'bah", ar: "الكعبة" },
        text: {
          id: "Kiblat umat Islam sedunia — dibangun oleh Nabi Ibrahim AS, diselimuti kiswah bordir emas. Satu tawaf = 7 putaran.",
          en: "The qiblah of Muslims worldwide — built by Prophet Ibrahim, draped in the golden-embroidered kiswah. One tawaf = 7 circuits.",
          ar: "قبلة المسلمين في العالم — بناها إبراهيم عليه السلام، مكسوة بالكسوة المطرزة بالذهب. الطواف الواحد سبعة أشواط.",
        },
      },
      {
        type: "info",
        yaw: 1.7,
        pitch: -0.08,
        icon: "rotate-ccw",
        title: { id: "Mataf", en: "The Mataf", ar: "المطاف" },
        text: {
          id: "Lantai putih mengilap di sekeliling Ka'bah tempat jamaah menunaikan tawaf — mampu menampung puluhan ribu jamaah per jam.",
          en: "The polished white floor circling the Ka'bah where tawaf is performed — accommodating tens of thousands of pilgrims per hour.",
          ar: "الأرضية الرخامية البيضاء حول الكعبة حيث يُؤدى الطواف — تتسع لعشرات الآلاف من الحجاج كل ساعة.",
        },
      },
      {
        type: "info",
        yaw: -2.3,
        pitch: 0.12,
        icon: "building-2",
        title: { id: "Menara & Arkade", en: "Minarets & Arcades", ar: "المآذن والأروقة" },
        text: {
          id: "Sembilan menara menjulang lebih dari 89 meter, penghangat suasana azan lima waktu di sekitar masjid.",
          en: "Nine minarets rising over 89 meters, carrying the call to prayer five times a day around the mosque.",
          ar: "تسع مآذن يعلو ارتفاعها أكثر من 89 متراً، ترفع الأذان خمس مرات يومياً حول المسجد.",
        },
      },
      { type: "link", yaw: 2.9, pitch: -0.12, target: "madinah", label: { id: "Menuju Madinah", en: "Head to Madinah", ar: "توجه إلى المدينة" } },
      { type: "link", yaw: -1.1, pitch: -0.1, target: "mina", label: { id: "Menuju Mina", en: "Head to Mina", ar: "توجه إلى منى" } },
    ],
    order: 1,
  },
  {
    slug: "madinah",
    site: "MADINAH",
    image: "/tour/madinah.jpg",
    name: { id: "Masjid Nabawi", en: "The Prophet's Mosque", ar: "المسجد النبوي" },
    description: {
      id: "Masjid Nabi ﷺ dengan kubah hijau ikonik dan payung raksasa pelindung jamaah dari panas matahari.",
      en: "The Prophet's ﷺ Mosque with its iconic green dome and giant umbrellas sheltering pilgrims from the sun.",
      ar: "المسجد النبوي الشريف بالقبة الخضراء الشهيرة والمظلات العملاقة التي تحمي الحجاج من الشمس.",
    },
    initialView: { yaw: 0.2, pitch: 0, hfov: 105 },
    hotspots: [
      {
        type: "info",
        yaw: 0.5,
        pitch: 0.08,
        icon: "landmark",
        title: { id: "Kubah Hijau", en: "The Green Dome", ar: "القبة الخضراء" },
        text: {
          id: "Dibangun tahun 1818 di atas makam Nabi ﷺ serta Abu Bakar RA dan Umar RA — ikon paling dikenal Madinah.",
          en: "Built in 1818 above the resting place of the Prophet ﷺ, Abu Bakr RA and Umar RA — Madinah's most famous landmark.",
          ar: "بُنيت عام 1818م فوق مقام النبي ﷺ وأبي بكر وعمر رضي الله عنهما — أشهر معلم في المدينة.",
        },
      },
      {
        type: "info",
        yaw: -1.6,
        pitch: 0.05,
        icon: "umbrella",
        title: { id: "Payung Raksasa", en: "Giant Umbrellas", ar: "المظلات العملاقة" },
        text: {
          id: "250 payung tinggi 20 meter yang membuka sendiri saat pagi dan melipat saat senja — keajaiban arsitektur modern.",
          en: "250 umbrellas standing 20 meters tall that open at dawn and fold at dusk — a marvel of modern engineering.",
          ar: "250 مظلة يصل ارتفاعها إلى 20 متراً تُفتح صباحاً وتُطوى مساءً — أعجوبة من هندسة العصر الحديث.",
        },
      },
      { type: "link", yaw: 3.1, pitch: -0.1, target: "makkah", label: { id: "Menuju Makkah", en: "Head to Makkah", ar: "توجه إلى مكة" } },
    ],
    order: 2,
  },
  {
    slug: "mina",
    site: "MINA",
    image: "/tour/mina.jpg",
    name: { id: "Tenda Kota Mina", en: "Mina Tent City", ar: "مدينة منى" },
    description: {
      id: "Kota tenda dengan lebih dari 100.000 unit tahan api — jamaah mabit di sini pada malam 8 Dzulhijjah dan hari-hari tasyriq.",
      en: "A city of over 100,000 fireproof tents — pilgrims spend the night here on the eve of Tarwiyah and the days of Tashreeq.",
      ar: "مدينة تضم أكثر من 100 ألف خيمة مقاومة للحريق — يبيت الحجاج هنا ليلة التروية وأيام التشريق.",
    },
    initialView: { yaw: 0, pitch: 0.05, hfov: 110 },
    hotspots: [
      {
        type: "info",
        yaw: 0,
        pitch: 0,
        icon: "tent",
        title: { id: "Tenda Jalara", en: "The Jalaria Tents", ar: "خيام الجلالة" },
        text: {
          id: "Tenda polyester tahan api yang disusun rapi berderet-deret, dilengkapi pendingin udara dan pemantauan kebakaran 24 jam.",
          en: "Neatly arranged fireproof polyester tents, equipped with air cooling and 24-hour fire monitoring.",
          ar: "خيام بوليستر مقاومة للحريق مصفوفة بدقة، مجهزة بالتبريد ومراقبة الحريق على مدار الساعة.",
        },
      },
      {
        type: "info",
        yaw: 2.1,
        pitch: -0.05,
        icon: "target",
        title: { id: "Jamarat", en: "The Jamarat", ar: "الجمرات" },
        text: {
          id: "Tiga tiang lempar jumrah — ritual melontar 7 kerikil yang mengenang keteguhan Nabi Ibrahim AS menghadapi godaan.",
          en: "Three casting pillars — the ritual of throwing seven pebbles, recalling Prophet Ibrahim's steadfastness against temptation.",
          ar: "ثلاثة أعمدة للرمي — طقس رمي سبع حصيات تخليداً لثبات إبراهيم عليه السلام في مواجهة وسوسة الشيطان.",
        },
      },
      { type: "link", yaw: 1.1, pitch: -0.08, target: "arafah", label: { id: "Menuju Arafah", en: "Head to Arafah", ar: "توجه إلى عرفة" } },
      { type: "link", yaw: -2.3, pitch: -0.1, target: "makkah", label: { id: "Menuju Makkah", en: "Head to Makkah", ar: "توجه إلى مكة" } },
    ],
    order: 3,
  },
  {
    slug: "arafah",
    site: "ARAFAH",
    image: "/tour/arafah.jpg",
    name: { id: "Padang Arafah", en: "The Plain of Arafat", ar: "سهل عرفة" },
    description: {
      id: "Puncak ritual haji — wukuf pada 9 Dzulhijjah dari matahari tergelincir hingga terbenam di padang ini.",
      en: "The pinnacle of Hajj — standing at Arafah on the 9th of Dhul-Hijjah from noon until sunset.",
      ar: "ذروة الحج — الوقوف في التاسع من ذي الحجة من الزوال حتى الغروب.",
    },
    initialView: { yaw: 0, pitch: 0.02, hfov: 110 },
    hotspots: [
      {
        type: "info",
        yaw: 0,
        pitch: 0.06,
        icon: "mountain",
        title: { id: "Jabal Rahmah", en: "Mount of Mercy", ar: "جبل الرحمة" },
        text: {
          id: "Bukit kecil tempat Nabi ﷺ menyampaikan khutbah haji wada' — kini menjadi titik wukuf paling dikenal.",
          en: "The small hill where the Prophet ﷺ delivered the Farewell Sermon — today the most famous standing point.",
          ar: "التل الصغير الذي ألقى فيه النبي ﷺ خطبة حجة الوداع — أشهر موقف اليوم.",
        },
      },
      {
        type: "info",
        yaw: 2.2,
        pitch: -0.04,
        icon: "sun",
        title: { id: "Wukuf", en: "The Standing", ar: "الوقوف" },
        text: {
          id: "Haji tanpa wukuf tidak sah — jamaah berdoa, menangis, dan berdzikir dari matahari tergelincir hingga terbenam.",
          en: "Hajj is invalid without the standing — pilgrims pray, weep and remember Allah from noon until sunset.",
          ar: "الحج بلا وقوف باطل — يبكي الحجاج ويدعون ويذكرون من الزوال إلى الغروب.",
        },
      },
      { type: "link", yaw: 2.7, pitch: -0.08, target: "muzdalifah", label: { id: "Menuju Muzdalifah", en: "Head to Muzdalifah", ar: "توجه إلى مزدلفة" } },
      { type: "link", yaw: -2.5, pitch: -0.08, target: "mina", label: { id: "Kembali ke Mina", en: "Back to Mina", ar: "العودة إلى منى" } },
    ],
    order: 4,
  },
  {
    slug: "muzdalifah",
    site: "MUZDALIFAH",
    image: "/tour/muzdalifah.jpg",
    name: { id: "Padang Muzdalifah", en: "The Plain of Muzdalifah", ar: "مزدلفة" },
    description: {
      id: "Mabit di bawah langit berbintang — jamaah mengumpulkan kerikil untuk lempar jumrah dan salat maghrib-isya jamak.",
      en: "A night's rest beneath the stars — pilgrims collect pebbles for the stoning and combine Maghrib and Isha prayers.",
      ar: "بيت من النوم تحت النجوم — يجمع الحجاج الحصى للرمي ويؤدون المغرب والعشاء قصراً وجمعاً.",
    },
    initialView: { yaw: 0, pitch: 0.1, hfov: 110 },
    hotspots: [
      {
        type: "info",
        yaw: 0,
        pitch: 0,
        icon: "moon-star",
        title: { id: "Mabit Malam", en: "Night Rest", ar: "بيت ليلة مزدلفة" },
        text: {
          id: "Jamaah beristirahat di padang terbuka hanya dengan alas tikar — pengalaman merendahkan diri yang tak terlupakan.",
          en: "Pilgrims rest in the open plain on simple mats — an unforgettable lesson in humility.",
          ar: "يبيت الحجاج في السهل المفتوح على حصائر بسيطة — درس لا يُنسى في التواضع.",
        },
      },
      {
        type: "info",
        yaw: -1.9,
        pitch: 0.95,
        icon: "sparkles",
        title: { id: "Langit Berbintang", en: "Starry Sky", ar: "السماء المرصعة بالنجوم" },
        text: {
          id: "Tanpa cahaya kota, Bima Sakti tampak jelas — saksi bisu malam penyucian jiwa.",
          en: "Free from city lights, the Milky Way shines clear — a silent witness to a night of soul purification.",
          ar: "بلا أضواء المدينة، تظهر درب التبانة بوضوح — شاهد صامت على ليلة تنقية النفس.",
        },
      },
      { type: "link", yaw: 1.5, pitch: -0.08, target: "mina", label: { id: "Menuju Mina (Jumrah)", en: "Head to Mina (Stoning)", ar: "توجه إلى منى (الرمي)" } },
    ],
    order: 5,
  },
  {
    slug: "jeddah",
    site: "JEDDAH",
    image: "/tour/jeddah.jpg",
    name: { id: "Terminal Jamaah Jeddah", en: "Jeddah Pilgrim Terminal", ar: "ميناء جدة" },
    description: {
      id: "Gerbang pertama Tamu Allah di Tanah Suci — arsitektur tenda khas Bandara King Abdulaziz menyambut kedatangan jamaah.",
      en: "The first gateway for Allah's Guests — the tent-style architecture of King Abdulaziz Airport welcomes arriving pilgrims.",
      ar: "أول بوابة لضيوف الرحمن — عمارة الخيام في مطار الملك عبدالعزيز تستقبل الحجاج القادمين.",
    },
    initialView: { yaw: 0, pitch: 0, hfov: 105 },
    hotspots: [
      {
        type: "info",
        yaw: 0,
        pitch: 0.02,
        icon: "plane",
        title: { id: "Terminal Haji", en: "Hajj Terminal", ar: "صالة الحجاج" },
        text: {
          id: "Terminal tenda terbesar di dunia — mampu melayani jutaan jamaah per musim dengan alur kedatangan modern.",
          en: "The world's largest tent terminal — serving millions of pilgrims per season with a modern arrival flow.",
          ar: "أكبر صالة على شكل خيمة في العالم — تخدم ملايين الحجاج كل موسم بسلسلة وصول حديثة.",
        },
      },
      { type: "link", yaw: 2.3, pitch: -0.1, target: "makkah", label: { id: "Berangkat ke Makkah", en: "Depart to Makkah", ar: "الانطلاق إلى مكة" } },
    ],
    order: 6,
  },
];

async function main() {
  const db = makeDb();
  for (const s of SCENES) {
    const data = {
      slug: s.slug,
      site: s.site,
      image: s.image,
      name: JSON.stringify(s.name),
      description: JSON.stringify(s.description),
      initialView: JSON.stringify(s.initialView),
      hotspots: JSON.stringify(s.hotspots),
      order: s.order,
    };
    const existing = await db.tourScene.findUnique({ where: { slug: s.slug } });
    if (existing) {
      await db.tourScene.update({ where: { slug: s.slug }, data });
      console.log(`update ${s.slug}`);
    } else {
      await db.tourScene.create({ data });
      console.log(`create ${s.slug}`);
    }
  }
  const total = await db.tourScene.count();
  console.log(`TourScene: ${total} scene siap.`);
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
