#!/bin/sh
(( ${#} > 0 )) || {
  echo 'DISCLAIMER: USE THIS SCRIPT AT YOUR OWN RISK!'
  echo 'THE AUTHOR TAKES NO RESPONSIBILITY FOR THE RESULTS OF THIS SCRIPT.'
  echo "Disclaimer aside, this worked for the author, for what that's worth."
  echo 'Press Control-C to quit now.'
  read
  echo 'Re-running the script with sudo.'
  echo 'You may be prompted for a password.'
  sudo ${0} sudo
  exit $?
}
# This will need to be executed as an Admin (maybe just use sudo).

for bom in org.nodejs.node.pkg.bom org.nodejs.pkg.bom; do

  receipt=/var/db/receipts/${bom}
  [ -e ${receipt} ] && {
    # Loop through all the files in the bom.
    lsbom -f -l -s -pf ${receipt} \
    | while read i; do
      # Remove each file listed in the bom.
      rm -v /usr/local/${i#/usr/local/}
    done
  }

done

# Remove directories related to node.js.
rm -vrf /usr/local/lib/node \
  /usr/local/lib/node_modules \
  /var/db/receipts/org.nodejs.*

exit 0
