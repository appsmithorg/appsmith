FROM node:lts-alpine

RUN apk add --no-cache bash caddy \
  && apk add --no-cache hurl mkcert --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/ \
  && mkcert -install

WORKDIR /code

ENTRYPOINT [ "bash", "entrypoint.sh" ]
