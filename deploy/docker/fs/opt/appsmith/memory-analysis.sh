#!/usr/bin/env bash
#
# memory-analysis.sh — Appsmith memory snapshot + sizing verdict.
#
# Runs inside the Appsmith container and prints a single-page report:
#   1. System RAM / cgroup limit
#   2. Per-process RSS for known Appsmith components
#   3. JVM detail (heap committed/used, MaxHeapSize ceiling, metaspace, NMT)
#   4. Threads — total count by default; --threads adds state/pool/stack breakdown
#   5. MongoDB WiredTiger cache (configured ceiling + current usage) and data-dir size
#   6. Memory currently in use — live RSS roll-up vs. available memory
#   7. Memory budget — configured ceilings vs. available memory
#   8. Verdict (OK / TIGHT / AT RISK)
#
# Output is plain text, safe to paste into a support ticket. No heap dumps,
# no tarballs — see diagnostics.sh for the heavy capture.
#
# Usage:
#   bash memory-analysis.sh                       # full report
#   bash memory-analysis.sh --no-mongo            # skip mongo probe
#   bash memory-analysis.sh --threads             # add thread breakdown (single snapshot)
#   bash memory-analysis.sh --threads-sample      # add stuck-thread sampling (10s window)
#   bash memory-analysis.sh --threads-sample=20   # sampling window in seconds (3-60)
#
# Exit codes: always 0 on a captured snapshot. Verdict severity is in the
# text, not the exit code, so callers can tee/share without surprises.

set -u

SKIP_MONGO=0
WITH_THREADS=0
WITH_THREAD_SAMPLE=0
SAMPLE_SECS=0
for arg in "$@"; do
  case "$arg" in
    --no-mongo)            SKIP_MONGO=1 ;;
    --threads)             WITH_THREADS=1 ;;
    --threads-sample)      WITH_THREADS=1; WITH_THREAD_SAMPLE=1; SAMPLE_SECS=10 ;;
    --threads-sample=*)    WITH_THREADS=1; WITH_THREAD_SAMPLE=1; SAMPLE_SECS="${arg#*=}" ;;
    -h|--help)
      sed -n '2,24p' "$0"; exit 0 ;;
  esac
done
# Clamp sample window to a sane range — only when sampling was explicitly
# requested. Plain --threads leaves SAMPLE_SECS at the 0 default so the
# stuck-thread section is correctly skipped.
if [[ "$WITH_THREAD_SAMPLE" -eq 1 ]]; then
  if [[ "$SAMPLE_SECS" =~ ^[0-9]+$ ]]; then
    [[ "$SAMPLE_SECS" -lt 3 ]] && SAMPLE_SECS=3
    [[ "$SAMPLE_SECS" -gt 60 ]] && SAMPLE_SECS=60
  else
    SAMPLE_SECS=10
  fi
fi

# ---------- helpers ----------------------------------------------------------

hr() { printf -- '----------------------------------------------------------\n'; }
hdr() { printf '\n== %s ==\n' "$1"; }

human_kb() {  # KB -> "1.2 GiB" / "456 MiB"
  awk -v k="$1" 'BEGIN{
    if (k=="" || k==0) {print "-"; exit}
    if (k >= 1048576) printf "%.2f GiB\n", k/1048576;
    else if (k >= 1024) printf "%.1f MiB\n", k/1024;
    else printf "%d KiB\n", k;
  }'
}
human_bytes() {  # bytes -> human
  awk -v b="$1" 'BEGIN{
    if (b=="" || b==0) {print "-"; exit}
    # Some JVM flags report effectively-uncapped as ~uint64_t::max (~16 EiB).
    # Anything beyond a sane physical scale is "unlimited" for our purposes.
    if (b > 1099511627776 * 100) {print "(uncapped)"; exit}
    if (b >= 1073741824) printf "%.2f GiB\n", b/1073741824;
    else if (b >= 1048576) printf "%.1f MiB\n", b/1048576;
    else if (b >= 1024) printf "%.1f KiB\n", b/1024;
    else printf "%d B\n", b;
  }'
}

# Total RSS (in KB) of all PIDs whose full command line matches the pattern.
sum_rss_kb() {
  local pattern="$1"
  ps -eo pid,rss,args --no-headers 2>/dev/null \
    | awk -v p="$pattern" 'BEGIN{IGNORECASE=1} $0 ~ p {sum+=$2} END{printf "%d", sum+0}'
}
count_procs() {
  local pattern="$1"
  ps -eo pid,args --no-headers 2>/dev/null \
    | awk -v p="$pattern" 'BEGIN{IGNORECASE=1} $0 ~ p {n++} END{printf "%d", n+0}'
}

