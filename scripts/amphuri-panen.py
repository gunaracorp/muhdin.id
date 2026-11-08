#!/usr/bin/env python3
"""Panen detail 779 anggota AMPHURI (amphuri.org/daftar-member).
Output: /tmp/panen26/detail-<n>.json + log gagal."""
import os, re, time, json, random, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

OUT = "/tmp/panen26"
os.makedirs(OUT, exist_ok=True)
urls = [l.strip() for l in open("/tmp/amphuri-detail-urls.txt") if l.strip()]
print(f"total url: {len(urls)}")

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"

def ambil(i_url):
    i, url = i_url
    path = f"{OUT}/detail-{i:04d}.json"
    if os.path.exists(path) and os.path.getsize(path) > 200:
        return i, "sudah-ada"
    for attempt in range(3):
        try:
            req = urllib.request.Request("https://amphuri.org" + url, headers={
                "User-Agent": UA, "Accept": "application/json,text/html",
                "Referer": "https://amphuri.org/daftar-member"})
            with urllib.request.urlopen(req, timeout=25) as r:
                data = r.read()
            if len(data) > 200:
                open(path, "wb").write(data)
                return i, "ok"
            return i, f"kecil:{len(data)}"
        except Exception as e:
            if attempt == 2:
                return i, f"gagal:{type(e).__name__}"
            time.sleep(1.5 + attempt)

hasil = {}
t0 = time.time()
with ThreadPoolExecutor(max_workers=4) as ex:
    futs = [ex.submit(ambil, (i, u)) for i, u in enumerate(urls)]
    for n, fut in enumerate(as_completed(futs), 1):
        i, status = fut.result()
        hasil[i] = status
        if n % 100 == 0:
            print(f"  {n}/{len(urls)} ... {time.time()-t0:.0f}s")

ok = sum(1 for s in hasil.values() if s in ("ok", "sudah-ada"))
gagal = {i: s for i, s in hasil.items() if s not in ("ok", "sudah-ada")}
print(f"SELESAI: ok={ok}, gagal={len(gagal)}, waktu={time.time()-t0:.0f}s")
if gagal:
    json.dump(gagal, open(f"{OUT}/gagal.json", "w"))
    print("contoh gagal:", list(gagal.items())[:5])
