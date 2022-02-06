#!/bin/bash

set -o nounset

mongo_root_user="$1"
mongo_root_password="$2"
mongo_database="$3"

cat <<EOF
version: "3.7"

services:
  nginx:
    image: index.docker.io/appsmith/appsmith-editor
    env_file: ./docker.env
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/nginx/app.conf.template:/nginx.conf.template
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    command: "/bin/sh -c 'while :; do sleep 6h & wait \$\${!}; nginx -s reload; done & /start-nginx.sh'"
    depends_on:
      - appsmith-internal-server
    labels:
      com.centurylinklabs.watchtower.enable: "true"
    networks:
      - appsmith
    restart: always

  certbot:
    image: certbot/certbot
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"
    networks:
      - appsmith
    restart: always

  appsmith-internal-server:
    image: index.docker.io/appsmith/appsmith-server
    env_file:
      - ./docker.env
      - ./encryption.env
    expose:
      - "8080"
    links:
      - mongo
    depends_on:
      - mongo
      - redis
    labels:
      com.centurylinklabs.watchtower.enable: "true"
    networks:
      - appsmith
    restart: always

  mongo:
    image: mongo:4.4.6
    expose:
      - "27017"
    env_file:
      - ./docker.env
    volumes:
      - ./data/mongo/db:/data/db
      - ./data/mongo/init.js:/docker-entrypoint-initdb.d/init.js:ro
    networks:
      - appsmith
    restart: always

  redis:
    image: redis
    expose:
      - "6379"
    networks:
      - appsmith
    restart: always

  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # Update check every hour.
    command: --schedule "0 0 * ? * *" --label-enable --cleanup
    networks:
      - appsmith
    restart: always

networks:
  appsmith:
    driver: bridge
EOF