# ---------- 1. system memory -------------------------------------------------

hdr "System"
echo "Host:        $(hostname)"
echo "Kernel:      $(uname -srm)"
echo "Date (UTC):  $(date -u '+%Y-%m-%d %H:%M:%S')"
if [[ -f /opt/appsmith/info.json ]]; then
  ver=$(grep -oE '"version"[^,}]*' /opt/appsmith/info.json | head -1 | tr -d '"' | cut -d: -f2 | xargs)
  # No "edition" key in info.json — infer from the commit URL (CE vs EE repo).
  commit_url=$(grep -oE '"commitUrl"[^,}]*' /opt/appsmith/info.json | head -1 | tr -d '"' | cut -d: -f2- | xargs)
  if [[ "$commit_url" == *appsmith-ee* ]]; then
    edition=EE
  elif [[ "$commit_url" == *appsmithorg/appsmith* ]]; then
    edition=CE
  else
    edition=""
  fi
  echo "Appsmith:    ${edition:+$edition }${ver:-unknown}"
fi

mem_total_kb=$(awk '/^MemTotal:/{print $2}' /proc/meminfo)
mem_avail_kb=$(awk '/^MemAvailable:/{print $2}' /proc/meminfo)
swap_total_kb=$(awk '/^SwapTotal:/{print $2}' /proc/meminfo)

# Cgroup detection (v2 first, then v1)
cgroup_limit_bytes=""
cgroup_current_bytes=""
if [[ -f /sys/fs/cgroup/memory.max ]]; then
  v=$(cat /sys/fs/cgroup/memory.max 2>/dev/null)
  [[ "$v" != "max" && -n "$v" ]] && cgroup_limit_bytes="$v"
  [[ -f /sys/fs/cgroup/memory.current ]] && cgroup_current_bytes=$(cat /sys/fs/cgroup/memory.current 2>/dev/null)
elif [[ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]]; then
  v=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null)
  # cgroup v1 "unlimited" sentinel is a giant number; treat anything >host as unlimited
  if [[ -n "$v" && "$v" -lt $((mem_total_kb * 1024 * 2)) ]]; then
    cgroup_limit_bytes="$v"
  fi
  [[ -f /sys/fs/cgroup/memory/memory.usage_in_bytes ]] && \
    cgroup_current_bytes=$(cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null)
fi

echo "Host RAM:    $(human_kb "$mem_total_kb")  (available: $(human_kb "$mem_avail_kb"))"
echo "Host swap:   $(human_kb "$swap_total_kb")"
if [[ -n "$cgroup_limit_bytes" ]]; then
  echo "cgroup cap:  $(human_bytes "$cgroup_limit_bytes")  (current: $(human_bytes "${cgroup_current_bytes:-0}"))"
  # Convert to KB for the budget math
  budget_total_kb=$(( cgroup_limit_bytes / 1024 ))
  budget_source="container cgroup limit"
else
  echo "cgroup cap:  (none — container can use full host RAM)"
  budget_total_kb=$mem_total_kb
  budget_source="host RAM"
fi

# ---------- 2. per-process RSS ----------------------------------------------

hdr "Processes (RSS)"
printf '  %-12s  %10s  %s\n' "ROLE" "RSS" "MATCH"
hr

declare -A role_kb
declare -A role_n
declare -a role_order=(java rts mongod postgres redis keycloak temporal caddy supervisord)

# Note on the prefix class: ps -eo pid,rss,args prints args with the executable
# name preceded by whitespace (after the rss column), so patterns must accept
# space, slash, OR line start. (^|/)name fails to match the common "  170752 mongod ..."
# layout. Same idea for the suffix.
role_pattern_java="(server\.jar|java .* -jar)"
role_pattern_rts="(rts.*server|node .*server\.bundle\.js|node .*server\.js)"
role_pattern_mongod="( |/|^)mongod( |$)"
# Postgres forks one backend per connection; each backend's "RSS" includes the
# shared_buffers segment, so summing them overcounts dramatically. The postmaster
# (started with -D /path) owns the shared region — its RSS is a much better
# proxy for actual unique memory than sum-across-all-backends.
role_pattern_postgres="( |/|^)postgres .* -D "
role_pattern_redis="( |/|^)redis-server( |$)"
role_pattern_keycloak="(keycloak|quarkus|kc\.sh|java .*keycloak)"
role_pattern_temporal="(temporal-server|temporalio|temporal start|temporal.*frontend)"
role_pattern_caddy="( |/|^)caddy( |$)"
role_pattern_supervisord="( |/|^)supervisord( |$)"

