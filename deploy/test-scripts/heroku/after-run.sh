#!/bin/bash

# Destroy app
app_name=$(head -n 1 $CI_PROJECT_DIR/deploy/test-scripts/heroku/app_name.txt)

heroku apps:destroy --app=$app_name --confirm=$app_name

rm $CI_PROJECT_DIR/deploy/test-scripts/heroku/app_name.txt
rm $CI_PROJECT_DIR/deploy/test-scripts/heroku/domain.txt

# Remove heroku credential file
sudo rm ~/.netrc
