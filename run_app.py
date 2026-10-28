"""
Unified Application Runner for:
SYSTEM BOTTLENECK IDENTIFICATION USING CORRELATION AND RANK CORRELATION

Launches the Python FastAPI analytical backend and serves the interactive
3D Observatory frontend. Automatically opens your browser.
"""

import os
import sys
import time
import webbrowser
import subprocess
import uvicorn

# Ensure backend directory is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


def print_banner():
    banner = """
================================================================================
   SYSTEM BOTTLENECK IDENTIFICATION USING CORRELATION AND RANK CORRELATION
           3D Performance Observatory & Pure Python Analytical Core
================================================================================
    * Analytical Core: Python 3.14 + NumPy 2.x + SciPy 1.18.x + Pandas
    * Mathematical Models: Pearson Linear Covariance & Spearman Rank Monotonicity
    * Central Visualization: Three.js 3D System Performance Observatory
    * Server Endpoint: http://127.0.0.1:8000
================================================================================
"""
    print(banner)


def open_browser(url: str, delay_seconds: float = 1.2):
    """Opens browser after brief delay so server has initialized."""
    import threading

    def _open():
        time.sleep(delay_seconds)
        print(f"[*] Launching 3D System Observatory in browser: {url}")
        webbrowser.open(url)

    thread = threading.Thread(target=_open, daemon=True)
    thread.start()


def main():
    print_banner()

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    url = f"http://{host}:{port}/"

    open_browser(url)

    print(f"[*] Starting FastAPI analytical server on {url}")
    print("[*] Press CTRL+C to terminate the application.")
    uvicorn.run("backend.main:app", host=host, port=port, log_level="info", reload=False)


if __name__ == "__main__":
    main()
