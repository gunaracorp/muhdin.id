/**
 * gen-tour-pano.mjs — v5 Fase 4: generate 6 panorama equirectangular 360°
 * untuk Virtual Tour (situs suci). Output: public/tour/<slug>.jpg (JPEG q82,
 * via sharp — PNG hasil AI berukuran besar).
 * Jalankan: node scripts/gen-tour-pano.mjs
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "tour");
fs.mkdirSync(OUT_DIR, { recursive: true });

const EQ =
  "seamless equirectangular 360 degree panorama projection, 2:1 spherical mapping, " +
  "horizon exactly at vertical center, continuous wrap-around view, ultra wide field of view, " +
  "realistic photography, high quality, detailed";

const SCENES = [
  {
    slug: "makkah",
    prompt:
      `Interior panorama of the Grand Mosque Masjid al-Haram in Makkah at dusk, the black Kaaba cube with golden embroidery at the center of the white marble mataf courtyard, thousands of pilgrims in white ihram circumambulating in a blur of motion, elegant minarets and arcades, warm golden floodlights, deep blue twilight sky, ${EQ}`,
  },
  {
    slug: "madinah",
    prompt:
      `Panorama of the courtyard of the Prophet's Mosque Masjid an-Nabawi in Madinah at golden hour, iconic giant folding white umbrella canopies, the green dome in the distance, white marble columns and polished floor, pilgrims walking peacefully, soft warm light, ${EQ}`,
  },
  {
    slug: "mina",
    prompt:
      `Panorama from a hilltop overlooking Mina tent city during Hajj season, thousands of identical white fireproof tents in neat grid rows stretching to the horizon, rocky desert mountains around, clear midday sun, pilgrims walkways between tents, ${EQ}`,
  },
  {
    slug: "arafah",
    prompt:
      `Panorama of the plain of Arafat on the day of Hajj, small rocky Mount of Mercy Jabal Rahmah in the middle distance, vast sandy plain filled with white pilgrims praying, scattered shade umbrellas, hazy afternoon sun, distant hills, ${EQ}`,
  },
  {
    slug: "muzdalifah",
    prompt:
      `Night panorama of Muzdalifah plain, pilgrims in white resting on mats under a breathtaking starry night sky with milky way, warm camp lights glowing in the distance, rocky desert terrain, serene atmosphere, ${EQ}`,
  },
  {
    slug: "jeddah",
    prompt:
      `Daytime panorama of the Hajj terminal arrival plaza in Jeddah Saudi Arabia, modern white tensile canopy architecture, pilgrims in ihram with luggage arriving, palm trees, bright blue sky with soft clouds, ${EQ}`,
  },
];

async function main() {
  const only = process.argv.slice(2);
  const zai = await ZAI.create();
  for (const s of SCENES) {
    const outPng = path.join(OUT_DIR, `${s.slug}.png`);
    const outJpg = path.join(OUT_DIR, `${s.slug}.jpg`);
    if (fs.existsSync(outJpg) && only[0] !== "force") {
      console.log(`skip ${s.slug} (sudah ada)`);
      continue;
    }
    if (only.length && only[0] !== "force" && !only.includes(s.slug)) continue;
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        console.log(`generate ${s.slug} (attempt ${attempt})…`);
        const res = await zai.images.generations.create({
          prompt: s.prompt,
          size: "2048x1024",
        });
        const b64 = res?.data?.[0]?.base64;
        if (!b64) throw new Error("respons kosong");
        const buf = Buffer.from(b64, "base64");
        fs.writeFileSync(outPng, buf);
        await sharp(outPng).jpeg({ quality: 82, mozjpeg: true }).toFile(outJpg);
        fs.unlinkSync(outPng);
        console.log(`  ✓ ${outJpg} (${(fs.statSync(outJpg).size / 1024).toFixed(0)} KB)`);
        ok = true;
      } catch (e) {
        console.error(`  ✗ ${e.message}`);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    if (!ok) {
      console.error(`GAGAL: ${s.slug}`);
      process.exitCode = 1;
    }
  }
  console.log("selesai.");
}

main();
