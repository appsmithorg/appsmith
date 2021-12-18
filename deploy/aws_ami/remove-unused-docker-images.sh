#!/bin/bash

###############################################################
#  This script is used to remove all unused image in the AMI  #
###############################################################

# Remote all exited container
docker rm $(docker ps -q -f status=exited)

# Remote none tag images (image with tag <none>)
docker images | grep "<none>" | awk '{print $3}' |xargs docker rmi -f

# Remove all images that is not using by any running container
# note: docker ps --format {{.Image} -> List all images of running container then set it as grep pattern
docker images --format {{.Repository}}:{{.Tag}} | grep -vFf <(docker ps --format {{.Image}}) | xargs docker rmi -f
