set -o errexit
set -o xtrace

apt-get update --yes

time apt-get install -y maven
