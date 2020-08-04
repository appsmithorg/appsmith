#!/bin/sh

if [ ! -f docker-compose.yml ]; then
    touch docker-compose.yml
fi

cat >| docker-compose.yml  << EOF
version: "3.7"

services:
  nginx:
    image: appsmith/appsmith-editor
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
    image: appsmith/appsmith-server:latest
    env_file:
      - ./docker.env
      - ./encryption.env
    expose:
      - "8080"
    links:
      - mongo
    depends_on:
      - mongo
    networks:
      - appsmith

  mongo:
    image: mongo
    expose:
      - "27017"
    environment:
      - MONGO_INITDB_DATABASE=appsmith
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

networks:
  appsmith:
    driver: bridge

EOF
