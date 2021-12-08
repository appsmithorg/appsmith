#!/bin/bash

set -o nounset

MAIL_FROM="$1"
MAIL_TO="$2"

cat <<EOF
date_format=''


sendmail="/usr/bin/msmtp"


EMAIL_SENDER="$MAIL_FROM"

# enable/disable sending emails
SEND_EMAIL="YES"

# if a role recipient is not configured, an email will be send to:
DEFAULT_RECIPIENT_EMAIL="root"
# to receive only critical alarms, set it to "root|critical"


# enable/disable sending Dynatrace notifications
SEND_DYNATRACE="YES"


# Change this to what you want
DYNATRACE_ANNOTATION_TYPE="Netdata Alarm"

###############################################################################
# RECIPIENTS PER ROLE

# -----------------------------------------------------------------------------
# generic system alarms
# CPU, disks, network interfaces, entropy, etc

role_recipients_email[sysadmin]="$MAIL_TO"

# -----------------------------------------------------------------------------
# DNS related alarms

role_recipients_email[domainadmin]="$MAIL_TO"

# -----------------------------------------------------------------------------
# database servers alarms
# mysql, redis, memcached, postgres, etc

role_recipients_email[dba]="$MAIL_TO"

# -----------------------------------------------------------------------------
# web servers alarms
# apache, nginx, lighttpd, etc

role_recipients_email[webmaster]="$MAIL_TO"

# -----------------------------------------------------------------------------
# proxy servers alarms
# squid, etc

role_recipients_email[proxyadmin]="$MAIL_TO"

# -----------------------------------------------------------------------------
# peripheral devices
# UPS, photovoltaics, etc

role_recipients_email[sitemgr]="$MAIL_TO"
EOF
