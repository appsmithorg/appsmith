#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# appsmith-api-diag.sh — Appsmith Consolidated API Diagnostic Script
#
# Interactively tests the Appsmith consolidated API and optionally runs
# network diagnostics. On failure, diagnostics run automatically.
###############################################################################

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Counters ─────────────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# ── Log file ─────────────────────────────────────────────────────────────────
LOG_FILE="appsmith-diag-$(date +%Y%m%d_%H%M%S).log"

# ── Temp files ───────────────────────────────────────────────────────────────
COOKIE_JAR=$(mktemp)
RESP_BODY=$(mktemp)
RESP_HEADERS=$(mktemp)

cleanup() {
  rm -f "$COOKIE_JAR" "$RESP_BODY" "$RESP_HEADERS"
}
trap cleanup EXIT

###############################################################################
# Helpers
###############################################################################

# Print to both stdout (with colors) and log file (stripped of ANSI)
log() {
  local msg="$*"
  echo -e "$msg"
  echo -e "$msg" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
}

log_n() {
  local msg="$*"
  echo -en "$msg"
  echo -en "$msg" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
}

pass() {
  log "  ${GREEN}✓ PASS${RESET}: $*"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  log "  ${RED}✗ FAIL${RESET}: $*"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
  log "  ${YELLOW}⚠ WARN${RESET}: $*"
  WARN_COUNT=$((WARN_COUNT + 1))
}

section() {
  log ""
  log "${BOLD}${CYAN}━━━ $* ━━━${RESET}"
}

has_cmd() {
  command -v "$1" &>/dev/null
}

# Portable timeout wrapper (macOS lacks GNU timeout)
# Usage: run_with_timeout SECONDS command [args...]
run_with_timeout() {
  local secs="$1"; shift
  if has_cmd timeout; then
    timeout "$secs" "$@"
  elif has_cmd gtimeout; then
    gtimeout "$secs" "$@"
  elif has_cmd perl; then
    perl -e "alarm $secs; exec @ARGV" -- "$@"
  else
    # Last resort: background + sleep + kill
    "$@" &
    local pid=$!
    ( sleep "$secs" && kill "$pid" 2>/dev/null ) &
    local watcher=$!
    wait "$pid" 2>/dev/null
    local rc=$?
    kill "$watcher" 2>/dev/null
    wait "$watcher" 2>/dev/null
    return $rc
  fi
}

# JSON field extractor — prefers jq, falls back to python3
json_field() {
  local json="$1" expr="$2"
  if has_cmd jq; then
    echo "$json" | jq -r "$expr" 2>/dev/null
  elif has_cmd python3; then
    echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    parts = '''$expr'''.strip('.').split('.')
    val = data
    for p in parts:
        if p == '':
            continue
        if isinstance(val, list):
            val = val[int(p)]
        else:
            val = val[p]
    if val is None:
        print('null')
    elif isinstance(val, (dict, list)):
        print(json.dumps(val))
    else:
        print(val)
except Exception:
    print('null')
" 2>/dev/null
  else
    echo "null"
  fi
}

# JSON length — for arrays
json_length() {
  local json="$1" expr="$2"
  if has_cmd jq; then
    echo "$json" | jq "$expr | length" 2>/dev/null || echo 0
  elif has_cmd python3; then
    echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    parts = '''$expr'''.strip('.').split('.')
    val = data
    for p in parts:
        if p == '':
            continue
        if isinstance(val, list):
            val = val[int(p)]
        else:
            val = val[p]
    print(len(val) if isinstance(val, (list, dict)) else 0)
except Exception:
    print(0)
" 2>/dev/null
  else
    echo 0
  fi
}

# Pretty-print JSON (best-effort)
json_pretty() {
  if has_cmd jq; then
    jq '.' 2>/dev/null || cat
  elif has_cmd python3; then
    python3 -m json.tool 2>/dev/null || cat
  else
    cat
  fi
}

###############################################################################
# 1. Dependency check
###############################################################################

section "Dependency Check"

if ! has_cmd curl; then
  log "${RED}ERROR: curl is required but not found. Aborting.${RESET}"
  exit 1
fi
pass "curl found"

for tool in jq ping traceroute dig openssl nc python3; do
  if has_cmd "$tool"; then
    pass "$tool found"
  else
    warn "$tool not found — some features will be skipped"
  fi
done

if ! has_cmd jq && ! has_cmd python3; then
  warn "Neither jq nor python3 found — JSON parsing will be unavailable"
fi

###############################################################################
# 2. Interactive prompts
###############################################################################

section "Configuration"

log_n "${BOLD}Appsmith URL${RESET} (e.g. https://app.example.com) [http://localhost]: "
read -r BASE_URL
BASE_URL="${BASE_URL:-http://localhost}"
# Strip trailing slash
BASE_URL="${BASE_URL%/}"
echo "$BASE_URL" >> "$LOG_FILE"

log ""
log "  ${BOLD}Authentication method:${RESET}"
log "    1) Password login (email + password)"
log "    2) Browser login (SSO / Google / OAuth — opens browser)"
log "    3) Paste SESSION cookie (from browser dev tools)"
log_n "  ${BOLD}Choose [1/2/3]${RESET} [1]: "
read -r AUTH_METHOD
AUTH_METHOD="${AUTH_METHOD:-1}"
echo "Auth method: $AUTH_METHOD" >> "$LOG_FILE"

# Collect credentials based on auth method
EMAIL=""
PASSWORD=""
SESSION_COOKIE=""

case "$AUTH_METHOD" in
  1)
    log_n "${BOLD}Email${RESET}: "
    read -r EMAIL
    echo "$EMAIL" >> "$LOG_FILE"
    log_n "${BOLD}Password${RESET}: "
    read -rs PASSWORD
    echo ""
    echo "(password hidden)" >> "$LOG_FILE"
    ;;
  2)
    # Browser auth — credentials collected via browser
    ;;
  3)
    log ""
    log "  ${YELLOW}To get your SESSION cookie:${RESET}"
    log "    1. Log into Appsmith in your browser"
    log "    2. Open Developer Tools (F12 or Cmd+Opt+I)"
    log "    3. Go to Application → Cookies → your Appsmith domain"
    log "    4. Right-click the ${BOLD}SESSION${RESET} cookie → Edit Value → copy the value"
    log ""
    log_n "${BOLD}SESSION cookie value${RESET}: "
    read -r SESSION_COOKIE
    echo "(session cookie provided: ${SESSION_COOKIE:+yes})" >> "$LOG_FILE"
    ;;
  *)
    log "${RED}Invalid choice. Defaulting to password login.${RESET}"
    AUTH_METHOD=1
    log_n "${BOLD}Email${RESET}: "
    read -r EMAIL
    echo "$EMAIL" >> "$LOG_FILE"
    log_n "${BOLD}Password${RESET}: "
    read -rs PASSWORD
    echo ""
    echo "(password hidden)" >> "$LOG_FILE"
    ;;
esac

# Defaults — no prompts needed for diagnostic purposes
MODE="edit"
APP_ID=""
PAGE_ID=""
BRANCH_NAME=""

log ""
AUTH_LABEL="password"
[ "$AUTH_METHOD" = "2" ] && AUTH_LABEL="browser (SSO)"
[ "$AUTH_METHOD" = "3" ] && AUTH_LABEL="cookie paste"
log "  Base URL:    ${CYAN}${BASE_URL}${RESET}"
log "  Auth:        ${CYAN}${AUTH_LABEL}${RESET}"
[ -n "$EMAIL" ] && log "  Email:       ${CYAN}${EMAIL}${RESET}"

# Extract hostname, scheme, and port for diagnostics
PARSED_HOST=$(echo "$BASE_URL" | sed -E 's|^https?://||;s|:[0-9]+.*||;s|/.*||')
PARSED_SCHEME=$(echo "$BASE_URL" | grep -oE '^https?' || echo "http")
PARSED_PORT=$(echo "$BASE_URL" | sed -E 's|^https?://[^:/]*||;s|/.*||' | tr -d ':' || true)

###############################################################################
# Helper: Write a SESSION cookie into curl's cookie jar
###############################################################################

write_session_cookie() {
  local session_val="$1"
  local domain="$PARSED_HOST"
  # Prefix with dot for tail-matching (standard cookie behavior)
  [[ "$domain" != .* ]] && domain=".${domain}"
  local secure="FALSE"
  [ "$PARSED_SCHEME" = "https" ] && secure="TRUE"

  cat > "$COOKIE_JAR" <<COOKIEEOF
# Netscape HTTP Cookie File
# Generated by appsmith-api-diag.sh
#HttpOnly_${domain}	TRUE	/	${secure}	0	SESSION	${session_val}
COOKIEEOF
  log "  SESSION cookie written to cookie jar"
}

###############################################################################
# Helper: Try to extract SESSION cookie from browser cookie stores
# Sets BROWSER_COOKIE_RESULT (global) instead of using stdout,
# so that log() calls don't pollute the return value.
###############################################################################

BROWSER_COOKIE_RESULT=""

