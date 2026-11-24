"""Start the prebuilt Mochi app locally. Python 3, no extra packages."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser

root = Path(__file__).resolve().parent / 'dist'
if not (root / 'index.html').is_file():
    raise SystemExit('Build missing: run npm ci and npm run build first.')
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
    url = f'http://127.0.0.1:{server.server_port}/'
    print(f'MOCHI is running: {url}\nKeep this window open. Ctrl+C to stop.', flush=True)
    threading.Timer(.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
