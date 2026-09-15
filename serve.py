"""
Local preview server for the Tangmere site.

Run it from this folder:

    python3 serve.py

Then open http://127.0.0.1:4173/index.html
Stop it with Ctrl+C.

Two deliberate details:
  * Threaded, because the 32MB looping hero video holds a connection
    open and would otherwise block every other request.
  * No-cache headers, so edits show up on a plain refresh.
"""

import functools
import http.server
import os
import socketserver

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 4173


TEXT_TYPES = ("text/html", "text/css", "text/javascript", "application/javascript")


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
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

    def log_message(self, fmt, *args):
        pass


class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


Handler = functools.partial(NoCacheHandler, directory=SITE_DIR)

if __name__ == "__main__":
    with ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Tangmere site serving at http://127.0.0.1:{PORT}/index.html")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