try_extract_browser_cookie() {
  BROWSER_COOKIE_RESULT=""
  local target_host="$PARSED_HOST"
  local found_cookie=""

  # ── Try Firefox ────────────────────────────────────────────────────────
  if has_cmd sqlite3; then
    local ff_profiles
    ff_profiles=$(find "$HOME/Library/Application Support/Firefox/Profiles" \
      -maxdepth 1 -name "*.default*" -type d 2>/dev/null || true)

    if [ -n "$ff_profiles" ]; then
      log "  Checking Firefox cookie stores..."
      while IFS= read -r profile_dir; do
        local cookie_db="${profile_dir}/cookies.sqlite"
        if [ -f "$cookie_db" ]; then
          # Firefox may lock the DB — copy it first
          local tmp_db
          tmp_db=$(mktemp)
          cp "$cookie_db" "$tmp_db" 2>/dev/null || continue

          found_cookie=$(sqlite3 "$tmp_db" \
            "SELECT value FROM moz_cookies
             WHERE name='SESSION'
               AND (host='${target_host}' OR host='.${target_host}')
             ORDER BY lastAccessed DESC LIMIT 1;" 2>/dev/null || true)
          rm -f "$tmp_db"

          if [ -n "$found_cookie" ]; then
            log "  ${GREEN}Found SESSION cookie in Firefox${RESET} (profile: $(basename "$profile_dir"))"
            BROWSER_COOKIE_RESULT="$found_cookie"
            return 0
          fi
        fi
      done <<< "$ff_profiles"
      log "  ${YELLOW}No SESSION cookie found in Firefox for ${target_host}${RESET}"
    fi
  fi

  # ── Try Chrome (unencrypted value field — works on older versions) ─────
  if has_cmd sqlite3; then
    local chrome_db="$HOME/Library/Application Support/Google/Chrome/Default/Cookies"
    if [ -f "$chrome_db" ]; then
      log "  Checking Chrome cookie store..."
      local tmp_db
      tmp_db=$(mktemp)
      cp "$chrome_db" "$tmp_db" 2>/dev/null || true

      # Chrome encrypts cookies on macOS, but we try the value column anyway
      # (it may contain the unencrypted value on some versions)
      found_cookie=$(sqlite3 "$tmp_db" \
        "SELECT value FROM cookies
         WHERE name='SESSION'
           AND (host_key='${target_host}' OR host_key='.${target_host}')
         ORDER BY last_access_utc DESC LIMIT 1;" 2>/dev/null || true)
      rm -f "$tmp_db"

      if [ -n "$found_cookie" ]; then
        log "  ${GREEN}Found SESSION cookie in Chrome${RESET}"
        BROWSER_COOKIE_RESULT="$found_cookie"
        return 0
      else
        log "  ${YELLOW}Chrome cookies are encrypted — cannot extract automatically${RESET}"
      fi
    fi
  fi

  return 1
}

###############################################################################
# Helper: Validate SESSION cookie by checking /api/v1/users/me
# Returns 0 if the session belongs to an authenticated (non-anonymous) user.
###############################################################################

validate_session() {
  log "  Validating session..."
  local v_code
  v_code=$(curl -sS -o "$RESP_BODY" -w "%{http_code}" \
    -b "$COOKIE_JAR" \
    -H "X-Requested-By: Appsmith" \
    --max-time 15 \
    "${BASE_URL}/api/v1/users/me" 2>>"$LOG_FILE") || true

  local v_email=""
  if [ "$v_code" = "200" ] && [ -s "$RESP_BODY" ]; then
    v_email=$(json_field "$(<"$RESP_BODY")" '.data.email')
  fi

  if [ "$v_code" = "200" ] && [ -n "$v_email" ] && [ "$v_email" != "null" ] && [ "$v_email" != "anonymousUser" ]; then
    pass "Session validated — logged in as ${CYAN}${v_email}${RESET}"
    return 0
  else
    fail "Session not authenticated (HTTP ${v_code}, user: ${v_email:-none})"
    return 1
  fi
}

###############################################################################
# 3. Authentication
###############################################################################

section "Authentication"

AUTH_OK=false

case "$AUTH_METHOD" in
  # ── Method 1: Password login ───────────────────────────────────────────
  1)
    log "  Fetching XSRF token..."
    CSRF_HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" \
      -c "$COOKIE_JAR" \
      --max-time 15 \
      "${BASE_URL}/" 2>>"$LOG_FILE") || true

    if [ "$CSRF_HTTP_CODE" = "000" ]; then
      fail "Could not connect to ${BASE_URL}/ (curl error — server may be down)"
    else
      log "  GET / returned HTTP ${CSRF_HTTP_CODE}"

      log "  Logging in as ${EMAIL}..."
      LOGIN_HTTP_CODE=$(curl -sS \
        -o "$RESP_BODY" \
        -D "$RESP_HEADERS" \
        -w "%{http_code}" \
        -b "$COOKIE_JAR" \
        -c "$COOKIE_JAR" \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -H "X-Requested-By: Appsmith" \
        -d "username=${EMAIL}&password=${PASSWORD}" \
        -L \
        --max-time 30 \
        "${BASE_URL}/api/v1/login" 2>>"$LOG_FILE") || true

      log "  Login response: HTTP ${LOGIN_HTTP_CODE}"

      if grep -q "SESSION" "$COOKIE_JAR" 2>/dev/null; then
        pass "SESSION cookie obtained"
        AUTH_OK=true
      else
        fail "SESSION cookie not found after login"
        log "  ${YELLOW}Response headers:${RESET}"
        head -20 "$RESP_HEADERS" 2>/dev/null | while IFS= read -r line; do log "    $line"; done
        log "  ${YELLOW}Response body (first 500 chars):${RESET}"
        head -c 500 "$RESP_BODY" 2>/dev/null | while IFS= read -r line; do log "    $line"; done
      fi
    fi
    ;;

  # ── Method 2: Browser login (SSO/OAuth) ────────────────────────────────
  2)
    log "  Opening Appsmith in your default browser..."
    log "  ${BOLD}Please complete the login in your browser, then come back here.${RESET}"
    log ""

    # Open browser (macOS: open, Linux: xdg-open)
    if has_cmd open; then
      open "${BASE_URL}" 2>/dev/null
    elif has_cmd xdg-open; then
      xdg-open "${BASE_URL}" 2>/dev/null
    else
      log "  ${YELLOW}Could not auto-open browser. Please open manually:${RESET}"
      log "  ${CYAN}${BASE_URL}${RESET}"
    fi

    log_n "  ${BOLD}Press Enter after you have logged in...${RESET}"
    read -r
    echo "(user confirmed browser login)" >> "$LOG_FILE"

    # Try to auto-extract cookie from browser stores
    log "  Attempting to extract SESSION cookie from browser..."
    try_extract_browser_cookie || true
    EXTRACTED_COOKIE="$BROWSER_COOKIE_RESULT"

    if [ -n "$EXTRACTED_COOKIE" ]; then
      write_session_cookie "$EXTRACTED_COOKIE"
      if validate_session; then
        AUTH_OK=true
      else
        log "  ${YELLOW}The cookie may be expired or from a different session.${RESET}"
      fi
    else
      log ""
      log "  ${YELLOW}Could not auto-extract cookie from browser stores.${RESET}"
      log "  ${YELLOW}Falling back to manual paste...${RESET}"
      log ""
      log "  ${YELLOW}To get your SESSION cookie:${RESET}"
      log "    1. In the browser where you just logged in, open Developer Tools (F12)"
      log "    2. Go to Application → Cookies → ${BASE_URL}"
      log "    3. Right-click the ${BOLD}SESSION${RESET} cookie → Edit Value → copy the value"
      log ""
      log_n "  ${BOLD}SESSION cookie value${RESET}: "
      read -r SESSION_COOKIE
      echo "(session cookie provided via fallback: ${SESSION_COOKIE:+yes})" >> "$LOG_FILE"

      if [ -n "$SESSION_COOKIE" ]; then
        write_session_cookie "$SESSION_COOKIE"
        if validate_session; then
          AUTH_OK=true
        fi
      else
        fail "No SESSION cookie provided"
      fi
    fi
    ;;

  # ── Method 3: Paste SESSION cookie directly ────────────────────────────
  3)
    if [ -n "$SESSION_COOKIE" ]; then
      write_session_cookie "$SESSION_COOKIE"
      if validate_session; then
        AUTH_OK=true
      fi
    else
      fail "No SESSION cookie provided"
    fi
    ;;
esac

###############################################################################
# 4. Consolidated API Call
###############################################################################

section "Consolidated API Call"

if [ "$AUTH_OK" = "false" ]; then
  fail "Skipping API call — authentication failed"
  API_OK=false
