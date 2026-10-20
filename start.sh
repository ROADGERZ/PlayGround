#!/usr/bin/env bash
# Build the static CryptoAI PRO web bundle and serve it in the foreground.
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_DIR="$PWD"
PORT="${PORT:-3000}"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
BUILD_DIR="$PROJECT_DIR/dist"

/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p printf '{"project":"%s","directory":"%s"}\n' "$PROJECT_DIR" "$BUILD_DIR" > "$WEB_DIR/deployment-output.json"

if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
else
  /usr/bin/time -p printf '%s\n' "No package.json — serving the static site without dependencies."
fi

/usr/bin/time -p rm -rf "$BUILD_DIR"
/usr/bin/time -p mkdir -p "$BUILD_DIR"
/usr/bin/time -p cp -R "$PROJECT_DIR/site/." "$BUILD_DIR/"

if [[ ! -f "$BUILD_DIR/index.html" ]]; then
  printf '%s\n' "Build failed: $BUILD_DIR/index.html is missing." >&2
  exit 1
fi

printf '%s\n' "Serving $BUILD_DIR on http://0.0.0.0:$PORT"
exec /usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$BUILD_DIR"
