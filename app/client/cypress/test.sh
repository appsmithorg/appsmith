#!/bin/bash

# By default we assume that the target for the CI is local
target=local

while :; do
    case $1 in
        -e|--env)
            if [ "$2" ]; then
                target=$2
                shift
            else
                die 'ERROR: "--env" requires a non-empty option argument. Allowed values local/ci'
            fi
            ;;
        --env=?*)
            target=${1#*=} # Delete everything up to "=" and assign the remainder.
            ;;
        *) # Default case: No more options, so break out of the loop.
          break
    esac
    shift
done

echo "Got the target: $target"
if [ "$target" == "ci" ]; then
    # On the CI server run the tests in parallel
    # This requires the projectId and the record_key to be configured in your environment variables. By default this is defined on the CI server
    echo "Got the Build ID: $BUILD_ID"
    $(npm bin)/cypress run --headless \
    --record --key "$CYPRESS_RECORD_KEY" --ci-build-id $BUILD_ID \
    --parallel --group "Electrons on Gitlab CI" \
    --spec "cypress/integration/Smoke_TestSuite/**/*.js"
else
    $(npm bin)/cypress run --headless --browser chromium --spec "cypress/integration/Smoke_TestSuite/**/*.js"
fi