else
  # Build query string
  QS=""
  [ -n "$APP_ID" ]      && QS="${QS}&applicationId=${APP_ID}"
  [ -n "$PAGE_ID" ]     && QS="${QS}&defaultPageId=${PAGE_ID}"
  [ -n "$BRANCH_NAME" ] && QS="${QS}&branchName=${BRANCH_NAME}"
  # Strip leading &
  QS="${QS#&}"
  [ -n "$QS" ] && QS="?${QS}"

  API_URL="${BASE_URL}/api/v1/consolidated-api/${MODE}${QS}"
  log "  URL: ${CYAN}${API_URL}${RESET}"

  CURL_FORMAT='dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total} size:%{size_download} speed:%{speed_download} http:%{http_code}'

  CURL_STATS=$(curl -sS \
    -o "$RESP_BODY" \
    -D "$RESP_HEADERS" \
    -w "$CURL_FORMAT" \
    -b "$COOKIE_JAR" \
    -H "X-Requested-By: Appsmith" \
    --max-time 60 \
    "$API_URL" 2>>"$LOG_FILE") || true

  # Parse timing stats
  API_HTTP_CODE=$(echo "$CURL_STATS" | grep -oE 'http:[0-9]+' | cut -d: -f2 || echo "000")
  if [ -z "$API_HTTP_CODE" ]; then
    API_HTTP_CODE=$(head -1 "$RESP_HEADERS" 2>/dev/null | grep -oE '[0-9]{3}' | head -1 || echo "000")
  fi

  # Display timing breakdown with plain-language explanations
  log ""
  log "  ${BOLD}Timing Breakdown:${RESET}"
  log "  ${YELLOW}(Each step shows how long your request spent in that phase)${RESET}"
  log ""
  for metric in dns connect tls ttfb total; do
    val=$(echo "$CURL_STATS" | grep -oE "${metric}:[0-9.]+" | cut -d: -f2 || echo "?")
    label=$(echo "$metric" | tr '[:lower:]' '[:upper:]')
    # Plain-language explanation for each timing metric
    case "$metric" in
      dns)     hint="Looking up the server's IP address" ;;
      connect) hint="Opening a network connection to the server" ;;
      tls)     hint="Setting up the encrypted (HTTPS) connection" ;;
      ttfb)    hint="Waiting for the server to start sending data (Time To First Byte)" ;;
      total)   hint="Total time from start to finish" ;;
    esac
    log "    ${label}: ${CYAN}${val}s${RESET}  — ${hint}"
  done
  dl_size=$(echo "$CURL_STATS" | grep -oE 'size:[0-9.]+' | cut -d: -f2 || echo "?")
  dl_speed=$(echo "$CURL_STATS" | grep -oE 'speed:[0-9.]+' | cut -d: -f2 || echo "?")
  log "    Size:  ${CYAN}${dl_size} bytes${RESET}"
  log "    Speed: ${CYAN}${dl_speed} bytes/s${RESET}"
  echo "  Curl stats: $CURL_STATS" >> "$LOG_FILE"

  # Auto-interpret timing results
  log ""
  t_dns=$(echo "$CURL_STATS" | grep -oE 'dns:[0-9.]+' | cut -d: -f2 || echo "0")
  t_ttfb=$(echo "$CURL_STATS" | grep -oE 'ttfb:[0-9.]+' | cut -d: -f2 || echo "0")
  t_total=$(echo "$CURL_STATS" | grep -oE 'total:[0-9.]+' | cut -d: -f2 || echo "0")

  if has_cmd awk; then
    if [ "$(echo "$t_dns" | awk '{print ($1 > 0.5) ? "slow" : "ok"}')" = "slow" ]; then
      warn "DNS lookup is slow (${t_dns}s). This could mean DNS servers are far away or overloaded."
      log "    ${YELLOW}→ Try using a faster DNS server (e.g. 8.8.8.8 or 1.1.1.1)${RESET}"
    fi
    if [ "$(echo "$t_ttfb" | awk '{print ($1 > 5.0) ? "slow" : "ok"}')" = "slow" ]; then
      warn "Server response is slow (TTFB: ${t_ttfb}s). The server is taking a long time to process the request."
      log "    ${YELLOW}→ This usually means the server or database is under heavy load${RESET}"
    elif [ "$(echo "$t_ttfb" | awk '{print ($1 > 2.0) ? "moderate" : "ok"}')" = "moderate" ]; then
      log "  ${YELLOW}ℹ${RESET} Server response time (${t_ttfb}s) is moderate — may be normal for large apps"
    fi
    if [ "$(echo "$t_total" | awk '{print ($1 > 10.0) ? "slow" : "ok"}')" = "slow" ]; then
      warn "Overall request took ${t_total}s — this is slower than expected"
    fi
    # Check download speed
    if [ -n "$dl_speed" ] && [ "$dl_speed" != "?" ]; then
      if [ "$(echo "$dl_speed" | awk '{print ($1 < 100000) ? "slow" : "ok"}')" = "slow" ]; then
        warn "Download speed is low ($(echo "$dl_speed" | awk '{printf "%.0f KB/s", $1/1024}')). Network bandwidth may be limited."
      fi
    fi
  fi

  log ""
  log "  HTTP Status: ${BOLD}${API_HTTP_CODE}${RESET}"

  if [ "$API_HTTP_CODE" = "200" ]; then
    API_OK=true
    pass "Consolidated API returned 200 OK"
  else
    API_OK=false
    fail "Consolidated API returned HTTP ${API_HTTP_CODE}"
  fi

  # ── CDN / Cache / Compression Analysis ──────────────────────────────────
  if [ -f "$RESP_HEADERS" ] && [ -s "$RESP_HEADERS" ]; then
    log ""
    log "  ${BOLD}Response Analysis:${RESET}"

    # Check CDN cache status (CloudFront, Cloudflare, generic)
    XCACHE=$(grep -i '^x-cache:' "$RESP_HEADERS" | head -1 | sed 's/^[^:]*: *//' | tr -d '\r' || true)
    CF_CACHE=$(grep -i '^cf-cache-status:' "$RESP_HEADERS" | head -1 | sed 's/^[^:]*: *//' | tr -d '\r' || true)
    CACHE_CTRL=$(grep -i '^cache-control:' "$RESP_HEADERS" | head -1 | sed 's/^[^:]*: *//' | tr -d '\r' || true)
    CONTENT_ENC=$(grep -i '^content-encoding:' "$RESP_HEADERS" | head -1 | sed 's/^[^:]*: *//' | tr -d '\r' || true)
    SERVER_HDR=$(grep -i '^server:' "$RESP_HEADERS" | head -1 | sed 's/^[^:]*: *//' | tr -d '\r' || true)
    VIA_HDR=$(grep -i '^via:' "$RESP_HEADERS" | head -1 | sed 's/^[^:]*: *//' | tr -d '\r' || true)

    if [ -n "$XCACHE" ]; then
      log "    CDN Cache (X-Cache): ${CYAN}${XCACHE}${RESET}"
      case "$XCACHE" in
        *Hit*|*HIT*)
          log "      ${GREEN}→ Response was served from CDN cache (fast!)${RESET}" ;;
        *Miss*|*MISS*)
          log "      ${YELLOW}→ CDN cache miss — request went to the origin server${RESET}" ;;
        *Error*|*ERROR*)
          log "      ${RED}→ CDN encountered an error${RESET}" ;;
      esac
    fi

    if [ -n "$CF_CACHE" ]; then
      log "    Cloudflare Cache: ${CYAN}${CF_CACHE}${RESET}"
    fi

    if [ -n "$CONTENT_ENC" ]; then
      log "    Compression: ${GREEN}${CONTENT_ENC}${RESET} (response is compressed — good!)"
    else
      warn "No response compression detected. Enabling gzip/brotli could reduce response size significantly."
      log "      ${YELLOW}→ Check Appsmith's reverse proxy (nginx/Caddy) has gzip enabled${RESET}"
    fi

    [ -n "$CACHE_CTRL" ] && log "    Cache-Control: ${CYAN}${CACHE_CTRL}${RESET}"
    [ -n "$SERVER_HDR" ] && log "    Server: ${CYAN}${SERVER_HDR}${RESET}"
    [ -n "$VIA_HDR" ]    && log "    Via: ${CYAN}${VIA_HDR}${RESET} (indicates a proxy/CDN in the path)"

    # Response size analysis
    if [ -n "$dl_size" ] && [ "$dl_size" != "?" ] && has_cmd awk; then
      dl_kb=$(echo "$dl_size" | awk '{printf "%.1f", $1/1024}')
      dl_mb=$(echo "$dl_size" | awk '{printf "%.2f", $1/1048576}')
      log "    Response size: ${CYAN}${dl_kb} KB${RESET} (${dl_mb} MB)"
      if [ "$(echo "$dl_size" | awk '{print ($1 > 5242880) ? "large" : "ok"}')" = "large" ]; then
        warn "Response is over 5 MB — this is unusually large for the consolidated API"
        log "      ${YELLOW}→ Large responses may indicate many widgets, actions, or datasources${RESET}"
        log "      ${YELLOW}→ Consider splitting the application into smaller pages${RESET}"
      elif [ "$(echo "$dl_size" | awk '{print ($1 > 1048576) ? "big" : "ok"}')" = "big" ]; then
        log "      ${YELLOW}ℹ Response is over 1 MB — consider if the app can be optimized${RESET}"
      fi
    fi
  fi
fi

###############################################################################
# 4b. Call /info endpoint
###############################################################################

section "Server Info (/info)"

INFO_BODY=$(mktemp)
INFO_HTTP_CODE=$(curl -sS \
  -o "$INFO_BODY" \
  -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  --max-time 15 \
  "${BASE_URL}/info" 2>>"$LOG_FILE") || true

if [ "$INFO_HTTP_CODE" = "200" ] && [ -s "$INFO_BODY" ]; then
  pass "/info returned 200"
  INFO_JSON=$(<"$INFO_BODY")

  # Display on screen only (log() would double-write to log file)
  if has_cmd jq; then
    echo "$INFO_JSON" | jq '.' 2>/dev/null | head -30 | while IFS= read -r line; do
      echo -e "  $line"
    done
  else
    head -c 2000 "$INFO_BODY" | while IFS= read -r line; do echo -e "  $line"; done
  fi

  # Store full /info response in log file (single copy)
  {
    echo "--- /info response ---"
    if has_cmd jq; then
      echo "$INFO_JSON" | jq '.' 2>/dev/null || echo "$INFO_JSON"
    else
      echo "$INFO_JSON"
    fi
    echo "--- end /info response ---"
  } >> "$LOG_FILE"
else
  warn "/info returned HTTP ${INFO_HTTP_CODE}"
  if [ -s "$INFO_BODY" ]; then
    head -c 500 "$INFO_BODY" | while IFS= read -r line; do log "    $line"; done
  fi
fi
rm -f "$INFO_BODY"