total_other_kb=0
total_java_kb=0
total_mongod_kb=0
for role in "${role_order[@]}"; do
  var="role_pattern_${role}"
  pat="${!var}"
  kb=$(sum_rss_kb "$pat")
  n=$(count_procs "$pat")
  role_kb[$role]=$kb
  role_n[$role]=$n
  if [[ "$kb" -gt 0 ]]; then
    printf '  %-12s  %10s  %s (n=%d)\n' "$role" "$(human_kb "$kb")" "$pat" "$n"
    case "$role" in
      java)    total_java_kb=$kb ;;
      mongod)  total_mongod_kb=$kb ;;
      *)       total_other_kb=$(( total_other_kb + kb )) ;;
    esac
  fi
done

# Anything not matched but worth showing? top non-Appsmith RSS hogs.
hr
echo "  (top 5 RSS processes overall, for sanity:)"
ps -eo pid,rss,comm --sort=-rss --no-headers 2>/dev/null | head -5 \
  | awk '{printf "    pid %-7d  %8.1f MiB  %s\n", $1, $2/1024, $3}'

# ---------- 3. JVM ----------------------------------------------------------

hdr "JVM (Appsmith server)"
java_pid=$(pgrep -f -- "-jar\s*server\.jar" | head -1 || true)
if [[ -z "${java_pid:-}" ]]; then
  echo "  (no server.jar process found — Appsmith backend not running)"
else
  java_rss_kb=$(awk '/^VmRSS:/{print $2}' /proc/$java_pid/status 2>/dev/null)
  java_threads=$(awk '/^Threads:/{print $2}' /proc/$java_pid/status 2>/dev/null)
  java_uptime=$(ps -o etime= -p "$java_pid" 2>/dev/null | xargs)
  echo "  pid:        $java_pid   uptime: ${java_uptime:-?}"
  echo "  RSS:        $(human_kb "${java_rss_kb:-0}")"
  echo "  Threads:    ${java_threads:-?}   (rerun with --threads for state breakdown + deadlock check)"

  if command -v jcmd >/dev/null 2>&1; then
    # VM.flags -all prints every flag with value + origin (default / ergonomic /
    # command line / etc). That's the only reliable source for MaxHeapSize when
    # the customer hasn't set -Xmx explicitly: the JVM picks one from
    # MaxRAMPercentage and reports it as "ergonomic".
    flags_all=$(jcmd "$java_pid" VM.flags -all 2>/dev/null || true)

    flag_value() {  # $1 = flag name → bytes value (or empty)
      grep -E "^[[:space:]]*[a-z_]+[[:space:]]+$1[[:space:]]*=" <<<"$flags_all" \
        | head -1 | awk -F'=' '{print $2}' | awk '{print $1}'
    }
    flag_origin() {  # $1 = flag name → origin token in braces (e.g. "ergonomic")
      grep -E "^[[:space:]]*[a-z_]+[[:space:]]+$1[[:space:]]*=" <<<"$flags_all" \
        | head -1 | grep -oE '\{[^}]+\}' | tail -1 | tr -d '{}'
    }

    max_heap=$(flag_value MaxHeapSize)
    max_heap_origin=$(flag_origin MaxHeapSize)
    init_heap=$(flag_value InitialHeapSize)
    metaspace_cap=$(flag_value MaxMetaspaceSize)
    direct_cap=$(flag_value MaxDirectMemorySize)
    ram_pct=$(flag_value MaxRAMPercentage)
    init_ram_pct=$(flag_value InitialRAMPercentage)

    # Active GC — match only real GC selector flags (not unrelated *GC tuning
    # flags like UseMaximumCompactionOnSystemGC). JDK 17+ defaults to G1.
    gc_selectors='UseG1GC|UseZGC|UseShenandoahGC|UseParallelGC|UseSerialGC|UseConcMarkSweepGC|UseEpsilonGC'
    gc=$(grep -E "($gc_selectors)[[:space:]]*=[[:space:]]*true" <<<"$flags_all" \
      | grep -oE "($gc_selectors)" | head -1)

    case "$max_heap_origin" in
      *"command line"*) origin_note="explicit (-Xmx on command line)" ;;
      *ergonomic*)      origin_note="ergonomic — JVM picked this from MaxRAMPercentage; no -Xmx set" ;;
      *default*)        origin_note="default" ;;
      "")               origin_note="unknown" ;;
      *)                origin_note="$max_heap_origin" ;;
    esac

    echo "  GC:         ${gc:-?}"
    echo "  -Xmx:       $(human_bytes "${max_heap:-0}")   [$origin_note]"
    echo "  -Xms:       $(human_bytes "${init_heap:-0}")"
    [[ -n "$ram_pct" ]]      && echo "  MaxRAM%:    ${ram_pct} (of $([[ -n "$cgroup_limit_bytes" ]] && echo cgroup || echo host) RAM)"
    [[ -n "$init_ram_pct" ]] && echo "  InitRAM%:   ${init_ram_pct}"
    echo "  Metaspace:  cap=$(human_bytes "${metaspace_cap:-0}")"
    echo "  DirectMem:  cap=$(human_bytes "${direct_cap:-0}")"

    # heap_info format varies across GCs (G1 uses K, ZGC/Shenandoah use M, fields
    # differ). Print the first ~6 lines verbatim — readable and parse-free.
    heap_info=$(jcmd "$java_pid" GC.heap_info 2>/dev/null | sed 1d || true)
    if [[ -n "$heap_info" ]]; then
      echo "  Heap info:"
      sed -n '1,8p' <<<"$heap_info" | sed 's/^/    /'
      # Parse first "used N(K|M)" we see — first occurrence is the whole heap
      # for G1/Z/Shenandoah. (Parallel/Serial report per-generation; we accept
      # young-gen as a partial answer there rather than failing.)
      heap_used_k=$(grep -oE 'used [0-9]+K' <<<"$heap_info" | head -1 | grep -oE '[0-9]+')
      if [[ -z "$heap_used_k" ]]; then
        heap_used_m=$(grep -oE 'used [0-9]+M' <<<"$heap_info" | head -1 | grep -oE '[0-9]+')
        [[ -n "$heap_used_m" ]] && heap_used_k=$(( heap_used_m * 1024 ))
      fi
    fi

    nmt=$(jcmd "$java_pid" VM.native_memory summary 2>&1 || true)
    if grep -qi "native memory tracking is not" <<<"$nmt" \
       || grep -qi "NMT is not enabled" <<<"$nmt"; then
      echo "  NMT:        disabled  (enable with APPSMITH_JAVA_ARGS='-XX:NativeMemoryTracking=summary' + restart for deeper attribution)"
    elif [[ -n "$nmt" ]]; then
      reserved=$(awk '/Total: reserved=/{print; exit}' <<<"$nmt")
      echo "  NMT:        ${reserved:-(present)}"
    fi
  else
    echo "  jcmd not on PATH — can't introspect JVM. Install JDK tools in the image to enable."
  fi
