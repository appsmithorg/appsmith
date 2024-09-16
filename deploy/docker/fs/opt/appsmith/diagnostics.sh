#!/usr/bin/env bash

modified_within_last_x_minutes=180
tail_lines=10000
hostname=$(hostname)
timestamp=$(date +%F_%H.%M.%S-%Z)
tmpdir="${TMP}/$hostname/$timestamp"
java_pid="$(pgrep -f -- "-jar\sserver.jar")"

mkdir -p $tmpdir/{java,config,proc}

#
# Config info
#

# gather supervisord config
cp -r /tmp/appsmith/supervisor-conf.d "$tmpdir/config/supervisor-conf.d"

# gather caddy config
cp /tmp/appsmith/Caddyfile "$tmpdir/config/Caddyfile"

# gather env config
/opt/appsmith/run-with-env.sh env > "$tmpdir/config/appsmith-env-config.txt"

#
# Log info
#

# gather the logs
find /appsmith-stacks/logs/* -type f -mmin -"$modified_within_last_x_minutes" | while read -r i; do  
    if [[ -e "$i" ]]; then  
        mkdir -p "$tmpdir/$(dirname "${i:1}")"  
        tail -"$tail_lines" "$i" > "$tmpdir/${i:1}"  
    fi  
done 

#
# App info
#

# gather the container-info
cp /opt/appsmith/info.json "$tmpdir/container-info.json"

# gather the infra-details
cp /tmp/appsmith/infra.json "$tmpdir/infra-info.json"

# gather the healthcheck
/opt/appsmith/healthcheck.sh > "$tmpdir/healthcheck.txt"

#
# Java info
#

# gather the java vm.system_properties
jcmd $java_pid VM.system_properties > "$tmpdir/java/vm.system_properties.txt"

# gather the java vm.flags
jcmd $java_pid VM.flags > "$tmpdir/java/vm.flags.txt"

# gather the java gc.heap_dump
jcmd $java_pid GC.heap_dump "$tmpdir/java/heap-dump.log"

# gather the java thread.print
jcmd $java_pid Thread.print > "$tmpdir/java/thread.print.txt"

# gather the java gc.class_histogram
jcmd $java_pid GC.class_histogram > "$tmpdir/java/gc.class_histogram.txt"

#
# System info
#

# gather the configured umask
umask > "$tmpdir/umask.txt"

# gather the system uptime
uptime > "$tmpdir/uptime.txt"

# gather information on CPU count and installed memory
cp "/proc/cpuinfo" "$tmpdir/proc/cpuinfo"
cp "/proc/meminfo" "$tmpdir/proc/meminfo"

# gather running processes
ps fauxww > "$tmpdir/ps_fauxww.txt"

# gather free memory
free -m > "$tmpdir/free_m.txt"

# gather disk usage information
df -h > "$tmpdir/df_h.txt"
df -i > "$tmpdir/df_i.txt"
df -k > "$tmpdir/df_k.txt"

# gather uname
uname -a > "$tmpdir/uname_a.txt"

# gather memory info
function memory_util ()
{
  
  AVAILABLE_MEM=$(free -m | awk '/Mem/ {print $7}')
  TOTAL_MEM=$(free -m | awk '/Mem/ {print $2}')

  echo -e "........................................\nMEMORY UTILIZATION\n"
  echo -e "Total Memory\t\t:$TOTAL_MEM MB"
  echo -e "Available Memory\t:$AVAILABLE_MEM MB"
  echo -e "Buffer+Cache Memory\t:$BUFFCACHE_MEM MB"
  echo -e "Free Memory\t\t:$FREE_MEM MB"
}

memory_util > "$tmpdir/memory.txt"

# gather cpu info
function cpu_util ()
{
  # number of cpu cores
  CORES=$(nproc)

  # cpu load average of 15 minutes
  LOAD_AVERAGE=$(uptime | awk '{print $10}')

  echo -e "........................................\nCPU UTILIZATION\n"
  echo -e "Number of Cores\t:$CORES\n"

  echo -e "Total CPU Load Average for the past 15 minutes\t:$LOAD_AVERAGE\n"
}

cpu_util > "$tmpdir/cpu.txt"

# gather disk info
function disk_util ()
{
  DISK_USED=$(df -h | grep -w '/' | awk '{print $5}')
  DISK_USED=$(printf %s "$DISK_USED" | tr -d '[=%=]')
  DISK_AVAIL=$(( 100 - $DISK_USED ))

  echo -e "........................................\nDISK UTILIZATION\n"
  echo -e "Root(/) Used\t\t:$DISK_USED%"
  echo -e "Root(/) Available\t:$DISK_AVAIL%\n"
}

disk_util > "$tmpdir/disk.txt"

#
# Create tarball and clean up 
#

tar -C "${tmpdir%/*/*}" -czpf "$hostname-$timestamp.tar.gz" "$hostname/$timestamp/"

rm -rf "${tmpdir%/*/*}"

echo "Diagnostics gathered in $PWD/$hostname-$timestamp.tar.gz"
