import sys
import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from server import app
import uvicorn

if __name__ == '__main__':
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info",
        access_log=False
    )
    server = uvicorn.Server(config)
    # Prevent background EOF from closing uvicorn
    server.install_signal_handlers = lambda: None
    print("Serving CrypTrader ML Server on port 8000...", flush=True)
    server.run()