fi

# ---------- 4. Threads (optional, --threads) --------------------------------

if [[ "$WITH_THREADS" -eq 1 && -n "${java_pid:-}" ]] && command -v jcmd >/dev/null 2>&1; then
  hdr "Threads (single snapshot — signals, not diagnoses)"
  threads_out=$(jcmd "$java_pid" Thread.print 2>/dev/null || true)
  if [[ -z "$threads_out" ]]; then
    echo "  (Thread.print produced no output)"
  else
    total=$(grep -cE '^"' <<<"$threads_out")
    echo "  Total threads: $total  (OS thread count: ${java_threads:-?})"

    # Deadlock check — the JVM appends a "Found one Java-level deadlock" block
    # at the bottom of Thread.print when it detects any. Clear yes/no.
    if grep -q 'Found .* Java-level deadlock' <<<"$threads_out"; then
      echo ""
      echo "  !! DEADLOCK DETECTED — see relevant section of Thread.print:"
      sed -n '/Found .* Java-level deadlock/,/^Java stack information/p' <<<"$threads_out" \
        | head -40 | sed 's/^/    /'
    else
      echo "  Deadlocks:     none reported"
    fi

    # State histogram. Threads not currently parked on Java code may lack a
    # Thread.State line (e.g. native JVM threads) — those are counted as "other".
    echo ""
    echo "  State breakdown:"
    grep -oE 'java\.lang\.Thread\.State: [A-Z_]+' <<<"$threads_out" \
      | awk '{print $NF}' | sort | uniq -c | sort -rn \
      | awk '{printf "    %5d  %s\n", $1, $2}'
    with_state=$(grep -cE 'java\.lang\.Thread\.State:' <<<"$threads_out")
    other=$(( total - with_state ))
    if [[ "$other" -gt 0 ]]; then
      printf '    %5d  (native / no Thread.State line)\n' "$other"
    fi

    # Group by thread name prefix. Strip trailing -N or -N-M digit suffixes so
    # pool families collapse into one row.
    echo ""
    echo "  Top thread name groups (after stripping trailing -N suffixes):"
    grep -oE '^"[^"]+"' <<<"$threads_out" \
      | tr -d '"' \
      | sed -E 's/(-[0-9]+)+$//; s/-[0-9]+-thread-[0-9]+$/-thread/' \
      | sort | uniq -c | sort -rn | head -10 \
      | awk '{n=$1; $1=""; sub(/^ /,""); printf "    %5d  %s\n", n, $0}'

    # Top frames — the first "at ..." line after each thread header. A pile of
    # threads parked on the same frame is a strong saturation signal.
    echo ""
    echo "  Top 5 hot frames (first stack frame per thread):"
    awk '/^"/{flag=1; next} flag && /^[[:space:]]+at /{print; flag=0}' <<<"$threads_out" \
      | sed -E 's/^[[:space:]]+at /at /' \
      | sort | uniq -c | sort -rn | head -5 \
      | awk '{n=$1; $1=""; sub(/^ /,""); printf "    %5d  %s\n", n, $0}'

    if [[ "$SAMPLE_SECS" -eq 0 ]]; then
      echo ""
      echo "  Note: a single snapshot can spot deadlocks and pool saturation but"
      echo "  cannot prove a thread is 'stuck' — rerun with --threads-sample for that."
    fi
  fi
