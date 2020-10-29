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

  certbot:
    image: certbot/certbot
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"
    networks:
      - appsmith

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

  mongo:
    image: mongo
    expose:
      - "27017"
    environment:
      - MONGO_INITDB_DATABASE=$mongo_database
      - MONGO_INITDB_ROOT_USERNAME=$mongo_root_user
      - MONGO_INITDB_ROOT_PASSWORD=$mongo_root_password
    volumes:
      - ./data/mongo/db:/data/db
      - ./data/mongo/init.js:/docker-entrypoint-initdb.d/init.js:ro
    networks:
      - appsmith

  redis:
    image: redis
    expose:
      - "6379"
    networks:
      - appsmith

  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # Update check interval in seconds.
    command: --interval 300 --label-enable
    networks:
      - appsmith

networks:
  appsmith:
    driver: bridge
EOF