###############################################################################
# 5. Response Handling
###############################################################################

RESP_JSON=""
if [ -f "$RESP_BODY" ] && [ -s "$RESP_BODY" ]; then
  RESP_JSON=$(<"$RESP_BODY")
fi

# Store full consolidated API response in log file
if [ -n "$RESP_JSON" ]; then
  {
    echo ""
    echo "--- consolidated API response ---"
    if has_cmd jq; then
      echo "$RESP_JSON" | jq '.' 2>/dev/null || echo "$RESP_JSON"
    else
      echo "$RESP_JSON"
    fi
    echo "--- end consolidated API response ---"
  } >> "$LOG_FILE"
fi

if [ "$API_OK" = "true" ]; then
  # ── Path A: SUCCESS ──────────────────────────────────────────────────────
  section "Parsed Response"

  # User profile
  USER_NAME=$(json_field "$RESP_JSON" '.data.userProfile.data.name')
  USER_EMAIL=$(json_field "$RESP_JSON" '.data.userProfile.data.email')
  log "  User:    ${CYAN}${USER_NAME}${RESET} (${USER_EMAIL})"

  # Pages
  PAGES_COUNT=$(json_length "$RESP_JSON" '.data.pages.data.pages')
  log "  Pages:   ${CYAN}${PAGES_COUNT}${RESET}"
  if has_cmd jq && [ "$PAGES_COUNT" != "0" ]; then
    echo "$RESP_JSON" | jq -r '.data.pages.data.pages[]?.name // empty' 2>/dev/null | while IFS= read -r pname; do
      log "           - ${pname}"
    done
  fi

  # Actions
  PUB_ACTIONS=$(json_length "$RESP_JSON" '.data.publishedActions.data')
  UNPUB_ACTIONS=$(json_length "$RESP_JSON" '.data.unpublishedActions.data')
  log "  Actions: ${CYAN}${PUB_ACTIONS}${RESET} published / ${CYAN}${UNPUB_ACTIONS}${RESET} unpublished"

  # Theme
  THEME_NAME=$(json_field "$RESP_JSON" '.data.currentTheme.data.name')
  log "  Theme:   ${CYAN}${THEME_NAME}${RESET}"

  # Plugins (edit mode)
  if [ "$MODE" = "edit" ]; then
    PLUGINS_COUNT=$(json_length "$RESP_JSON" '.data.plugins.data')
    log "  Plugins: ${CYAN}${PLUGINS_COUNT}${RESET}"
    if has_cmd jq && [ "$PLUGINS_COUNT" != "0" ]; then
      echo "$RESP_JSON" | jq -r '.data.plugins.data[]?.name // empty' 2>/dev/null | head -10 | while IFS= read -r pname; do
        log "           - ${pname}"
      done
      if [ "$PLUGINS_COUNT" -gt 10 ] 2>/dev/null; then
        log "           ... and $((PLUGINS_COUNT - 10)) more"
      fi
    fi

    # Datasources
    DS_COUNT=$(json_length "$RESP_JSON" '.data.datasources.data')
    log "  Datasources: ${CYAN}${DS_COUNT}${RESET}"
    if has_cmd jq && [ "$DS_COUNT" != "0" ]; then
      echo "$RESP_JSON" | jq -r '.data.datasources.data[]?.name // empty' 2>/dev/null | while IFS= read -r dsname; do
        log "           - ${dsname}"
      done
    fi
  fi

  # Feature flags
  if has_cmd jq; then
    FF_COUNT=$(echo "$RESP_JSON" | jq '.data.featureFlags.data // {} | keys | length' 2>/dev/null || echo 0)
    log "  Feature flags: ${CYAN}${FF_COUNT}${RESET}"
    if [ "$FF_COUNT" != "0" ] && [ "$FF_COUNT" -le 20 ] 2>/dev/null; then
      echo "$RESP_JSON" | jq -r '.data.featureFlags.data // {} | to_entries[] | "           - \(.key): \(.value)"' 2>/dev/null | while IFS= read -r line; do
        log "$line"
      done
    fi
  fi

  # Custom JS libraries
  JSLIB_COUNT=$(json_length "$RESP_JSON" '.data.customJSLibraries.data')
  log "  Custom JS libs: ${CYAN}${JSLIB_COUNT}${RESET}"

  # Per-section error check
  section "Section Health"
  if has_cmd jq; then
    SECTION_ERRORS=0
    while IFS= read -r entry; do
      key=$(echo "$entry" | awk '{print $1}')
      status=$(echo "$entry" | awk '{print $2}')
      if [ "$status" = "200" ]; then
        log "  ${GREEN}✓${RESET} ${key}: ${status}"
      elif [ "$status" = "unknown" ]; then
        log "  ${YELLOW}?${RESET} ${key}: no status"
      else
        log "  ${RED}✗${RESET} ${key}: ${status}"
        SECTION_ERRORS=$((SECTION_ERRORS + 1))
      fi
    done < <(echo "$RESP_JSON" | jq -r '.data // {} | to_entries[] | "\(.key) \(.value.responseMeta.status // "unknown")"' 2>/dev/null)
    FAIL_COUNT=$((FAIL_COUNT + SECTION_ERRORS))
  else
    warn "jq not available — skipping per-section health check"
  fi

  # Prompt for diagnostics
  log ""
  log_n "${BOLD}API call succeeded. Run network diagnostics? (y/n)${RESET} [n]: "
  read -r RUN_DIAG
  echo "$RUN_DIAG" >> "$LOG_FILE"
  RUN_DIAG="${RUN_DIAG:-n}"

  if [[ "$RUN_DIAG" =~ ^[Yy] ]]; then
    RUN_DIAGNOSTICS=true
  else
    RUN_DIAGNOSTICS=false
  fi

else
  # ── Path B: FAILURE ────────────────────────────────────────────────────
  if [ -n "$RESP_JSON" ]; then
    section "Error Response"
    log "  ${YELLOW}First 2000 chars of response body:${RESET}"
    echo "$RESP_JSON" | head -c 2000 | while IFS= read -r line; do log "    $line"; done
  fi

  if [ -f "$RESP_HEADERS" ] && [ -s "$RESP_HEADERS" ]; then
    log ""
    log "  ${YELLOW}Response headers:${RESET}"
    while IFS= read -r line; do log "    $line"; done < "$RESP_HEADERS"
  fi

  # Full response body to log only
  if [ -n "$RESP_JSON" ]; then
    echo "--- Full response body ---" >> "$LOG_FILE"
    echo "$RESP_JSON" >> "$LOG_FILE"
    echo "--- End response body ---" >> "$LOG_FILE"
  fi

  log ""
  log "  ${YELLOW}Auto-running diagnostics due to failure...${RESET}"
  RUN_DIAGNOSTICS=true
fi

###############################################################################
# 6. Diagnostics Suite
###############################################################################