fi

# ---------- 4b. Stuck-thread sampling (optional, --threads-sample) ----------

if [[ "$WITH_THREADS" -eq 1 && "$SAMPLE_SECS" -gt 0 && -n "${java_pid:-}" ]] \
   && command -v jcmd >/dev/null 2>&1; then
  hdr "Stuck thread sampling (${SAMPLE_SECS}s window)"

  # Awk parser: emits one TSV line per thread — name<TAB>state<TAB>topframe.
  parse_threads() {
    awk '
      function flush() {
        if (name != "" && state != "" && topframe != "")
          print name "\t" state "\t" topframe
      }
      /^"/ {
        flush()
        name = $0; sub(/^"/, "", name); sub(/".*$/, "", name)
        state = ""; topframe = ""; next
      }
      /java\.lang\.Thread\.State:/ {
        if (match($0, /State: [A-Z_]+/))
          state = substr($0, RSTART+7, RLENGTH-7)
        next
      }
      /^[[:space:]]+at / {
        if (topframe == "") {
          line = $0; sub(/^[[:space:]]+at /, "", line)
          topframe = line
        }
        next
      }
      END { flush() }
    '
  }

  # Reuse the snapshot the basic --threads section already captured as snap1
  # when possible, so the sample window is the gap between sections rather
  # than an extra delay. Otherwise capture both fresh.
  if [[ -n "${threads_out:-}" ]]; then
    snap1="$threads_out"
    echo "  Snapshot 1: reused from threads section above"
  else
    echo "  Capturing snapshot 1..."
    snap1=$(jcmd "$java_pid" Thread.print 2>/dev/null || true)
  fi
  echo "  Sleeping ${SAMPLE_SECS}s..."
  sleep "$SAMPLE_SECS"
  echo "  Capturing snapshot 2..."
  snap2=$(jcmd "$java_pid" Thread.print 2>/dev/null || true)

  if [[ -z "$snap1" || -z "$snap2" ]]; then
    echo "  (one or both snapshots were empty — cannot compare)"
  else
    t1=$(mktemp); t2=$(mktemp)
    parse_threads <<<"$snap1" | sort -t$'\t' -k1,1 > "$t1"
    parse_threads <<<"$snap2" | sort -t$'\t' -k1,1 > "$t2"

    # Join on thread name; flag rows where both snapshots show RUNNABLE on the
    # same top frame.
    stuck=$(join -t $'\t' "$t1" "$t2" \
      | awk -F'\t' '$2=="RUNNABLE" && $4=="RUNNABLE" && $3==$5 {print $1 "\t" $3}')
    rm -f "$t1" "$t2"

    if [[ -z "$stuck" ]]; then
      stuck_count=0
    else
      stuck_count=$(wc -l <<<"$stuck" | tr -d ' ')
    fi

    if [[ "$stuck_count" -eq 0 ]]; then
      echo ""
      echo "  No threads stayed RUNNABLE on the same top frame across both snapshots."
    else
      echo ""
      echo "  $stuck_count thread(s) RUNNABLE on the same top frame in both snapshots:"
      # Group identical (name-prefix, frame) pairs so pool members collapse.
      # The suffix to strip lives before the TAB separating name and frame —
      # not at end-of-line — so anchor on \t rather than $.
      echo "$stuck" \
        | sed -E 's/-[0-9]+(-[0-9]+)*\t/\t/' \
        | awk -F'\t' '{key=$1"\t"$2; count[key]++} END {for (k in count) print count[k]"\t"k}' \
        | sort -t$'\t' -k1,1 -rn \
        | head -20 \
        | awk -F'\t' '{printf "    [%3d]  %-32s  %s\n", $1, $2, $3}'
    fi

    echo ""
    echo "  How to read this:"
    echo "  - RUNNABLE on the same frame for ${SAMPLE_SECS}s = the JVM scheduler ran"
    echo "    this thread but it didn't advance past that frame. Strong signal."
    echo "  - Benign frames to ignore: Selector.select, EPoll.wait, KQueue.poll,"
    echo "    LockSupport.park (these *should* be in non-RUNNABLE states, but"
    echo "    short native polls can appear RUNNABLE transiently)."
    echo "  - Suspicious: application package frames (com.appsmith.*) or library"
    echo "    code doing work (regex, JSON parsing, DB driver internals)."
  fi
