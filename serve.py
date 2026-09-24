"""
Local preview server for the Tangmere site.

Run it from this folder:

    python3 serve.py          # port 4173
    python3 serve.py 4174     # or any other port

Then open http://127.0.0.1:4173/index.html
Stop it with Ctrl+C.

Three deliberate details:
  * Threaded, because the hero film clips hold connections open and
    would otherwise block every other request.
  * No-cache headers, so edits show up on a plain refresh.
  * Byte-range requests, which Safari requires before it will play any
    video at all. Without them the hero film never starts in Safari.
"""

import functools
import http.server
import os
import re
import socketserver
import sys

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173


TEXT_TYPES = ("text/html", "text/css", "text/javascript", "application/javascript")


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    _range_left = None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def guess_type(self, path):
        # Without an explicit charset, browsers fall back to guessing the
        # encoding, which has misread this project's UTF-8 middle dots
        # (·) as unrelated CJK characters. All the site's text files are
        # UTF-8, so say so.
        mimetype = super().guess_type(path)
        if mimetype in TEXT_TYPES:
            return f"{mimetype}; charset=UTF-8"
        return mimetype

    def send_head(self):
        path = self.translate_path(self.path)
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", "").strip())
        if not match or not os.path.isfile(path):
            return super().send_head()

        size = os.path.getsize(path)
        first, last = match.groups()
        if first:
            start, end = int(first), int(last) if last else size - 1
        else:  # "bytes=-N" means the final N bytes
            start, end = max(0, size - int(last or 0)), size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        self._range_left = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        if self._range_left is None:
            return super().copyfile(source, outputfile)
        while self._range_left > 0:
            chunk = source.read(min(64 * 1024, self._range_left))
            if not chunk:
                break
            outputfile.write(chunk)
            self._range_left -= len(chunk)

    def log_message(self, fmt, *args):
        pass


class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        # Browsers routinely abandon video requests mid-stream; that's not an error.
        if isinstance(sys.exc_info()[1], ConnectionError):
            return
        super().handle_error(request, client_address)


Handler = functools.partial(NoCacheHandler, directory=SITE_DIR)

if __name__ == "__main__":
    with ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Tangmere site serving at http://127.0.0.1:{PORT}/index.html")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
