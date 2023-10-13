FROM ubuntu:20.04

LABEL maintainer="tech@appsmith.com"

# Set workdir to /opt/appsmith
WORKDIR /opt/appsmith

# The env variables are needed for Appsmith server to correctly handle non-roman scripts like Arabic.
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

# Update APT packages - Base Layer
RUN set -o xtrace \
  && apt-get update \
  && apt-get upgrade --yes \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --yes \
    supervisor curl nfs-common gnupg wget netcat openssh-client \
    gettext \
    python3-pip git ca-certificates \
  && pip install --no-cache-dir git+https://github.com/coderanger/supervisor-stdout@973ba19967cdaf46d9c1634d1675fc65b9574f6e \
  && apt-get remove --yes git python3-pip \
  && apt-get autoremove --yes

# Install MongoDB v5.0.14, Redis, PostgreSQL v13
RUN curl --silent --show-error --location https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add - \
  && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list \
  && echo "deb http://apt.postgresql.org/pub/repos/apt $(grep CODENAME /etc/lsb-release | cut -d= -f2)-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list \
  && curl --silent --show-error --location https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && apt update \
  && apt-get install --no-install-recommends --yes mongodb-org redis postgresql-13 \
  && apt-get clean

# Install Java
RUN set -o xtrace \
  && mkdir -p /opt/java \
  # Assets from https://github.com/adoptium/temurin17-binaries/releases
  && version="$(curl --write-out '%{redirect_url}' 'https://github.com/adoptium/temurin17-binaries/releases/latest' | sed 's,.*jdk-,,')" \
  && curl --location --output /tmp/java.tar.gz "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-$version/OpenJDK17U-jdk_$(uname -m | sed s/x86_64/x64/)_linux_hotspot_$(echo $version | tr + _).tar.gz" \
  && tar -xzf /tmp/java.tar.gz -C /opt/java --strip-components 1

# Install NodeJS
RUN set -o xtrace \
  && mkdir -p /opt/node \
  && file="$(curl -sS 'https://nodejs.org/dist/latest-v18.x/' | awk -F\" '$2 ~ /linux-'"$(uname -m | sed 's/x86_64/x64/; s/aarch64/arm64/')"'.tar.gz/ {print $2}')" \
  && curl "https://nodejs.org/dist/latest-v18.x/$file" | tar -xz -C /opt/node --strip-components 1

# Clean up cache file - Service layer
RUN rm -rf \
  /root/.cache \
  /root/.npm \
  /root/.pip \
  /usr/local/share/doc \
  /usr/share/doc \
  /usr/share/man \
  /var/lib/apt/lists/* \
  /tmp/*

RUN mkdir -pv /opt/caddy \
  && curl --location 'https://github.com/caddyserver/caddy/releases/download/v2.7.4/caddy_2.7.4_linux_arm64.tar.gz' \
  | tar -xzf - -C /opt/caddy

# Define volumes - Service Layer
VOLUME [ "/appsmith-stacks" ]

# ------------------------------------------------------------------------
ENV TMP="/tmp/appsmith"
ENV NGINX_WWW_PATH="$TMP/www"

# Add backend server - Application Layer
ARG JAR_FILE=./app/server/dist/server-*.jar
ARG PLUGIN_JARS=./app/server/dist/plugins/*.jar

ARG APPSMITH_CLOUD_SERVICES_BASE_URL
ENV APPSMITH_CLOUD_SERVICES_BASE_URL=${APPSMITH_CLOUD_SERVICES_BASE_URL}

ARG APPSMITH_SEGMENT_CE_KEY
ENV APPSMITH_SEGMENT_CE_KEY=${APPSMITH_SEGMENT_CE_KEY}
#Create the plugins directory
RUN mkdir -p ./editor ./rts ./backend/plugins

COPY deploy/docker/fs /

#Add the jar to the container
COPY ${JAR_FILE} backend/server.jar
COPY ${PLUGIN_JARS} backend/plugins/

# Add client UI - Application Layer
COPY ./app/client/build editor/

# Add RTS - Application Layer
COPY ./app/client/packages/rts/dist rts/

ENV PATH /opt/appsmith/utils/node_modules/.bin:/opt/java/bin:/opt/node/bin:$PATH

RUN cd ./utils && npm install --only=prod && npm install --only=prod -g . && cd - \
  && chmod 0644 /etc/cron.d/* \
  && chmod +x entrypoint.sh renew-certificate.sh healthcheck.sh templates/nginx-app.conf.sh /watchtower-hooks/*.sh \
  # Disable setuid/setgid bits for the files inside container.
  && find / \( -path /proc -prune \) -o \( \( -perm -2000 -o -perm -4000 \) -print -exec chmod -s '{}' + \) || true \
  && node prepare-image.mjs

LABEL com.centurylinklabs.watchtower.lifecycle.pre-check=/watchtower-hooks/pre-check.sh
LABEL com.centurylinklabs.watchtower.lifecycle.pre-update=/watchtower-hooks/pre-update.sh

EXPOSE 80
EXPOSE 443
ENTRYPOINT [ "/opt/appsmith/entrypoint.sh" ]
HEALTHCHECK --interval=15s --timeout=15s --start-period=45s CMD "/opt/appsmith/healthcheck.sh"
CMD ["/usr/bin/supervisord", "-n"]
