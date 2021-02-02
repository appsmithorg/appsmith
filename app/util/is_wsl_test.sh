#!/usr/bin/env bash

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

distro=

cat() {
  echo $distro
}

fail() {
  local reason=$1

  echo "${reason}
  context: ${distro}"

  exit 1
}

stub_distro() {
  local name=$1

  distro=$name
  source $DIR/is_wsl.sh
}

stub_distro "Linux Computer 4.19.104-microsoft-standard #1 SMP Wed Feb 19 06:37:35 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux"
if [ ! $IS_WSL ]; then
  fail "Failed: Detected lack of WSL where it should have."
fi

stub_distro "Linux Computer 4.19.104-WSL-standard #1 SMP Wed Feb 19 06:37:35 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux"
if [ ! $IS_WSL ]; then
  fail "Failed: Detected lack of WSL where it should have."
fi

stub_distro "Linux pop-os 5.3.0-22-generic #24+system76~1573659475~19.04~26b2022-Ubuntu SMP Wed Nov 13 20:0 x86_64 x86_64 x86_64 GNU/Linux"
if [ $IS_WSL ]; then
  fail "Failed: Detected WSL where it shouldn't have."
fi

echo "All Tests Pass!"
