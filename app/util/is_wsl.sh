#!/usr/bin/env bash

IS_WSL=

proc_version="$(cat /proc/version)"
case "$proc_version" in
*icrosoft*)
    IS_WSL=true
;;
*WSL*)
    IS_WSL=true
;;
esac
