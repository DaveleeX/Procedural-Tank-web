#!/usr/bin/env python3
"""Cross-platform static server for Armour Atlas (Windows / macOS / Linux).

From the repo root:

    python3 serve.py          # macOS / Linux
    python serve.py           # Windows
    py -3 serve.py            # Windows launcher

Then open http://127.0.0.1:8123/demo/tank-atlas/

Do not open index.html via file:// — browsers block ES modules.
"""
from __future__ import annotations

import argparse
import os
import socket
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

DEFAULT_PORT = 8123
ATLAS_PATH = "/demo/tank-atlas/"
ROOT = os.path.dirname(os.path.abspath(__file__))


class ReusableServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve Armour Atlas locally. Works the same on Windows and macOS."
    )
    parser.add_argument(
        "--port",
        type=int,
        default=DEFAULT_PORT,
        help=f"listen port (default {DEFAULT_PORT})",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="do not open the default browser",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="bind address (default 127.0.0.1)",
    )
    return parser.parse_args(argv)


def port_in_use(host: str, port: int) -> bool:
    probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        probe.settimeout(0.4)
        return probe.connect_ex((host, port)) == 0
    finally:
        probe.close()


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    os.chdir(ROOT)
    url = f"http://{args.host}:{args.port}{ATLAS_PATH}"

    if port_in_use(args.host, args.port):
        print(f"Port {args.port} is already in use.")
        print(f"Close the other server, or pick another port: python serve.py --port {args.port + 1}")
        return 1

    httpd = ReusableServer((args.host, args.port), SimpleHTTPRequestHandler)
    print(f"Serving {ROOT}")
    print(f"Open {url}")
    print("Press Ctrl+C to stop. Do not open index.html via file://")
    print()

    if not args.no_browser:
        threading.Timer(0.35, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
