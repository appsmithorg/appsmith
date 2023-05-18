#!/bin/bash

cd ~
if [ ! -f "ngrok-v3-stable-linux-amd64.tgz" ]; then
        wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
        gunzip ngrok-v3-stable-linux-amd64.tgz
        tar -xvf ngrok-v3-stable-linux-amd64.tar
else
        echo "Starting ngrok"
fi

if [ -z "$1" ]; then
        read -p "Please enter ngrok token: " value
else
        value="$1"
fi
./ngrok config add-authtoken $value
./ngrok http 80
