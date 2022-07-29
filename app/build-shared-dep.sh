#!/bin/bash
echo "*******************************************";
echo $'\e[36m'Bundling Shared Dependencies$'\e[0m';
echo "*******************************************";
cd ../shared;
APPSMITH_SHARED_DIR=$(pwd);
for dir in `ls`; 
  do
    cd $APPSMITH_SHARED_DIR/$dir;
    yarn unlink;
    yarn run link-package;
  done
echo "*******************************************";
echo $'\e[32m'Done Bundling Shared Dependencies ✔$'\e[0m';
echo "*******************************************";