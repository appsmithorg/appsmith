#!/bin/bash

sudo find / -name "authorized_keys" -exec rm -f {} \;

sudo find /root/ /home/*/ -name .cvspass -exec rm -f {} \;

sudo service rsyslog restart