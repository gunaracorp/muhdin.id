/**
 * Task 35-f — Generator latar belakang banner promosi (backend script).
 * Pemakaian: bun scripts/gen-banner-bg.ts
 * Ukuran API: 512–2880 px, kelipatan 32, maks 2^22 px.
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT = path.resolve(__dirname, "../public/promo");

const JOBS = [
  {
    file: "bg-story.png",
    size: "1152x2048",
    prompt:
      "Premium Islamic poster background, majestic golden Kaaba silhouette glowing at the bottom center with radiant vertical light rays, luxurious deep emerald dark green atmosphere, elegant gold islamic geometric arabesque patterns on the top edges, floating golden bokeh light particles, crescent moon and small stars, cinematic dramatic lighting, rich ornate details, high quality, no text, no letters, no words, no watermark",
  },
  {
    file: "bg-wide.png",
    size: "1888x992",
    prompt:
      "Wide premium Islamic banner background, glowing golden mosque dome and crescent silhouette on the right side with warm radiant light, luxurious deep emerald dark green atmosphere, elegant gold arabesque geometric pattern accents, golden bokeh particles, left half darker and cleaner for text overlay, cinematic dramatic lighting, high quality, no text, no letters, no words, no watermark",
  },
] as const;

async function main() {
  const zai = await ZAI.create();
  for (const job of JOBS) {
    const target = path.join(OUT, job.file);
    if (fs.existsSync(target) && fs.statSync(target).size > 50_000) {
      console.log(`SKIP (sudah ada): ${job.file}`);
      continue;
    }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: job.prompt,
          // ukuran portrait/wide kustom — API menerimanya, tipe SDK union-nya sempit
          size: job.size as unknown as Parameters<typeof zai.images.generations.create>[0]["size"],
        });
        const b64 = res?.data?.[0]?.base64;
        if (!b64) throw new Error("respons kosong");
        fs.writeFileSync(target, Buffer.from(b64, "base64"));
        console.log(`OK: ${job.file} (${job.size}, ${fs.statSync(target).size} bytes)`);
        ok = true;
      } catch (err) {
        console.error(`Gagal attempt ${attempt} untuk ${job.file}:`, (err as Error).message);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    if (!ok) process.exitCode = 1;
  }
}

main();
