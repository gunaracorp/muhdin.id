#!/usr/bin/env python3
"""Retry detail AMPHURI yang gagal (429) — 1 worker, jeda 2s, backoff."""
import os, time, json, urllib.request, urllib.error

OUT = "/tmp/panen26"
urls = [l.strip() for l in open("/tmp/amphuri-detail-urls.txt") if l.strip()]
gagal = json.load(open(f"{OUT}/gagal.json"))
print(f"retry {len(gagal)} url, jeda 2s ...")

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
masih_gagal = {}
t0 = time.time()
for n, (k, _) in enumerate(sorted(gagal.items(), key=lambda x: int(x[0])), 1):
    i = int(k)
    path = f"{OUT}/detail-{i:04d}.json"
    if os.path.exists(path) and os.path.getsize(path) > 200:
        continue
    status = None
    for attempt in range(4):
        try:
            req = urllib.request.Request("https://amphuri.org" + urls[i], headers={
                "User-Agent": UA, "Accept": "application/json,text/html",
                "Referer": "https://amphuri.org/daftar-member"})
            with urllib.request.urlopen(req, timeout=25) as r:
                data = r.read()
            if len(data) > 200:
                open(path, "wb").write(data)
                status = "ok"
            else:
                status = f"kecil:{len(data)}"
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(8 + 6 * attempt)  # backoff
                status = f"429:{attempt}"
            else:
                status = f"http{e.code}"
                break
        except Exception as e:
            status = f"{type(e).__name__}"
            break
    if status != "ok":
        masih_gagal[k] = status
    time.sleep(2)
    if n % 40 == 0:
        print(f"  {n}/{len(gagal)} ... {time.time()-t0:.0f}s, masih gagal {len(masih_gagal)}")

json.dump(masih_gagal, open(f"{OUT}/gagal.json", "w"))
ok_total = sum(1 for i in range(len(urls)) if os.path.exists(f"{OUT}/detail-{i:04d}.json"))
print(f"SELESAI retry: file ada {ok_total}/{len(urls)}, masih gagal {len(masih_gagal)}")
if masih_gagal:
    print("sisa:", list(masih_gagal.items())[:10])
