#!/bin/bash

generate_random_string() {
    # Picked up the following method of generation from : https://gist.github.com/earthgecko/3089509
    LC_CTYPE=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 13 | head -n 1
}

default_user_name="appsmith@example.com"
default_user_password=$(generate_random_string)

echo "${default_user_name}:${default_user_password}" > /home/ubuntu/appsmith/credential

echo -e "\n***************************************************\n*     Default username : $default_user_name     *\n*     Default password : $default_user_password            *\n***************************************************\n" >/dev/console
 
