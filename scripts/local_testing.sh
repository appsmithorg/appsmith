#!/usr/bin/env bash
set -o errexit

display_help()
{
  echo "---------------------------------------------------------------------------------------"
  echo "Use this script to run a local instance of Appsmith on port 80."
  echo "The script will build all the artefacts required for a fat Docker container to come up."
  echo "If no argument is given, the build defaults to release branch."
  echo "---------------------------------------------------------------------------------------"
  echo
  echo "Syntax: $0 [-h] [branchName]"
  echo "options:"
  echo "h     Print this help"
  echo
}

pretty_print()
{
  echo "----------------"
  echo $1
  echo "----------------"
  echo
}

# Check whether user had supplied -h or --help. If yes display usage
if [[ ( $@ == "--help") ||  $@ == "-h" ]]
then 
  display_help
  exit 0
fi 

BRANCH=${1:-release}

pretty_print "Setting up instance to run on branch: $BRANCH"
cd "$(dirname "$0")"/..
git fetch origin $BRANCH
git checkout $BRANCH
git pull origin $BRANCH
pretty_print "Local branch is now up to date. Starting server build ..."

pushd app/server > /dev/null && ./build.sh -DskipTests > /dev/null && pretty_print "Server build successful. Starting client build ..."

popd
pushd app/client > /dev/null && yarn > /dev/null && yarn build > /dev/null && pretty_print "Client build successful. Starting RTS build ..."

popd
pushd app/rts > /dev/null && ./build.sh > /dev/null && pretty_print "RTS build successful. Starting Docker build ..."

popd
docker build -t appsmith/appsmith-ce:local-testing . > /dev/null && pretty_print "Docker image build successful. Triggering run now ..."

(docker stop appsmith || true) && (docker rm appsmith || true)
docker run -d --name appsmith -p 80:80 -v "$PWD/stacks:/appsmith-stacks" appsmith/appsmith-ce:local-testing && sleep 15 && pretty_print "Local instance is up! Open Appsmith at http://localhost! "