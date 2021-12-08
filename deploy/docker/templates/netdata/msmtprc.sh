#!/bin/bash

set -o nounset

MAIL_HOST="$1"
MAIL_PORT="$2"
MAIL_USERNAME="$3"
MAIL_PASSWORD="$4"

cat <<EOF
defaults 
tls on
tls_starttls on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile ~/.msmtp.log

account default
host $MAIL_HOST
port $MAIL_PORT
protocol smtp
auth on
user $MAIL_USERNAME
password $MAIL_PASSWORD
EOF
