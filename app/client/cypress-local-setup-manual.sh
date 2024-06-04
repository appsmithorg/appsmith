#!/bin/bash 

# This script is used to set up the cypress environment locally.

# Check if the container is running
if docker ps --format '{{.Names}}' | grep -w "appsmith" > /dev/null; then
  echo "Container 'appsmith' is running."
else
  read -rp  "Container 'appsmith' is not running. Do you still want to continue? (yes/no): " user_input
  # Convert user input to lowercase
  user_input=$(echo "$user_input" | tr '[:upper:]' '[:lower:]')
  case "$user_input" in
    yes|y)
        echo "Continuing without appsmith instance"
        ;;
    no|n)
        echo "Exiting"
        exit 1
        ;;
    *)
        echo "Invalid input. Please enter yes or no."
        exit 1
        ;;

    esac
fi

# Install cypress
echo "Installing Cypress.."
yarn install 2>&1 > /dev/null

# Please verify base url in cypress.config.ts
baseurl=$(grep "baseUrl" cypress.config.ts|cut -d '"' -f2)
echo "Base url is $baseurl. Please verify if it is correct. If not, please update it in cypress.config.ts file."

echo "Please update username and password in cypress.env.json file ex: \"env\": {
    \"USERNAME\": \"xxxxxx@appsmith.com\",
    \"PASSWORD\": \"xxxxxxxx\",
    \"TESTUSERNAME1\": \"viewerappsmith@mailinator.com\",
    \"TESTPASSWORD1\": \"xxxxx\",
    \"TESTUSERNAME2\": \"developerappsmith@mailinator.com\",
    \"TESTPASSWORD2\": \"xxxxx\"
      }"

echo "Please add APPSMITH_GIT_ROOT=./container-volumes/git-storage into server-side .env for running Git cases locally along with the server."

# Prompt the user for input
read -rp "Do you want install TED continue? (yes/no): " user_input

# Convert user input to lowercase
user_input=$(echo "$user_input" | tr '[:upper:]' '[:lower:]')

case "$user_input" in
    yes|y)
        echo "Installing TED"
        docker run --name ted -d --pull always -p 2022:22 -p 5001:5001 -p 3306:3306 -p 28017:27017 -p 5432:5432 -p 25:25 -p 4200:4200 appsmith/test-event-driver
        echo "Please check https://github.com/appsmithorg/TestEventDriver"
        ;;
    no|n)
        echo "Proceeding without TED"
        ;;
    *)
        echo "Invalid input. Please enter yes or no."
        exit 1
        ;;

esac

echo "Please start cypress using the command: npx cypress open"
echo "In order to run single spec, please use the command: npx cypress run --spec <specpath>"
echo "For more details check https://www.notion.so/appsmith/Run-Cypress-locally-23033565651344f78ea2c8be768004bf"