fi

# ---------- 5. MongoDB ------------------------------------------------------

hdr "MongoDB"
mongo_rss_kb=${role_kb[mongod]:-0}
mongo_is_local=0
[[ "${mongo_rss_kb:-0}" -gt 0 ]] && mongo_is_local=1
if [[ "$mongo_is_local" -eq 1 ]]; then
  echo "  Topology:   embedded (mongod runs in this container)"
  echo "  RSS:        $(human_kb "$mongo_rss_kb")"

  # Parse --dbpath from the running mongod's args; fall back to image default.
  mongo_dbpath=$(ps -eo args --no-headers 2>/dev/null \
    | awk '/[m]ongod / && /--dbpath/{
        for (i=1;i<=NF;i++) if ($i=="--dbpath") {print $(i+1); exit}
      }')
  mongo_dbpath="${mongo_dbpath:-/appsmith-stacks/data/mongodb}"
  if [[ -d "$mongo_dbpath" ]]; then
    total_size=$(du -sh "$mongo_dbpath" 2>/dev/null | awk '{print $1}')
    echo "  Data dir:   $mongo_dbpath  (on disk: ${total_size:-?})"
    # Show journal subdir if present — it's a common growth path under heavy writes.
    if [[ -d "$mongo_dbpath/journal" ]]; then
      journal_size=$(du -sh "$mongo_dbpath/journal" 2>/dev/null | awk '{print $1}')
      echo "              journal: ${journal_size:-?}"
    fi
    echo "              (larger data on disk → more pages WiredTiger may pull into cache)"
  fi
else
  echo "  Topology:   external (no mongod RSS in this container)"
fi

wt_max_bytes=0
wt_used_bytes=0
if [[ "$SKIP_MONGO" -eq 1 ]]; then
  echo "  (--no-mongo passed; skipping live probe)"
elif ! command -v mongosh >/dev/null 2>&1 && ! command -v mongo >/dev/null 2>&1; then
  echo "  (no mongosh/mongo client — skipping WT cache probe)"
else
  mclient=mongosh
  command -v mongosh >/dev/null 2>&1 || mclient=mongo
  # `docker exec` doesn't inherit APPSMITH_DB_URL from the container's
  # supervisord env. Read it from the running JVM's /proc/<pid>/environ so we
  # use the same authenticated URL the running app uses.
  url="${APPSMITH_DB_URL:-}"
  if [[ -z "$url" && -n "${java_pid:-}" && -r "/proc/$java_pid/environ" ]]; then
    url=$(tr '\0' '\n' < "/proc/$java_pid/environ" 2>/dev/null \
      | awk -F= '/^APPSMITH_DB_URL=/{sub(/^APPSMITH_DB_URL=/,""); print; exit}')
  fi
  url="${url:-mongodb://localhost:27017/appsmith?replicaSet=mr1}"
  # Hide creds when echoing
  safe_url=$(sed -E 's#(mongodb(\+srv)?://)[^@/]+@#\1***:***@#' <<<"$url")
  echo "  URL:        $safe_url  (via $mclient)"
  js='var s=db.serverStatus().wiredTiger.cache;
