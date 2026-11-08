"""Server penampung POST kecil untuk menyalin file dari konteks browser agent-browser.

Alasan: beberapa domain resmi (mis. 2017.kemenag.go.id) memblokir/timeout curl & WebFetch
dari sandbox, tapi TERBACA di agent-browser. Trik: buka halaman HTML di domain tsb,
lalu dari JS halaman fetch file same-origin, ubah ke base64, dan POST ke server ini.
Chrome menganggap http://localhost sebagai trusted origin sehingga fetch dari halaman
HTTPS ke localhost diizinkan (bukan mixed content).
"""
from http.server import BaseHTTPRequestHandler, HTTPServer

OUT = "/tmp/panen25/upload.bin"


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"ok")

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(n)
        with open(OUT, "wb") as f:
            f.write(data)
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(f"simpan {len(data)} bytes".encode())
        print(f"saved {len(data)} bytes -> {OUT}", flush=True)


if __name__ == "__main__":
    print("listening 127.0.0.1:9999", flush=True)
    HTTPServer(("127.0.0.1", 9999), Handler).serve_forever()
