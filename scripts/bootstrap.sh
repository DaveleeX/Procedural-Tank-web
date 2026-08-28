#!/usr/bin/env bash
set -euo pipefail

repo=""
target="procedural-cad-workspace"
agent=""
skip_run=0
forgecad_version="latest"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --target) target="$2"; shift 2 ;;
    --agent) agent="$2"; shift 2 ;;
    --forgecad-version) forgecad_version="$2"; shift 2 ;;
    --skip-run) skip_run=1; shift ;;
    --help|-h)
      echo "bootstrap.sh [--repo <git-url>] [--target <folder>] [--agent codex|claude|opencode] [--forgecad-version <version>] [--skip-run]"
      exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

command -v npm >/dev/null 2>&1 || { echo "Node.js/npm is required. Install Node.js LTS, then rerun." >&2; exit 1; }

if [[ -n "$repo" ]]; then
  command -v git >/dev/null 2>&1 || { echo "Git is required to download the project." >&2; exit 1; }
  if [[ -d "$target/.git" ]]; then
    git -C "$target" pull --ff-only
  elif [[ -e "$target" ]] && [[ -n "$(ls -A "$target" 2>/dev/null)" ]]; then
    echo "Target exists and is not an empty Git checkout: $target" >&2
    exit 1
  else
    git clone --depth 1 "$repo" "$target"
  fi
else
  mkdir -p "$target"
fi

target="$(cd "$target" && pwd)"
tools="$target/.tools"
mkdir -p "$tools"
npm install --prefix "$tools" "forgecad@$forgecad_version" --no-audit --no-fund --fetch-retries=2 --fetch-timeout=60000

forgecad="$tools/node_modules/.bin/forgecad"
[[ -x "$forgecad" ]] || { echo "ForgeCAD executable was not installed: $forgecad" >&2; exit 1; }

mkdir -p "$target/.bootstrap"
printf '%s\n' "$forgecad" > "$target/.bootstrap/forgecad-path.txt"

if [[ -n "$agent" ]]; then
  case "$agent" in codex|claude|opencode) ;; *) echo "Unsupported agent: $agent" >&2; exit 2 ;; esac
  "$forgecad" skill install --target "$agent"
fi

if [[ "$skip_run" -eq 0 ]]; then
  [[ -f "$target/main.forge.js" ]] || { echo "Project downloaded, but main.forge.js is missing." >&2; exit 1; }
  "$forgecad" run "$target/main.forge.js" --quality live
fi

echo "BOOTSTRAP READY"
echo "PROJECT=$target"
echo "FORGECAD=$forgecad"