if [ "${RUN_DIAGNOSTICS:-false}" = "true" ]; then
  section "Network Diagnostics"
  log "  These tests check the network path between this computer and your"
  log "  Appsmith server. Problems here can cause slow loading or timeouts."

  # ── DNS Lookup ───────────────────────────────────────────────────────────
  log ""
  log "  ${BOLD}[DNS Lookup]${RESET} ${PARSED_HOST}"
  log "  ${YELLOW}(Translates the server name to an IP address)${RESET}"
  if has_cmd dig; then
    dig_out=$(dig +short "$PARSED_HOST" A 2>&1) || true
    if [ -n "$dig_out" ]; then
      pass "DNS A records:"
      echo "$dig_out" | while IFS= read -r line; do log "    $line"; done
    else
      warn "No A records found for ${PARSED_HOST}"
    fi
    dig_aaaa=$(dig +short "$PARSED_HOST" AAAA 2>&1) || true
    if [ -n "$dig_aaaa" ]; then
      log "  AAAA records:"
      echo "$dig_aaaa" | while IFS= read -r line; do log "    $line"; done
    fi
  elif has_cmd nslookup; then
    ns_out=$(nslookup "$PARSED_HOST" 2>&1) || true
    log "  nslookup output:"
    echo "$ns_out" | while IFS= read -r line; do log "    $line"; done
  else
    warn "Neither dig nor nslookup available — skipping DNS lookup"
  fi

  # ── Ping ─────────────────────────────────────────────────────────────────
  log ""
  log "  ${BOLD}[Ping]${RESET} ${PARSED_HOST}"
  log "  ${YELLOW}(Tests basic connectivity and measures round-trip time)${RESET}"
  if has_cmd ping; then
    ping_out=$(ping -c 5 -W 5 "$PARSED_HOST" 2>&1) || true
    if echo "$ping_out" | grep -q "packets transmitted"; then
      pkt_line=$(echo "$ping_out" | grep "packets transmitted")
      log "  $pkt_line"
      rtt_line=$(echo "$ping_out" | grep "round-trip\|rtt" || true)
      [ -n "$rtt_line" ] && log "  $rtt_line"
      if echo "$pkt_line" | grep -q "0.0% packet loss\|0% packet loss\| 0 packets lost"; then
        pass "Ping — no packet loss"
      else
        warn "Ping — some packet loss detected"
      fi
    else
      fail "Ping failed: $ping_out"
    fi
  else
    warn "ping not available — skipping"
  fi

  # ── Port Reachability ────────────────────────────────────────────────────
  log ""
  log "  ${BOLD}[Port Reachability]${RESET} ${PARSED_HOST}"
  log "  ${YELLOW}(Checks if specific service ports are open and accepting connections)${RESET}"
  if has_cmd nc; then
    for port in 80 443 8080 3000; do
      if run_with_timeout 3 nc -z "$PARSED_HOST" "$port" 2>/dev/null; then
        pass "Port ${port} — open"
      else
        log "  ${YELLOW}-${RESET} Port ${port} — closed/filtered"
      fi
    done
    # Test user-specified port if not in the default list
    if [ -n "$PARSED_PORT" ] && [[ ! " 80 443 8080 3000 " =~ " ${PARSED_PORT} " ]]; then
      if run_with_timeout 3 nc -z "$PARSED_HOST" "$PARSED_PORT" 2>/dev/null; then
        pass "Port ${PARSED_PORT} (from URL) — open"
      else
        fail "Port ${PARSED_PORT} (from URL) — closed/filtered"
      fi
    fi
  else
    warn "nc (netcat) not available — skipping port checks"
  fi

  # ── SSL Certificate ─────────────────────────────────────────────────────
  if [ "$PARSED_SCHEME" = "https" ]; then
    log ""
    log "  ${BOLD}[SSL Certificate]${RESET} ${PARSED_HOST}"
    if has_cmd openssl; then
      SSL_PORT="${PARSED_PORT:-443}"
      ssl_out=$(echo | openssl s_client -connect "${PARSED_HOST}:${SSL_PORT}" -servername "$PARSED_HOST" 2>/dev/null | openssl x509 -noout -subject -issuer -dates 2>/dev/null) || true
      if [ -n "$ssl_out" ]; then
        pass "SSL certificate info:"
        echo "$ssl_out" | while IFS= read -r line; do log "    $line"; done
      else
        fail "Could not retrieve SSL certificate"
      fi
    else
      warn "openssl not available — skipping SSL check"
    fi
  fi

  # ── Health Check ─────────────────────────────────────────────────────────
  log ""
  log "  ${BOLD}[Health Check]${RESET} /api/v1/health"
  HEALTH_CODE=$(curl -sS -o /dev/null -w "%{http_code}" \
    --max-time 10 \
    "${BASE_URL}/api/v1/health" 2>>"$LOG_FILE") || true
  if [ "$HEALTH_CODE" = "200" ]; then
    pass "Health endpoint returned ${HEALTH_CODE}"
  elif [ "$HEALTH_CODE" = "000" ]; then
    fail "Health endpoint — connection failed"
  else
    warn "Health endpoint returned ${HEALTH_CODE}"
  fi

  # ── Traceroute ───────────────────────────────────────────────────────────
  log ""
  log "  ${BOLD}[Traceroute]${RESET} ${PARSED_HOST} (max 10 hops, 30s timeout)"
  log "  ${YELLOW}(Shows the network path — each 'hop' is a router between you and the server)${RESET}"
  if has_cmd traceroute; then
    log "  (This may take up to 30 seconds...)"
    trace_out=$(run_with_timeout 30 traceroute -m 10 -w 2 "$PARSED_HOST" 2>&1) || true
    if [ -n "$trace_out" ]; then
      echo "$trace_out" | while IFS= read -r line; do log "    $line"; done
    else
      warn "Traceroute timed out or produced no output"
    fi
  else
    warn "traceroute not available — skipping"
  fi

  # ── Curl Verbose Replay ─────────────────────────────────────────────────
  if [ "$AUTH_OK" = "true" ]; then
    log ""
    log "  ${BOLD}[Verbose Replay]${RESET} Re-running consolidated API call with -v"
    VERBOSE_OUT=$(curl -v -sS \
      -o /dev/null \
      -b "$COOKIE_JAR" \
      -H "X-Requested-By: Appsmith" \
      --max-time 60 \
      "$API_URL" 2>&1) || true
    echo "$VERBOSE_OUT" | head -50 | while IFS= read -r line; do log "    $line"; done
    if [ "$(echo "$VERBOSE_OUT" | wc -l)" -gt 50 ]; then
      log "    ... (truncated, full output in log file)"
      echo "$VERBOSE_OUT" >> "$LOG_FILE"
    fi
  fi

  # ── MTU Check ────────────────────────────────────────────────────────────
  log ""
  log "  ${BOLD}[MTU Check]${RESET} ${PARSED_HOST}"
  if has_cmd ping; then
    mtu_out=$(run_with_timeout 15 ping -D -s 1472 -c 3 "$PARSED_HOST" 2>&1) || true
    if echo "$mtu_out" | grep -qi "frag needed\|message too long\|packet needs to be fragmented"; then
      warn "MTU issue detected — packets need fragmentation at 1472 bytes"
    elif echo "$mtu_out" | grep -q "packets transmitted"; then
      pass "No MTU/fragmentation issues at 1472 bytes"
    else
      log "  MTU test output:"
      echo "$mtu_out" | head -5 | while IFS= read -r line; do log "    $line"; done
    fi
  else
    warn "ping not available — skipping MTU check"
  fi

  # ── Connection Reuse Test ────────────────────────────────────────────────
  if [ "$AUTH_OK" = "true" ]; then
    log ""
    log "  ${BOLD}[Connection Reuse Test]${RESET} 3 sequential requests"
    REUSE_URL="${BASE_URL}/api/v1/health"
    for i in 1 2 3; do
      req_time=$(curl -sS -o /dev/null \
        -w "%{time_total}" \
        -b "$COOKIE_JAR" \
        --max-time 15 \
        "$REUSE_URL" 2>/dev/null) || req_time="error"
      log "  Request #${i}: ${CYAN}${req_time}s${RESET}"
    done
    log "  (Request #1 is cold; #2–3 benefit from connection reuse)"
  fi
fi

###############################################################################
# 6b. MongoDB Diagnostics
###############################################################################

# MongoDB diagnostics run whenever diagnostics are triggered, or when
# the consolidated API showed section-level errors suggesting DB issues.
MONGO_DIAG_NEEDED="${RUN_DIAGNOSTICS:-false}"

# Also trigger if any consolidated API sections returned 500/408
if [ "${API_OK:-false}" = "true" ] && has_cmd jq && [ -n "$RESP_JSON" ]; then
  SECTION_500S=$(echo "$RESP_JSON" | jq '[.data // {} | to_entries[] | select(.value.responseMeta.status == 500 or .value.responseMeta.status == 408)] | length' 2>/dev/null || echo 0)
  if [ "$SECTION_500S" -gt 0 ]; then
    MONGO_DIAG_NEEDED=true
    log ""
    log "  ${YELLOW}Detected ${SECTION_500S} section(s) with 500/408 errors — running MongoDB diagnostics${RESET}"
  fi
fi