print("WT_MAX="+s["maximum bytes configured"]);
print("WT_USED="+s["bytes currently in the cache"]);'
  out=$("$mclient" --quiet "$url" --eval "$js" 2>&1 || true)
  # Drivers sometimes echo the connection string in auth/parse errors; redact
  # before any of this output reaches the diagnostics tarball.
  safe_out=$(sed -E 's#(mongodb(\+srv)?://)[^@/]+@#\1***:***@#' <<<"$out")
  wt_max_bytes=$(grep -oE 'WT_MAX=[0-9]+' <<<"$out" | head -1 | cut -d= -f2)
  wt_used_bytes=$(grep -oE 'WT_USED=[0-9]+' <<<"$out" | head -1 | cut -d= -f2)
  if [[ -n "${wt_max_bytes:-}" ]]; then
    echo "  WT cache:   configured ceiling=$(human_bytes "$wt_max_bytes")  in use=$(human_bytes "${wt_used_bytes:-0}")"
    echo "              (live from db.serverStatus().wiredTiger.cache —"
    echo "               'maximum bytes configured' and 'bytes currently in the cache')"
    if [[ "$mongo_is_local" -eq 0 ]]; then
      echo "              ^ on the external Mongo host — does NOT consume memory in this container."
      echo "                (Still worth right-sizing on that host if it's > available RAM there.)"
    fi
  else
    echo "  WT cache:   (probe failed) — $(head -3 <<<"$safe_out" | tr '\n' ' ')"
    wt_max_bytes=0
  fi
fi

# Fallback estimate (only for embedded mongo, only when probe failed):
# Mongo default = max((RAM-1)/2, 256MB).
if [[ "$mongo_is_local" -eq 1 && "${wt_max_bytes:-0}" -eq 0 ]]; then
  est_cache_bytes=$(awk -v kb="$budget_total_kb" 'BEGIN{
    gb = kb/1048576;
    cap = (gb-1)/2;
    if (cap < 0.256) cap = 0.256;
    printf "%d", cap*1073741824;
  }')
  echo "  WT cache:   (estimated default ceiling on this RAM) ~$(human_bytes "$est_cache_bytes")"
  wt_max_bytes=$est_cache_bytes
fi

# ---------- 6. Current usage (mirrors the budget structure) -----------------

hdr "Memory currently in use"
budget_total_bytes=$(( budget_total_kb * 1024 ))

# Total in use: prefer cgroup.current (the most authoritative for a container),
# fall back to (MemTotal - MemAvailable) when there's no cgroup limit.
if [[ -n "${cgroup_current_bytes:-}" ]]; then
  in_use_bytes=$cgroup_current_bytes
  in_use_source="cgroup.current"
else
  in_use_bytes=$(( (mem_total_kb - mem_avail_kb) * 1024 ))
  in_use_source="MemTotal - MemAvailable"
fi

java_rss_bytes=$(( total_java_kb * 1024 ))
mongo_rss_bytes=$(( total_mongod_kb * 1024 ))
other_rss_bytes=$(( total_other_kb * 1024 ))
heap_used_bytes=$(( ${heap_used_k:-0} * 1024 ))
tracked_sum_bytes=$(( java_rss_bytes + mongo_rss_bytes + other_rss_bytes ))

# Unaccounted = whatever the OS says is in use beyond the procs we recognize.
# Includes kernel page cache (which cgroup.current counts), shared anon, etc.
unaccounted_bytes=$(( in_use_bytes - tracked_sum_bytes ))
[[ "$unaccounted_bytes" -lt 0 ]] && unaccounted_bytes=0
free_bytes=$(( budget_total_bytes - in_use_bytes ))
[[ "$free_bytes" -lt 0 ]] && free_bytes=0

printf '  source:                    %s\n' "$budget_source"
printf '  total available:           %s\n' "$(human_bytes "$budget_total_bytes")"
printf '  - JVM RSS:                 %s\n' "$(human_bytes "$java_rss_bytes")"
if [[ -n "${heap_used_k:-}" ]]; then
  printf '      heap used:             %s\n' "$(human_bytes "$heap_used_bytes")"
fi
if [[ "$mongo_is_local" -eq 1 ]]; then
  printf '  - Mongo RSS:               %s\n' "$(human_bytes "$mongo_rss_bytes")"
  if [[ -n "${wt_used_bytes:-}" && "${wt_used_bytes:-0}" -gt 0 ]]; then
    printf '      WT cache in use:       %s\n' "$(human_bytes "$wt_used_bytes")"
  fi
