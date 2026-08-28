#!/usr/bin/env bash
# macOS / Linux / Git Bash. Same entry as serve.bat / serve.ps1 on Windows.
set -euo pipefail
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
  exec python3 ./serve.py "$@"
fi
if command -v python >/dev/null 2>&1; then
  exec python ./serve.py "$@"
fi

echo "Need Python 3 on PATH (python3 or python)." >&2
echo "macOS: xcode-select --install   or   brew install python" >&2
exit 1
