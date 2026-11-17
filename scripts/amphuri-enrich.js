#!/usr/bin/env node
/* Enrichment 79 anggota DB dgn data AMPHURI (guard anti-dobel) + bersihkan apostrof
   nyangkut "123'" di description anggota AMPHURI hasil impor pertama. */
const {PrismaClient} = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient({datasources:{db:{url:'file:'+process.cwd()+'/db/custom.db'}}});

function bersih(s){return (s||'').replace(/\\n/g,' ').replace(/\s+/g,' ').trim();}

(async()=>{
  const enrich = JSON.parse(fs.readFileSync('/tmp/panen26/enrich-final.json','utf8'));
  console.log('target enrich:', enrich.length);

  let ok=0, lewati=0;
  for (const e of enrich){
    const a = e.amphuri;
    const parts = [];
    if (a.member_no){
      const dpd = a.dpd ? `, DPD ${a.dpd}` : '';
      parts.push(`Anggota AMPHURI No. ${a.member_no}${dpd}`);
    }
    if (a.leader) parts.push(`Pimpinan (AMPHURI): ${a.leader}`);
    // izin kedua dari AMPHURI (yang bukan izin utama DB)
    const izPpiu = a.izin_ppiu && /\d/.test(a.izin_ppiu) && a.izin_ppiu !== '-' ? a.izin_ppiu : '';
    const izPihk = a.izin_pihk && /\d/.test(a.izin_pihk) && a.izin_pihk !== '-' ? a.izin_pihk : '';
    const m = await p.member.findUnique({where:{id:e.db_id}, select:{description:true, licenseNo:true, type:true}});
    if (!m){ console.log('  skip, id tak ada:', e.db_id); continue; }
    if (m.description && m.description.includes('Anggota AMPHURI')){ lewati++; continue; } // anti-dobel
    const nrm = s=>(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    if (izPihk && nrm(izPihk)!==nrm(m.licenseNo)){
      parts.push(m.type==='PIHK' ? `Izin PIHK versi AMPHURI: ${izPihk}` : `juga terdaftar sbg PIHK (AMPHURI): ${izPihk}`);
    }
    if (izPpiu && nrm(izPpiu)!==nrm(m.licenseNo) && nrm(izPpiu)!==nrm(izPihk)){
      parts.push(m.type==='PPIU' ? `Izin PPIU versi AMPHURI: ${izPpiu}` : `juga terdaftar sbg PPIU (AMPHURI): ${izPpiu}`);
    }
    if (!parts.length){ lewati++; continue; }
    const desc = (m.description ? m.description.replace(/\s*·\s*Sumber data:.*$/,'') + ' · ' : '') +
      parts.join(' · ') + ' · ' +
      (m.description ? (m.description.match(/Sumber data:.*$/)||['Sumber data: AMPHURI'])[0] : 'Sumber data: Direktori anggota resmi AMPHURI (amphuri.org/daftar-member)');
    await p.member.update({where:{id:e.db_id}, data:{description: desc}});
    ok++;
  }
  console.log(`enrich selesai: ok=${ok}, lewati=${lewati}`);

  // bersihkan apostrof nyangkut pada anggota AMPHURI (description mengandung "AMPHURI")
  const rows = await p.member.findMany({where:{description:{contains:'AMPHURI'}}, select:{id:true, description:true}});
  let fixed=0;
  for (const r of rows){
    const baru = r.description.replace(/(\d)'/g, '$1');
    if (baru !== r.description){
      await p.member.update({where:{id:r.id}, data:{description: baru}});
      fixed++;
    }
  }
  console.log(`apostrof dibersihkan: ${fixed} dari ${rows.length} anggota AMPHURI`);

  const total = await p.member.count();
  const byType = await p.member.groupBy({by:['type'],_count:{_all:true}});
  console.log('TOTAL DB:', total, JSON.stringify(byType.map(t=>({t:t.type,n:t._count._all}))));
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
