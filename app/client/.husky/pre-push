#!/bin/bash

echo "Pre push hook called"

# An example hook script to verify what is about to be pushed.  Called by "git
# push" after it has checked the remote status, but before anything has been
# pushed.  If this script exits with a non-zero status nothing will be pushed.
#
# This hook is called with the following parameters:
#
# $1 -- Name of the remote to which the push is being done
# $2 -- URL to which the push is being done
#
# If pushing without using a named remote those arguments will be equal.
#
# Information about the commits which are being pushed is supplied as lines to
# the standard input in the form:
#
#   <local ref> <local oid> <remote ref> <remote oid>

appsmith_ee_url="appsmith-ee.git"
appsmith_ce_url="appsmithorg/appsmith.git"

# Define the null SHA. 
null_sha="0000000000000000000000000000000000000000"

# Function to get list of files between two commits
do_commits_contain_ee_files() {
    # Store the commit hashes
    from_commit=$1
    to_commit=$2
    string_to_match="app/client/src/ee"
    
    # to_commit sha can be null if a branch is being pushed for the first to remote
    # In that case, we would need to compare the diff against a default branch, like release.
    if [ "$to_commit" == "$null_sha" ]; then
        echo "comparing changes against release"

        remote_name=$(git remote -v | grep -i $appsmith_ce_url | grep -i fetch | awk '{print $1}')
        echo "remote name is $remote_name"

        git fetch $remote_name release
        to_commit=$remote_name/release
    fi

    echo "to_commit in function is $to_commit"
    echo "from_commit is $from_commit"
    
    # Get the list of files between the two commits
    files=$(git diff --name-only $from_commit $to_commit)

    # Iterate over each file
    for file in $files; do
        # Check if the file path contains the string
        if [[ "$file" == *"$string_to_match"* ]]; then
            echo "File '$file' matches the string '$string_to_match'"
            return 0
        fi
    done
    return 1
}


remote="$1"
url="$2"

echo "URL is $url"
echo "remote is $remote"
echo "remote sha is $remote_sha"

if [[ "$url" == *"$appsmith_ee_url"* ]]; then
    echo "Hook invoked on EE repo. Ignoring pre-push hook checks"
    exit 0
fi

while read local_ref local_sha remote_ref remote_sha
do
    echo "pushing from $local_sha to $remote_sha"
    echo "local ref is " $local_ref
    echo "remote ref is " $remote_ref
    
    if [ "$local_sha" == "$null_sha" ]; then
        echo "Branch is being deleted. Allow push"
        exit 0
    fi

    if do_commits_contain_ee_files $local_sha $remote_sha
    then
        echo -e "Found EE changes in the commits\n"
        exit 1
    else
        echo -e "Didn't find ee changes in the commits\n"
        exit 0
    fi
done