#!/usr/bin/env bash
set -o errexit

display_help()
{
  echo "---------------------------------------------------------------------------------------"
  echo "Use this script to run a local instance of Appsmith on port 80."
  echo "The script will build all the artefacts required for a fat Docker container to come up."
  echo "If no argument is given, the build defaults to release branch."
  echo "If --local or -l is passed, it will build with local changes"
  echo "---------------------------------------------------------------------------------------"
  echo
  echo "Syntax: $0 [-h] [-l] [-r [remote_url]] [branch_name] [cs_url]"
  echo "options:"
  echo "-h     			Print this help"
  echo "-l or --local    	Use the local codebase and not git"
  echo "-r or --remote    	Use the branch from a remote repository"
  echo "For more info please check: https://www.notion.so/appsmith/Test-an-Appsmith-branch-locally-c39ad68aea0d42bf94a149ea22e86820#9cee16c7e2054b5980513ec6f351ace2"
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

LOCAL=false
if [[ ($1 == "--local" || $1 == "-l")]]
then
  LOCAL=true
fi

REMOTE=false
if [[ ($1 == "--remote" || $1 == "-r")]]
then
  REMOTE=true
fi

if [[ ($LOCAL == true) ]]
then
  pretty_print "Setting up instance with local changes"
  BRANCH=release
  cs_url=$2
elif [[ ($REMOTE == true) ]]
then
  pretty_print "Setting up instance with remote repository branch ..."
  REMOTE_REPOSITORY_URL=$2
  REMOTE_BRANCH=$3
  pretty_print "Please ignore if the following error occurs: remote remote_origin_for_local_test already exists."
  git remote add remote_origin_for_local_test $REMOTE_REPOSITORY_URL || git remote set-url remote_origin_for_local_test $REMOTE_REPOSITORY_URL
  git fetch remote_origin_for_local_test
  git checkout $REMOTE_BRANCH
  git pull remote_origin_for_local_test $REMOTE_BRANCH
else
  BRANCH=$1
  cs_url=$2
  pretty_print "Setting up instance to run on branch: $BRANCH"
  cd "$(dirname "$0")"/..
  git fetch origin $BRANCH
  git checkout $BRANCH
  git pull origin $BRANCH
  pretty_print "Local branch is now up to date. Starting server build ..."
fi

edition=ce
if [[ "$(git remote get-url origin)" == *"/appsmith-ee"* ]]; then
  edition=ee
fi

pretty_print "Starting server build ..."

pushd app/server > /dev/null
if ! ./build.sh -DskipTests > /dev/null; then
  echo Server build failed >&2
  exit 1
fi
popd
./scripts/prepare_server_artifacts.sh
pretty_print "Server build successful. Starting client build ..."

pushd app/client > /dev/null
yarn > /dev/null
if ! yarn build > /dev/null; then
  echo Client build failed >&2
  exit 1
fi
pretty_print "Client build successful. Starting RTS build ..."

popd
pushd app/client/packages/rts/ > /dev/null
if ! ./build.sh > /dev/null; then
  echo RTS build failed >&2
  exit 1
fi
pretty_print "RTS build successful. Starting Docker build ..."

popd
bash "$(dirname "$0")/generate_info_json.sh"
docker build -t appsmith/appsmith-ce:local-testing \
  --build-arg BASE="appsmith/base-$edition:release" \
  --build-arg APPSMITH_CLOUD_SERVICES_BASE_URL="${cs_url:-https://release-cs.appsmith.com}" \
  . \
  > /dev/null
pretty_print "Docker image build successful. Triggering run now ..."

(docker stop appsmith || true) && (docker rm appsmith || true)
docker run -d --name appsmith -p 80:80 -v "$PWD/stacks:/appsmith-stacks" appsmith/appsmith-ce:local-testing && sleep 15 && pretty_print "Local instance is up! Open Appsmith at http://localhost! "