if [ "$MONGO_DIAG_NEEDED" = "true" ]; then
  section "MongoDB Diagnostics"
  log "  Appsmith's /api/v1/health checks MongoDB with a 1-second timeout."
  log "  These tests probe that endpoint repeatedly to detect intermittent DB issues."

  # ── Rapid Health Check Burst ─────────────────────────────────────────────
  log ""
  log "  ${BOLD}[Health Check Burst]${RESET} 10 rapid sequential requests to /api/v1/health"
  HEALTH_TMP=$(mktemp)
  MONGO_FAILS=0
  MONGO_TIMEOUTS=0
  MONGO_TIMES=""
  for i in $(seq 1 10); do
    h_body=$(mktemp)
    h_result=$(curl -sS \
      -o "$h_body" \
      -w "%{http_code} %{time_total}" \
      --max-time 10 \
      "${BASE_URL}/api/v1/health" 2>/dev/null) || h_result="000 0"
    h_code=$(echo "$h_result" | awk '{print $1}')
    h_time=$(echo "$h_result" | awk '{print $2}')
    h_resp=$(<"$h_body")
    rm -f "$h_body"

    # Check for MongoDB-specific timeout
    MONGO_HINT=""
    if [ "$h_code" = "408" ]; then
      MONGO_TIMEOUTS=$((MONGO_TIMEOUTS + 1))
      MONGO_HINT=" ${RED}← MongoDB timeout${RESET}"
    elif echo "$h_resp" | grep -qi "mongo\|database\|connection.*timed"; then
      MONGO_HINT=" ${YELLOW}← MongoDB issue in response${RESET}"
    fi

    if [ "$h_code" = "200" ]; then
      log "  #${i}: HTTP ${GREEN}${h_code}${RESET}  ${CYAN}${h_time}s${RESET}${MONGO_HINT}"
    else
      log "  #${i}: HTTP ${RED}${h_code}${RESET}  ${CYAN}${h_time}s${RESET}${MONGO_HINT}"
      MONGO_FAILS=$((MONGO_FAILS + 1))
    fi

    MONGO_TIMES="${MONGO_TIMES} ${h_time}"
    echo "$i $h_code $h_time" >> "$HEALTH_TMP"
  done

  # ── Analyze Burst Results ──────────────────────────────────────────────
  log ""
  if [ "$MONGO_FAILS" -eq 0 ]; then
    pass "All 10 health checks passed (MongoDB + Redis healthy)"
  else
    fail "${MONGO_FAILS}/10 health checks failed (${MONGO_TIMEOUTS} MongoDB timeouts)"
  fi

  # Calculate timing stats (min, max, avg, jitter)
  if has_cmd awk; then
    TIMING_STATS=$(echo "$MONGO_TIMES" | tr ' ' '\n' | grep -v '^$' | awk '
      BEGIN { min=999; max=0; sum=0; n=0 }
      {
        val = $1 + 0
        if (val < min) min = val
        if (val > max) max = val
        sum += val
        n++
      }
      END {
        if (n > 0) {
          avg = sum / n
          printf "min:%.3f max:%.3f avg:%.3f jitter:%.3f\n", min, max, avg, max - min
        }
      }
    ')
    t_min=$(echo "$TIMING_STATS" | grep -oE 'min:[0-9.]+' | cut -d: -f2)
    t_max=$(echo "$TIMING_STATS" | grep -oE 'max:[0-9.]+' | cut -d: -f2)
    t_avg=$(echo "$TIMING_STATS" | grep -oE 'avg:[0-9.]+' | cut -d: -f2)
    t_jitter=$(echo "$TIMING_STATS" | grep -oE 'jitter:[0-9.]+' | cut -d: -f2)
    log "  Response times: min=${CYAN}${t_min}s${RESET}  max=${CYAN}${t_max}s${RESET}  avg=${CYAN}${t_avg}s${RESET}  jitter=${CYAN}${t_jitter}s${RESET}"

    # Flag high jitter (>500ms spread suggests connection pool or DB instability)
    if has_cmd awk && [ -n "$t_jitter" ]; then
      HIGH_JITTER=$(echo "$t_jitter" | awk '{print ($1 > 0.5) ? "yes" : "no"}')
      if [ "$HIGH_JITTER" = "yes" ]; then
        warn "High response time jitter (${t_jitter}s) — may indicate MongoDB connection pool issues or DB instability"
      fi
    fi

    # Flag if max > 1s (near MongoDB's health check timeout threshold)
    if has_cmd awk && [ -n "$t_max" ]; then
      NEAR_TIMEOUT=$(echo "$t_max" | awk '{print ($1 > 1.0) ? "yes" : "no"}')
      if [ "$NEAR_TIMEOUT" = "yes" ]; then
        warn "Slowest health check (${t_max}s) exceeds MongoDB's 1-second timeout threshold"
      fi
    fi
  fi
  rm -f "$HEALTH_TMP"

  # ── Consolidated API Section Analysis (MongoDB-bound) ──────────────────
  if [ -n "$RESP_JSON" ] && has_cmd jq; then
    log ""
    log "  ${BOLD}[Consolidated API Section Analysis]${RESET}"
    log "  Sections that hit MongoDB: pages, actions, themes, datasources, plugins"
    log ""

    # Check each MongoDB-dependent section
    MONGO_SECTIONS="pages publishedActions unpublishedActions publishedActionCollections unpublishedActionCollections currentTheme themes datasources plugins customJSLibraries pagesWithMigratedDsl pageWithMigratedDsl"
    MONGO_SECTION_ERRORS=0
    for sec in $MONGO_SECTIONS; do
      sec_status=$(echo "$RESP_JSON" | jq -r ".data.${sec}.responseMeta.status // \"absent\"" 2>/dev/null)
      if [ "$sec_status" = "absent" ] || [ "$sec_status" = "null" ]; then
        continue
      elif [ "$sec_status" = "200" ]; then
        log "  ${GREEN}✓${RESET} ${sec}: ${sec_status}"
      else
        sec_error=$(echo "$RESP_JSON" | jq -r ".data.${sec}.responseMeta.error.message // \"unknown error\"" 2>/dev/null)
        log "  ${RED}✗${RESET} ${sec}: ${sec_status} — ${sec_error}"
        MONGO_SECTION_ERRORS=$((MONGO_SECTION_ERRORS + 1))
      fi
    done

    if [ "$MONGO_SECTION_ERRORS" -gt 0 ]; then
      fail "${MONGO_SECTION_ERRORS} MongoDB-dependent section(s) returned errors"
    else
      pass "All present MongoDB-dependent sections returned 200"
    fi
  fi

  # ── Sustained Load Test ────────────────────────────────────────────────
  # 3 full health checks spaced 2 seconds apart to detect issues that only
  # appear under sustained (not burst) access patterns.
  log ""
  log "  ${BOLD}[Sustained Health Check]${RESET} 3 requests with 2-second gaps"
  SUSTAINED_FAILS=0
  for i in 1 2 3; do
    s_result=$(curl -sS \
      -o /dev/null \
      -w "%{http_code} %{time_total}" \
      --max-time 10 \
      "${BASE_URL}/api/v1/health" 2>/dev/null) || s_result="000 0"
    s_code=$(echo "$s_result" | awk '{print $1}')
    s_time=$(echo "$s_result" | awk '{print $2}')
    if [ "$s_code" = "200" ]; then
      log "  #${i}: HTTP ${GREEN}${s_code}${RESET}  ${CYAN}${s_time}s${RESET}"
    else
      log "  #${i}: HTTP ${RED}${s_code}${RESET}  ${CYAN}${s_time}s${RESET}"
      SUSTAINED_FAILS=$((SUSTAINED_FAILS + 1))
    fi
    [ "$i" -lt 3 ] && sleep 2
  done
  if [ "$SUSTAINED_FAILS" -gt 0 ]; then
    fail "Sustained health check: ${SUSTAINED_FAILS}/3 failed — MongoDB may be degraded"
  else
    pass "Sustained health check: all 3 passed"
  fi

  # ── Direct MongoDB Connectivity (optional) ─────────────────────────────
  log ""
  log "  ${BOLD}[Direct MongoDB Check]${RESET}"
  log_n "  MongoDB URI (optional, e.g. mongodb://host:27017/appsmith): "
  read -r MONGO_URI
  # Never log credentials
  echo "(mongo URI provided: ${MONGO_URI:+yes}${MONGO_URI:+, redacted}${MONGO_URI:-no})" >> "$LOG_FILE"

  if [ -n "$MONGO_URI" ]; then
    # Parse host:port from URI — handle user:password@ credentials
    # Strip scheme, strip credentials (everything before last @), strip path/query
    MONGO_HOSTPORT=$(echo "$MONGO_URI" | sed -E 's|^mongodb(\+srv)?://||;s|.*@||;s|/.*||;s|\?.*||')
    # First host (for multi-host URIs, take first before comma)
    MONGO_HOSTPORT=$(echo "$MONGO_HOSTPORT" | sed 's|,.*||')
    MONGO_HOST=$(echo "$MONGO_HOSTPORT" | sed 's|:[0-9]*$||')
    MONGO_PORT=$(echo "$MONGO_HOSTPORT" | grep -oE ':[0-9]+$' | tr -d ':' || true)
    MONGO_PORT="${MONGO_PORT:-27017}"
    if echo "$MONGO_URI" | grep -q '+srv'; then
      MONGO_IS_SRV="yes"
    else
      MONGO_IS_SRV="no"
    fi

    log "  Parsed: host=${CYAN}${MONGO_HOST}${RESET} port=${CYAN}${MONGO_PORT}${RESET} srv=${CYAN}${MONGO_IS_SRV}${RESET}"

    # DNS check for SRV records
    if [ "$MONGO_IS_SRV" = "yes" ] && has_cmd dig; then
      log ""
      log "  SRV record lookup:"
      srv_out=$(dig +short SRV "_mongodb._tcp.${MONGO_HOST}" 2>&1) || true
      if [ -n "$srv_out" ]; then
        pass "SRV records found:"
        echo "$srv_out" | while IFS= read -r line; do log "    $line"; done
      else
        fail "No SRV records found for _mongodb._tcp.${MONGO_HOST}"
      fi

      # TXT record (often contains replicaSet and authSource)
      txt_out=$(dig +short TXT "$MONGO_HOST" 2>&1) || true
      if [ -n "$txt_out" ]; then
        log "  TXT records: $txt_out"
      fi
    fi

    # Port reachability
    if has_cmd nc; then
      log ""
      if run_with_timeout 3 nc -z "$MONGO_HOST" "$MONGO_PORT" 2>/dev/null; then
        pass "MongoDB port ${MONGO_PORT} reachable on ${MONGO_HOST}"
      else
        fail "MongoDB port ${MONGO_PORT} NOT reachable on ${MONGO_HOST}"
      fi
    fi

    # SSL/TLS check for MongoDB
    if has_cmd openssl; then
      log ""
      ssl_mongo=$(echo | openssl s_client -connect "${MONGO_HOST}:${MONGO_PORT}" -servername "$MONGO_HOST" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null) || true
      if [ -n "$ssl_mongo" ]; then
        pass "MongoDB TLS certificate:"
        echo "$ssl_mongo" | while IFS= read -r line; do log "    $line"; done
      else
        log "  ${YELLOW}-${RESET} No TLS on MongoDB port (may be expected for non-TLS connections)"
      fi
    fi

    # Latency test — TCP connect time to MongoDB port
    if has_cmd curl; then
      log ""
      log "  TCP connect latency to MongoDB (3 attempts):"
      for i in 1 2 3; do
        # Use curl's telnet:// to measure raw TCP connect time
        tcp_time=$(curl -sS -o /dev/null \
          -w "%{time_connect}" \
          --max-time 5 \
          "telnet://${MONGO_HOST}:${MONGO_PORT}" 2>/dev/null) || tcp_time="error"
        log "    #${i}: ${CYAN}${tcp_time}s${RESET}"
      done
    fi

    # mongosh / mongo shell connectivity test
    if has_cmd mongosh; then
      log ""
      log "  Testing connection via mongosh..."
      mongo_out=$(run_with_timeout 10 mongosh "$MONGO_URI" --eval "
        const status = db.serverStatus();
        print('MongoDB version: ' + status.version);
        print('Uptime: ' + status.uptime + 's');
        print('Connections current: ' + status.connections.current);
        print('Connections available: ' + status.connections.available);
        print('Opcounters query: ' + status.opcounters.query);
        print('Opcounters insert: ' + status.opcounters.insert);
        print('Opcounters update: ' + status.opcounters.update);
        print('Opcounters delete: ' + status.opcounters.delete);
        const rs = rs.status();
        if (rs.ok) {
          print('Replica set: ' + rs.set);
          rs.members.forEach(m => print('  ' + m.name + ' state=' + m.stateStr + ' health=' + m.health));
        }
      " --quiet 2>&1) || true
      if [ -n "$mongo_out" ]; then
        pass "mongosh connection succeeded:"
        echo "$mongo_out" | while IFS= read -r line; do log "    $line"; done
      else
        fail "mongosh connection failed or timed out"
      fi
    elif has_cmd mongo; then
      log ""
      log "  Testing connection via mongo shell..."
      mongo_out=$(run_with_timeout 10 mongo "$MONGO_URI" --eval "
        var status = db.serverStatus();
        print('MongoDB version: ' + status.version);
        print('Uptime: ' + status.uptime + 's');
        print('Connections current: ' + status.connections.current);
        print('Connections available: ' + status.connections.available);
      " --quiet 2>&1) || true
      if [ -n "$mongo_out" ]; then
        pass "mongo shell connection succeeded:"
        echo "$mongo_out" | while IFS= read -r line; do log "    $line"; done
      else
        fail "mongo shell connection failed or timed out"
      fi
    else
      log "  ${YELLOW}-${RESET} Neither mongosh nor mongo shell available — skipping direct DB test"
    fi
  else
    log "  Skipped (no URI provided)"
  fi
fi

###############################################################################
# 6c. Redis Diagnostics
###############################################################################

# Redis diagnostics run alongside MongoDB diagnostics
REDIS_DIAG_NEEDED="${MONGO_DIAG_NEEDED:-false}"

if [ "$REDIS_DIAG_NEEDED" = "true" ]; then
  section "Redis Diagnostics"
  log "  Appsmith uses Redis for: sessions, caching, rate limiting, real-time"
  log "  events (pub/sub), git file locking, and auto-commit tracking."
  log "  The health endpoint checks Redis with a 3-second timeout."
  log ""

  # ── Redis-specific Health Analysis ──────────────────────────────────────
  # The /api/v1/health endpoint already checks Redis along with MongoDB.
  # We re-analyze the burst results from section 6b for Redis-specific signals.
  log "  ${BOLD}[Health Endpoint Redis Analysis]${RESET}"
  log "  (The health burst test above checks BOTH MongoDB and Redis)"
  if [ "${MONGO_FAILS:-0}" -gt 0 ] && [ "${MONGO_TIMEOUTS:-0}" -eq 0 ]; then
    warn "Health failures without MongoDB timeouts may indicate Redis issues"
    log "    ${YELLOW}→ Redis failures often show as generic 500 errors or connection refused${RESET}"
  elif [ "${MONGO_FAILS:-0}" -eq 0 ]; then
    pass "Health endpoint indicates Redis is responding (no failures in burst test)"
  fi

  # ── Rate Limit Detection ────────────────────────────────────────────────
  log ""
  log "  ${BOLD}[Rate Limit Check]${RESET}"
  log "  Appsmith uses Redis-backed rate limiting (Bucket4j)."
  log "  Limits: login = 5 attempts/day, test datasource = 3 per 5 seconds."
  # Check if we got rate-limited during our testing
  if [ -f "$RESP_HEADERS" ]; then
    RATE_LIMIT_HDR=$(grep -i '^x-ratelimit-\|^retry-after:' "$RESP_HEADERS" 2>/dev/null | head -5 || true)
    if [ -n "$RATE_LIMIT_HDR" ]; then
      warn "Rate limit headers detected in API response:"
      echo "$RATE_LIMIT_HDR" | while IFS= read -r line; do log "    $line"; done
      log "    ${YELLOW}→ You may be hitting Appsmith's rate limits. Wait and retry.${RESET}"
    else
      pass "No rate limiting detected"
    fi
  fi

  # ── Direct Redis Connectivity (optional) ────────────────────────────────
  log ""
  log "  ${BOLD}[Direct Redis Check]${RESET}"
  log "  ${YELLOW}Note: This requires network access to the Redis server.${RESET}"
  log "  ${YELLOW}If Appsmith runs in Docker/K8s, Redis may not be directly accessible.${RESET}"
  log_n "  Redis URI (optional, e.g. redis://host:6379): "
  read -r REDIS_URI
  echo "(redis URI provided: ${REDIS_URI:+yes}${REDIS_URI:+, redacted}${REDIS_URI:-no})" >> "$LOG_FILE"

  if [ -n "$REDIS_URI" ]; then
    # Parse host:port from Redis URI
    REDIS_HOSTPORT=$(echo "$REDIS_URI" | sed -E 's|^redis(s)?://||;s|.*@||;s|/.*||;s|\?.*||')
    REDIS_HOST=$(echo "$REDIS_HOSTPORT" | sed 's|:[0-9]*$||')
    REDIS_PORT=$(echo "$REDIS_HOSTPORT" | grep -oE ':[0-9]+$' | tr -d ':' || true)
    REDIS_HOST="${REDIS_HOST:-localhost}"
    REDIS_PORT="${REDIS_PORT:-6379}"
    REDIS_IS_TLS="no"
    echo "$REDIS_URI" | grep -q '^rediss://' && REDIS_IS_TLS="yes"

    log "  Parsed: host=${CYAN}${REDIS_HOST}${RESET} port=${CYAN}${REDIS_PORT}${RESET} tls=${CYAN}${REDIS_IS_TLS}${RESET}"

    # Port reachability
    if has_cmd nc; then
      log ""
      if run_with_timeout 3 nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; then
        pass "Redis port ${REDIS_PORT} reachable on ${REDIS_HOST}"
      else
        fail "Redis port ${REDIS_PORT} NOT reachable on ${REDIS_HOST}"
        log "    ${YELLOW}→ Redis may be behind a firewall, in a private network, or not running${RESET}"
      fi
    fi

    # TCP connect latency
    if has_cmd curl; then
      log ""
      log "  TCP connect latency to Redis (3 attempts):"
      for i in 1 2 3; do
        redis_tcp_time=$(curl -sS -o /dev/null \
          -w "%{time_connect}" \
          --max-time 5 \
          "telnet://${REDIS_HOST}:${REDIS_PORT}" 2>/dev/null) || redis_tcp_time="error"
        log "    #${i}: ${CYAN}${redis_tcp_time}s${RESET}"
      done
      log "  (Appsmith's Lettuce client has a 2-second command timeout)"
    fi

    # TLS check for Redis
    if [ "$REDIS_IS_TLS" = "yes" ] && has_cmd openssl; then
      log ""
      ssl_redis=$(echo | openssl s_client -connect "${REDIS_HOST}:${REDIS_PORT}" -servername "$REDIS_HOST" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null) || true
      if [ -n "$ssl_redis" ]; then
        pass "Redis TLS certificate:"
        echo "$ssl_redis" | while IFS= read -r line; do log "    $line"; done
      else
        log "  ${YELLOW}-${RESET} Could not verify Redis TLS certificate"
      fi
    fi

    # redis-cli connectivity test
    if has_cmd redis-cli; then
      log ""
      log "  Testing connection via redis-cli..."

      # Build redis-cli args
      REDIS_CLI_ARGS="-h $REDIS_HOST -p $REDIS_PORT"
      # Extract password from URI if present
      REDIS_PASS=$(echo "$REDIS_URI" | sed -nE 's|^rediss?://([^@]+)@.*|\1|p' | sed -nE 's|.*:(.+)|\1|p')
      [ -n "$REDIS_PASS" ] && REDIS_CLI_ARGS="$REDIS_CLI_ARGS -a $REDIS_PASS --no-auth-warning"
      [ "$REDIS_IS_TLS" = "yes" ] && REDIS_CLI_ARGS="$REDIS_CLI_ARGS --tls"

      # PING test
      redis_ping=$(run_with_timeout 5 redis-cli $REDIS_CLI_ARGS PING 2>&1) || true
      if echo "$redis_ping" | grep -qi "PONG"; then
        pass "Redis PING → PONG (connection successful)"
      else
        fail "Redis PING failed: $redis_ping"
        log "    ${YELLOW}→ Check Redis credentials and network access${RESET}"
      fi

      # INFO memory
      log ""
      log "  Redis memory & client info:"
      redis_info=$(run_with_timeout 5 redis-cli $REDIS_CLI_ARGS INFO memory 2>&1) || true
      if [ -n "$redis_info" ]; then
        used_mem=$(echo "$redis_info" | grep "^used_memory_human:" | cut -d: -f2 | tr -d '\r' || true)
        peak_mem=$(echo "$redis_info" | grep "^used_memory_peak_human:" | cut -d: -f2 | tr -d '\r' || true)
        mem_frag=$(echo "$redis_info" | grep "^mem_fragmentation_ratio:" | cut -d: -f2 | tr -d '\r' || true)
        [ -n "$used_mem" ] && log "    Memory used: ${CYAN}${used_mem}${RESET}"
        [ -n "$peak_mem" ] && log "    Memory peak: ${CYAN}${peak_mem}${RESET}"
        if [ -n "$mem_frag" ]; then
          log "    Fragmentation ratio: ${CYAN}${mem_frag}${RESET}"
          if has_cmd awk && [ "$(echo "$mem_frag" | awk '{print ($1 > 1.5) ? "high" : "ok"}')" = "high" ]; then
            warn "High memory fragmentation (${mem_frag}x) — Redis may need a restart"
          fi
        fi
      fi

      # INFO clients
      redis_clients=$(run_with_timeout 5 redis-cli $REDIS_CLI_ARGS INFO clients 2>&1) || true
      if [ -n "$redis_clients" ]; then
        conn_clients=$(echo "$redis_clients" | grep "^connected_clients:" | cut -d: -f2 | tr -d '\r' || true)
        blocked=$(echo "$redis_clients" | grep "^blocked_clients:" | cut -d: -f2 | tr -d '\r' || true)
        [ -n "$conn_clients" ] && log "    Connected clients: ${CYAN}${conn_clients}${RESET}"
        if [ -n "$blocked" ] && [ "$blocked" != "0" ]; then
          warn "Blocked clients: ${blocked} — clients waiting on Redis operations"
        fi
      fi

      # DBSIZE — approximate session/key count
      redis_dbsize=$(run_with_timeout 5 redis-cli $REDIS_CLI_ARGS DBSIZE 2>&1) || true
      if [ -n "$redis_dbsize" ]; then
        key_count=$(echo "$redis_dbsize" | grep -oE '[0-9]+' || true)
        log "    Total keys: ${CYAN}${key_count:-unknown}${RESET}"
        log "    (Includes sessions, rate limit buckets, cached data, locks)"
      fi

      # INFO server — version and uptime
      redis_server=$(run_with_timeout 5 redis-cli $REDIS_CLI_ARGS INFO server 2>&1) || true
      if [ -n "$redis_server" ]; then
        redis_ver=$(echo "$redis_server" | grep "^redis_version:" | cut -d: -f2 | tr -d '\r' || true)
        redis_uptime=$(echo "$redis_server" | grep "^uptime_in_seconds:" | cut -d: -f2 | tr -d '\r' || true)
        [ -n "$redis_ver" ] && log "    Redis version: ${CYAN}${redis_ver}${RESET}"
        if [ -n "$redis_uptime" ] && has_cmd awk; then
          uptime_human=$(echo "$redis_uptime" | awk '{
            d=int($1/86400); h=int(($1%86400)/3600); m=int(($1%3600)/60)
            if (d>0) printf "%dd %dh %dm", d, h, m
            else if (h>0) printf "%dh %dm", h, m
            else printf "%dm", m
          }')
          log "    Uptime: ${CYAN}${uptime_human}${RESET}"
        fi
      fi

      # Latency test via redis-cli
      log ""
      log "  Redis latency (5 samples):"
      redis_latency=$(run_with_timeout 10 redis-cli $REDIS_CLI_ARGS --latency-history -i 1 2>&1 &
        LATPID=$!
        sleep 6
        kill $LATPID 2>/dev/null
        wait $LATPID 2>/dev/null
      ) || true
      if [ -n "$redis_latency" ]; then
        echo "$redis_latency" | head -5 | while IFS= read -r line; do log "    $line"; done
      else
        # Fallback: simple PING timing
        for i in 1 2 3; do
          redis_time_start=$(date +%s%N 2>/dev/null || echo "0")
          run_with_timeout 3 redis-cli $REDIS_CLI_ARGS PING >/dev/null 2>&1 || true
          redis_time_end=$(date +%s%N 2>/dev/null || echo "0")
          if [ "$redis_time_start" != "0" ] && [ "$redis_time_end" != "0" ]; then
            redis_ms=$(( (redis_time_end - redis_time_start) / 1000000 ))
            log "    PING #${i}: ${CYAN}${redis_ms}ms${RESET}"
          fi
        done
        log "    (Appsmith's Lettuce client timeout is 2 seconds per command)"
      fi

    else
      log "  ${YELLOW}-${RESET} redis-cli not available — skipping detailed Redis diagnostics"
      log "    ${YELLOW}→ Install redis-cli to enable: brew install redis (macOS) or apt install redis-tools (Linux)${RESET}"
    fi
  else
    log "  Skipped (no URI provided)"
  fi
fi

###############################################################################
# 7. Summary
###############################################################################

section "Summary"

log "  ${GREEN}Passed: ${PASS_COUNT}${RESET}"
log "  ${RED}Failed: ${FAIL_COUNT}${RESET}"
log "  ${YELLOW}Warnings: ${WARN_COUNT}${RESET}"
log ""

# ── Overall Health Assessment ──────────────────────────────────────────────
if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -eq 0 ]; then
  log "  ${GREEN}${BOLD}✓ Everything looks healthy!${RESET}"
  log "  ${GREEN}  No issues detected with your Appsmith instance.${RESET}"
elif [ "$FAIL_COUNT" -eq 0 ]; then
  log "  ${YELLOW}${BOLD}⚠ Mostly healthy, but some warnings to review.${RESET}"
  log "  ${YELLOW}  Your Appsmith instance is working, but there are minor concerns.${RESET}"
elif [ "$FAIL_COUNT" -le 3 ]; then
  log "  ${RED}${BOLD}✗ Some issues detected.${RESET}"
  log "  ${RED}  Your Appsmith instance has problems that may affect performance.${RESET}"
else
  log "  ${RED}${BOLD}✗ Multiple issues detected — Appsmith may not be working correctly.${RESET}"
fi
log ""

# ── Prioritized, Plain-Language Suggestions ────────────────────────────────
if [ "$FAIL_COUNT" -gt 0 ] || [ "$WARN_COUNT" -gt 0 ]; then
  log "  ${BOLD}What to do next (in priority order):${RESET}"
  log ""

  # Priority 1: Can't connect at all
  if [ "$AUTH_OK" = "false" ]; then
    log "  ${RED}1. Cannot connect or log in${RESET}"
    log "     The script could not authenticate with your Appsmith instance."
    log "     ${BOLD}Try these:${RESET}"
    log "       • Double-check the URL — open it in a browser to make sure it loads"
    log "       • Verify your email and password are correct"
    log "       • If using SSO, make sure you completed the browser login"
    log "       • Check if Appsmith is actually running (try: ${CYAN}docker ps${RESET} or check your hosting)"
    log ""
  fi

  # Priority 2: API errors
  if [ "${API_OK:-false}" = "false" ] && [ "$AUTH_OK" = "true" ]; then
    log "  ${RED}2. Consolidated API is not responding correctly${RESET}"
    log "     You can log in, but the main API is returning errors."
    log "     ${BOLD}Try these:${RESET}"
    log "       • Check the Appsmith server logs for errors"
    log "       • Restart the Appsmith server (${CYAN}docker restart appsmith${RESET})"
    log "       • The database might be overloaded — see MongoDB/Redis sections below"
    log ""
  fi

  # Priority 3: Database issues
  if [ "${MONGO_TIMEOUTS:-0}" -gt 0 ] || [ "${MONGO_SECTION_ERRORS:-0}" -gt 0 ]; then
    log "  ${YELLOW}3. MongoDB may be slow or unhealthy${RESET}"
    log "     Some requests to MongoDB are timing out or returning errors."
    log "     ${BOLD}What this means:${RESET} Appsmith stores all your apps, pages, and queries in"
    log "     MongoDB. When MongoDB is slow, everything in Appsmith feels slow."
    log "     ${BOLD}Try these:${RESET}"
    log "       • Check if MongoDB is running: ${CYAN}docker logs appsmith | grep -i mongo${RESET}"
    log "       • MongoDB might need more memory or CPU"
    log "       • If using MongoDB Atlas, check your cluster metrics in the Atlas dashboard"
    log "       • Large apps (100+ widgets/queries) can strain MongoDB — consider splitting"
    log ""
  fi

  # Priority 4: High jitter / intermittent issues
  if [ -n "${t_jitter:-}" ] && has_cmd awk; then
    if [ "$(echo "${t_jitter}" | awk '{print ($1 > 0.5) ? "yes" : "no"}')" = "yes" ]; then
      log "  ${YELLOW}4. Inconsistent response times (high jitter)${RESET}"
      log "     Response times vary significantly between requests."
      log "     ${BOLD}What this means:${RESET} Some requests are fast, others are slow. This often"
      log "     points to a shared resource (database, network) being intermittently busy."
      log "     ${BOLD}Try these:${RESET}"
      log "       • Check if other apps share the same database or server"
      log "       • Monitor CPU/memory usage on the Appsmith server during slow periods"
      log "       • If on cloud hosting, your instance tier may be too small"
      log ""
    fi
  fi

  # Priority 5: Network / DNS
  if [ -n "${t_dns:-}" ] && has_cmd awk; then
    if [ "$(echo "${t_dns}" | awk '{print ($1 > 0.5) ? "yes" : "no"}')" = "yes" ]; then
      log "  ${YELLOW}5. Slow DNS lookup${RESET}"
      log "     It takes a long time to find the server's address."
      log "     ${BOLD}What this means:${RESET} Every time you open Appsmith, your computer needs"
      log "     to look up the server's IP address. Slow DNS adds delay to every request."
      log "     ${BOLD}Try these:${RESET}"
      log "       • Use a faster DNS provider (Google: 8.8.8.8, Cloudflare: 1.1.1.1)"
      log "       • If self-hosting, add your Appsmith domain to /etc/hosts"
      log ""
    fi
  fi

  log "  ${BOLD}For more help:${RESET}"
  log "    • Share the log file with your Appsmith admin or support team"
  log "    • Appsmith community: ${CYAN}https://community.appsmith.com${RESET}"
  log "    • Appsmith docs: ${CYAN}https://docs.appsmith.com/help-and-support/troubleshooting-guide${RESET}"
fi

log ""
log "  Log file: ${CYAN}${LOG_FILE}${RESET}"
log "  ${YELLOW}Tip: Share this log file when asking for help — it contains all the details.${RESET}"
log ""
log "${BOLD}Done.${RESET}"