else
  printf '  - Mongo RSS:               (external — not counted here)\n'
fi
printf '  - Other Appsmith procs:    %s\n' "$(human_bytes "$other_rss_bytes")"
printf '  - Other / kernel buffers:  %s   (in-use beyond tracked procs)\n' "$(human_bytes "$unaccounted_bytes")"
printf '  = total in use:            %s   (from %s)\n' "$(human_bytes "$in_use_bytes")" "$in_use_source"
printf '  + free:                    %s\n' "$(human_bytes "$free_bytes")"

# ---------- 7. Budget reconciliation ----------------------------------------

hdr "Memory budget"

# JVM "worst case" footprint: Xmx + estimated non-heap overhead.
jvm_max_heap=${max_heap:-0}
jvm_nonheap_estimate=$(( 500 * 1024 * 1024 ))  # 500 MiB rough overhead from Notion analysis
jvm_ceiling_bytes=$(( jvm_max_heap + jvm_nonheap_estimate ))

other_bytes=$(( total_other_kb * 1024 ))
headroom_bytes=$(( 1024 * 1024 * 1024 ))  # 1 GiB safety for spikes (refactor APIs etc)

# Only count WT cache against this container's budget when mongod is local.
if [[ "$mongo_is_local" -eq 1 ]]; then
  wt_in_budget=$wt_max_bytes
else
  wt_in_budget=0
fi
ceiling_sum=$(( jvm_ceiling_bytes + wt_in_budget + other_bytes + headroom_bytes ))

printf '  source:                    %s\n' "$budget_source"
printf '  total available:           %s\n' "$(human_bytes "$budget_total_bytes")"
printf '  - JVM Xmx ceiling:         %s\n' "$(human_bytes "$jvm_max_heap")"
printf '  - JVM non-heap (est):      %s\n' "$(human_bytes "$jvm_nonheap_estimate")"
if [[ "$mongo_is_local" -eq 1 ]]; then
  printf '  - Mongo WT cache ceiling:  %s\n' "$(human_bytes "$wt_in_budget")"
else
  printf '  - Mongo WT cache ceiling:  (external Mongo — not counted)\n'
fi
printf '  - Other Appsmith procs:    %s   (observed RSS: rts+keycloak+temporal+caddy+supervisord+redis+postgres)\n' "$(human_bytes "$other_bytes")"
printf '  - Reserved spike headroom: %s\n' "$(human_bytes "$headroom_bytes")"
printf '  = sum of ceilings:         %s\n' "$(human_bytes "$ceiling_sum")"

# ---------- 8. Verdict ------------------------------------------------------

hdr "Verdict"

gb_avail=$(awk -v b="$budget_total_bytes" 'BEGIN{printf "%.1f", b/1073741824}')
overshoot_bytes=$(( ceiling_sum - budget_total_bytes ))
margin=$(( budget_total_bytes - ceiling_sum ))
tight_threshold=$(( 512 * 1024 * 1024 ))  # < 512 MiB free is uncomfortably close

echo "  Available:  $gb_avail GiB (source: $budget_source)"
echo ""
if [[ "$overshoot_bytes" -gt 0 ]]; then
  echo "  STATUS: AT RISK — configured ceilings exceed available memory by $(human_bytes "$overshoot_bytes")."
  echo "          Under load (e.g. refactor / large widget rename) the JVM heap can grow"
  echo "          toward -Xmx while WiredTiger holds its cache, forcing OS-level OOM."
elif [[ "$margin" -lt "$tight_threshold" ]]; then
  echo "  STATUS: TIGHT — ceilings fit, but only $(human_bytes "$margin") headroom remains."
  echo "          A single large operation (refactor, wide query) could push the container"
  echo "          over its limit."
else
  echo "  STATUS: OK — ceilings fit within available memory ($(human_bytes "$margin") headroom)."
fi

# Flag non-default deployments — informational, not prescriptive.
if [[ -n "${java_pid:-}" ]] && pgrep -f -- "dynatrace|oneagent|liboneagent" >/dev/null 2>&1; then
  echo ""
  echo "  NOTE: Dynatrace OneAgent detected — typically adds ~200-400 MiB to JVM RSS."
fi

hr
echo "Snapshot captured at $(date -u '+%Y-%m-%dT%H:%M:%SZ')."
echo "Run again under load (during a slow refactor / large action) for peak numbers."
