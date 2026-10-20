#!/usr/bin/env bash
# Capture desktop and mobile evidence for the running preview.
# Exit 75 for temporary browser/navigation infrastructure failures; exit 1 for
# script or rendering defects.
set -uo pipefail

fail() {
  local code="$1"
  shift
  printf 'capture: %s\n' "$*" >&2
  exit "$code"
}

if [[ -z "${CAPTURE_URL:-}" ]]; then
  fail 1 "CAPTURE_URL is required"
fi
if [[ -z "${CAPTURE_DIR:-}" ]]; then
  fail 1 "CAPTURE_DIR is required"
fi

SESSION="omgithub-capture-$$"
READY_TIMEOUT="${CAPTURE_READY_TIMEOUT:-45}"

/usr/bin/time -p mkdir -p "$CAPTURE_DIR" || fail 1 "cannot create CAPTURE_DIR: $CAPTURE_DIR"

close_browser() {
  /usr/bin/time -p playwright-cli -s="$SESSION" close >/dev/null 2>&1 || true
}
trap close_browser EXIT

# Pre-flight check: keep public-tunnel outages separate from HTTP defects.
status="$(/usr/bin/time -p curl --silent --show-error --location --max-time 30 \
  --output /dev/null --write-out '%{http_code}' "$CAPTURE_URL" 2>/dev/null)" || status=000
case "$status" in
  2*) : ;;
  000|408|429|5*) fail 75 "preview unavailable (HTTP $status)" ;;
  *) fail 1 "preview returned HTTP $status" ;;
esac

if ! /usr/bin/time -p playwright-cli -s="$SESSION" open >/dev/null 2>&1; then
  fail 75 "could not launch the capture browser"
fi

# Capture the app's offline/demo path deterministically so public exchange
# outages cannot leave the page waiting on network requests.
for pattern in '**api.binance.com/**' '**api.bybit.com/**' '**www.okx.com/**'; do
  if ! /usr/bin/time -p playwright-cli -s="$SESSION" route "$pattern" \
    --status 503 --body '{"error":true}' >/dev/null 2>&1; then
    fail 75 "could not install the capture network route for $pattern"
  fi
done

if ! /usr/bin/time -p playwright-cli -s="$SESSION" goto "$CAPTURE_URL" >/dev/null 2>&1; then
  fail 75 "navigation to $CAPTURE_URL failed"
fi

ready=0
for ((attempt = 0; attempt < READY_TIMEOUT; attempt++)); do
  rendered="$(/usr/bin/time -p playwright-cli -s="$SESSION" --raw eval \
    "() => { const tab = document.querySelector('.tab.on'); return tab ? tab.querySelectorAll('.mrow, .card').length : 0; }" \
    2>/dev/null | tr -d '[:space:]')"
  if [[ "$rendered" =~ ^[0-9]+$ ]] && (( rendered > 0 )); then
    ready=1
    break
  fi
  /usr/bin/time -p sleep 1 >/dev/null 2>&1
done
if (( ready == 0 )); then
  /usr/bin/time -p playwright-cli -s="$SESSION" console >&2 2>&1 || true
  fail 1 "app did not render content within ${READY_TIMEOUT}s"
fi

capture_view() {
  local width="$1" height="$2" filename="$3"
  /usr/bin/time -p playwright-cli -s="$SESSION" resize "$width" "$height" >/dev/null 2>&1 || return 75
  /usr/bin/time -p sleep 1 >/dev/null 2>&1
  /usr/bin/time -p playwright-cli -s="$SESSION" screenshot \
    --filename="$CAPTURE_DIR/$filename" >/dev/null 2>&1 || return 75
  [[ -s "$CAPTURE_DIR/$filename" ]] || return 1
  return 0
}

capture_view 1440 900 "final-desktop.png" || {
  rc=$?
  (( rc == 75 )) && fail 75 "desktop screenshot failed" || fail 1 "desktop screenshot was not written"
}
capture_view 390 844 "final-mobile.png" || {
  rc=$?
  (( rc == 75 )) && fail 75 "mobile screenshot failed" || fail 1 "mobile screenshot was not written"
}

printf 'capture: wrote %s and %s\n' \
  "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"
exit 0
