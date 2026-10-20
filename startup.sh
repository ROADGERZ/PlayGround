#!/usr/bin/env bash
# Once-per-worker prerequisites: runtime binaries and Playwright Chromium.
set -euo pipefail

/usr/bin/time -p mkdir -p "${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p bash -c 'command -v python3 >/dev/null'
/usr/bin/time -p bash -c 'command -v node >/dev/null'
/usr/bin/time -p playwright-cli install-browser chromium
