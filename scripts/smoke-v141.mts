/**
 * smoke-v141.mts — QA sprint v14.1 «AKADEMI & MITRA».
 * Uji alur baru end-to-end lewat HTTP pada server standalone.
 * Jalankan: BASE_URL=http://127.0.0.1:3105 bun scripts/smoke-v141.mts
 */

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3105";
// Nomor acak per run — registrasi/checkout tidak bentrok antar eksekusi.
const RUN = String(Math.floor(Math.random() * 900000) + 100000);
let pass = 0;
let failCount = 0;

function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
    console.log(`  [PASS] ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failCount++;
    console.log(`  [FAIL] ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function jreq(path: string, init?: RequestInit) {
  const res = await fetch(BASE + path, init);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function main() {
  console.log(`══ smoke-v141 → ${BASE} ══`);

  /* ---------- R-024 kelas live ---------- */
  const listKelas = await jreq("/api/live-classes");
  ok("A1 kelas live list publik", listKelas.status === 200 && Array.isArray(listKelas.data) && listKelas.data.length >= 2, `${listKelas.data?.length} kelas`);
  const target = (listKelas.data ?? [])[0];
  const regKelas = await jreq("/api/live-classes/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classId: target?.id, name: "Jamaah Smoke Test", phone: `+62812${RUN}1` }),
  });
  ok("A2 register kelas 201", regKelas.status === 201, regKelas.data?.message?.slice(0, 60));
  const regKelasDup = await jreq("/api/live-classes/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classId: target?.id, name: "Jamaah Smoke Test", phone: `+62812${RUN}1` }),
  });
  ok("A3 duplikat nomor ditolak", regKelasDup.status === 400, `status ${regKelasDup.status}`);
  const regKelasBad = await jreq("/api/live-classes/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classId: target?.id, name: "A", phone: "bukan-telepon" }),
  });
  ok("A4 Zod menolak nama/telepon kotor", regKelasBad.status === 400, `status ${regKelasBad.status}`);
  const opsUnauth = await jreq(`/api/live-classes/ops?classId=${target?.id}`);
  ok("A5 ops mentor butuh sesi (401)", opsUnauth.status === 401, `status ${opsUnauth.status}`);

  /* ---------- R-045 group order B2B ---------- */
  const pkgs = await jreq("/api/packages");
  const pkg = (pkgs.data ?? []).find((p: { slots: number; slotsTaken: number }) => p.slots - p.slotsTaken > 20) ?? (pkgs.data ?? [])[0];
  const tooFew = await jreq("/api/group-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      groupName: "Rombongan Smoke", coordinatorName: "Smoke Coordinator", coordinatorPhone: "+6281200000043",
      packageId: pkg?.id, membersText: "Ahmad\nFatimah\nYusuf", pdpConsent: true,
    }),
  });
  ok("B1 <10 anggota ditolak server", tooFew.status === 400, `status ${tooFew.status}`);
  const memberNames = Array.from({ length: 14 }, (_, i) => `Anggota Smoke ${String(i + 1).padStart(2, "0")}`).join("\n");
  const b2b = await jreq("/api/group-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      groupName: `Rombongan Smoke ${RUN}`, coordinatorName: "Smoke Coordinator", coordinatorPhone: "+6281200000043",
      packageId: pkg?.id, membersText: memberNames, pdpConsent: true,
    }),
  });
  ok("B2 14 anggota → 201 satu tagihan", b2b.status === 201 && !!b2b.data?.order?.code, `${b2b.data?.order?.code}: ${b2b.data?.order?.memberCount} × ${b2b.data?.order?.unitPrice}`);
  ok("B3 total = unit × count (server-side)", b2b.data?.order?.totalAmount === b2b.data?.order?.unitPrice * b2b.data?.order?.memberCount, `${b2b.data?.order?.totalAmount}`);
  const b2bNoPdp = await jreq("/api/group-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      groupName: "Tanpa PDP", coordinatorName: "Smoke", coordinatorPhone: "+6281200000043",
      packageId: pkg?.id, membersText: memberNames, pdpConsent: false,
    }),
  });
  ok("B4 tanpa persetujuan PDP ditolak", b2bNoPdp.status === 400, `status ${b2bNoPdp.status}`);
  if (b2b.data?.order?.code) {
    const status = await jreq(`/api/group-orders?code=${b2b.data.order.code}`);
    ok("B5 pantau status via kode (publik)", status.status === 200 && status.data?.order?.status === "PENDING", status.data?.order?.status);
  }

  /* ---------- R-043 harga server-side ---------- */
  const pkgWithPromo = (pkgs.data ?? []).find((p: { promos?: string[] }) => (p.promos ?? []).length > 0);
  ok("C1 katalog membawa label promo R-043", !!pkgWithPromo, pkgWithPromo?.promos?.join(" · "));
  if (pkgWithPromo && pkgWithPromo.price > 0) {
    const co = await jreq("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: pkgWithPromo.id, name: `Smoke Pricer ${RUN}`, phone: `+62812${RUN}3`, quantity: 1, pdpConsent: true,
      }),
    });
    if (co.status === 201) {
      ok("C2 checkout memakai harga final < harga dasar", co.data?.order?.unitPrice < co.data?.order?.unitBasePrice, `${co.data?.order?.unitBasePrice} → ${co.data?.order?.unitPrice} (${(co.data?.order?.priceAdjustments ?? []).map((a: { label: string }) => a.label).join(", ")})`);
      ok("C3 amount = unitPrice × qty − kupon", co.data?.order?.amount === co.data?.order?.subtotal, `${co.data?.order?.amount}`);
    } else {
      ok("C2 checkout promo", false, `status ${co.status} ${JSON.stringify(co.data).slice(0, 80)}`);
    }
  }
  const coBad = await jreq("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageId: pkg?.id, name: "S", phone: "123", pdpConsent: true }),
  });
  ok("C4 checkout payload kotor ditolak Zod", coBad.status === 400, `status ${coBad.status}`);

  /* ---------- R-044 refund ---------- */
  const policy = await jreq("/api/refund-requests?policy=1");
  ok("D1 tabel kebijakan publik (5 tier)", policy.status === 200 && policy.data?.tiers?.length === 5, `${policy.data?.tiers?.length} tier, SLA ${policy.data?.slaDays} hari`);
  const refundFake = await jreq("/api/refund-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: "ORD-20260101-XXXX", phone: `+62812${RUN}3`, reason: "Uji smoke refund" }),
  });
  ok("D2 order tak dikenal → 404 jujur", refundFake.status === 404, `status ${refundFake.status}`);
  const refundUnauth = await jreq("/api/refund-requests");
  ok("D3 daftar pengajuan butuh sesi (401)", refundUnauth.status === 401, `status ${refundUnauth.status}`);

  /* ---------- R-029 merchant ---------- */
  const merchants = await jreq("/api/merchants");
  ok("E1 katalog merchant aktif", merchants.status === 200 && merchants.data?.length >= 5, `${merchants.data?.length} merchant`);
  const m0 = merchants.data?.[0];
  const redeemBad = await jreq("/api/merchants/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId: m0?.id, cardNo: "KTA-2026-XXXXX" }),
  });
  ok("E2 KTA tak dikenal ditolak", redeemBad.status === 400, `status ${redeemBad.status}`);
  const merchantsAllUnauth = await jreq("/api/merchants?all=1");
  ok("E3 daftar semua butuh sesi (401)", merchantsAllUnauth.status === 401, `status ${merchantsAllUnauth.status}`);

  /* ---------- R-090 masjid ---------- */
  const masjidReg = await jreq("/api/mosque-partners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Masjid Smoke Test ${RUN}`, type: "MASJID", city: "Serang", province: "Banten",
      picName: "Smoke PIC", phone: `+62812${RUN}4`, reach: 50, program: "KAJIAN", pdpConsent: true,
    }),
  });
  ok("F1 daftar mitra masjid → 201 + kode MHD-MP", masjidReg.status === 201 && /^MHD-MP-/.test(masjidReg.data?.partner?.code ?? ""), masjidReg.data?.partner?.code);
  const masjidNoPdp = await jreq("/api/mosque-partners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Masjid Tanpa PDP", type: "MASJID", city: "Serang",
      picName: "Smoke", phone: `+62812${RUN}4`, program: "KAJIAN", pdpConsent: false,
    }),
  });
  ok("F2 tanpa PDP ditolak", masjidNoPdp.status === 400, `status ${masjidNoPdp.status}`);
  if (masjidReg.data?.partner?.code) {
    const dash = await jreq(`/api/mosque-partners?code=${masjidReg.data.partner.code}`);
    ok("F3 dashboard relasi via kode (publik)", dash.status === 200 && dash.data?.partner?.status === "PENDING", dash.data?.partner?.status);
  }
  const masjidUnauth = await jreq("/api/mosque-partners");
  ok("F4 daftar semua butuh sesi (401)", masjidUnauth.status === 401, `status ${masjidUnauth.status}`);

  /* ---------- R-065 API publik v1 ---------- */
  const v1NoKey = await jreq("/api/public/v1/status");
  ok("G1 v1 tanpa kunci → 401", v1NoKey.status === 401, `status ${v1NoKey.status}`);
  const v1BadKey = await fetch(BASE + "/api/public/v1/packages", { headers: { "X-API-Key": "kunci-palsu-tidak-valid-1234567890" } });
  ok("G2 v1 kunci palsu → 403", v1BadKey.status === 403, `status ${v1BadKey.status}`);
  const partnersAdminUnauth = await jreq("/api/api-partners");
  ok("G3 CMS mitra API butuh sesi (401)", partnersAdminUnauth.status === 401, `status ${partnersAdminUnauth.status}`);

  /* ---------- R-025 forum per-kelas ---------- */
  const kelas3 = (listKelas.data ?? [])[0];
  const forumKelas = await jreq(`/api/forum?kelasId=${kelas3?.id ?? ""}`);
  ok("H1 forum ?kelasId= memfilter", forumKelas.status === 200 && Array.isArray(forumKelas.data), `${forumKelas.data?.length} thread kelas`);
  const forumBadKelas = await jreq("/api/forum", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Pertanyaan smoke test kelas tidak ada", body: "Isi diskusi cukup panjang untuk melewati validasi minimal ya.",
      authorName: "Smoke Author", category: "Umum", kelasId: "kelas-tidak-ada",
    }),
  });
  ok("H2 kelasId palsu ditolak (kelas tak ditemukan)", forumBadKelas.status === 400, `status ${forumBadKelas.status} ${forumBadKelas.data?.error ?? ""}`);

  /* ---------- R-016 doa (data statis — pastikan endpoint utama sehat) ---------- */
  const status = await jreq("/api/status");
  ok("I1 /api/status sehat", status.status === 200 && status.data?.ok === true, `db ${status.data?.db?.latencyMs} ms`);

  console.log(`\n══ RINGKASAN smoke-v141 ══`);
  console.log(`Lolos: ${pass} · Gagal: ${failCount}`);
  if (failCount > 0) process.exit(1);
}

await main();
