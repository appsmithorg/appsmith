#!/usr/bin/env bash
set -o errexit

# check whether user had supplied -h or --help . If yes display usage
if [[ ( $@ == "--help") ||  $@ == "-h" ]]
then 
	echo "Usage: $0 [branchName]"
	exit 0
fi 

BRANCH=${1:-release}

echo "Setting up instance to run on branch: $BRANCH"
cd "$(dirname "$0")"/..
git fetch origin $BRANCH
git checkout $BRANCH
git pull origin $BRANCH
echo "Local branch is now up to date"

pushd app/server > /dev/null && ./build.sh -DskipTests > /dev/null && echo "Server build successful"

popd
pushd app/client > /dev/null && yarn > /dev/null && yarn build > /dev/null && echo "Client build successful"

popd
pushd app/rts > /dev/null && ./build.sh > /dev/null && echo "RTS build successful"

popd
docker build -t appsmith/appsmith-ce:local-testing . > /dev/null && echo "Docker image build successful. Triggering run now ..."

(docker stop appsmith || true) && (docker rm appsmith || true)
docker run -d --name appsmith -p 80:80 -v "$PWD/stacks:/appsmith-stacks" appsmith/appsmith-ce:local-testing && echo "Local instance is up! Open Appsmith at http://localhost! "