FROM ubuntu:20.04

LABEL maintainer="tech@appsmith.com"

# Set workdir to /opt/appsmith
WORKDIR /opt/appsmith

# The env variables are needed for Appsmith server to correctly handle non-roman scripts like Arabic.
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

# Update APT packages - Base Layer
RUN apt-get update \
  && apt-get upgrade --yes \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --yes \
    supervisor curl cron nfs-common nginx nginx-extras gnupg wget netcat openssh-client \
    gettext \
    python3-pip python3-venv git ca-certificates \
  && pip install --no-cache-dir git+https://github.com/coderanger/supervisor-stdout@973ba19967cdaf46d9c1634d1675fc65b9574f6e \
  && python3 -m venv --prompt certbot /opt/certbot/venv \
  && /opt/certbot/venv/bin/pip install --upgrade certbot setuptools pip \
  && ln -s /opt/certbot/venv/bin/certbot /usr/local/bin \
  && apt-get remove --yes git python3-pip python3-venv \
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
  # TODO: The release jdk-17.0.9+9.1 doesn't include Linux binaries, so this fails.
  #       Temporarily using hardcoded version in URL until we figure out a more elaborate/smarter solution.
  #&& version="$(curl --write-out '%{redirect_url}' 'https://github.com/adoptium/temurin17-binaries/releases/latest' | sed 's,.*jdk-,,')" \
  && version="17.0.9+9" \
  && curl --location --output /tmp/java.tar.gz "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-$version/OpenJDK17U-jdk_$(uname -m | sed s/x86_64/x64/)_linux_hotspot_$(echo $version | tr + _).tar.gz" \
  && tar -xzf /tmp/java.tar.gz -C /opt/java --strip-components 1

# Install NodeJS
RUN set -o xtrace \
  && mkdir -p /opt/node \
  && file="$(curl -sS 'https://nodejs.org/dist/latest-v18.x/' | awk -F\" '$2 ~ /linux-'"$(uname -m | sed 's/x86_64/x64/; s/aarch64/arm64/')"'.tar.gz/ {print $2}')" \
  && curl "https://nodejs.org/dist/latest-v18.x/$file" | tar -xz -C /opt/node --strip-components 1

# Install Caddy
RUN set -o xtrace \
  && mkdir -p /opt/caddy \
  && version="$(curl --write-out '%{redirect_url}' 'https://github.com/caddyserver/caddy/releases/latest' | sed 's,.*/v,,')" \
  && curl --location "https://github.com/caddyserver/caddy/releases/download/v$version/caddy_${version}_linux_$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/').tar.gz" \
  | tar -xz -C /opt/caddy

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

# Define volumes - Service Layer
VOLUME [ "/appsmith-stacks" ]

# ------------------------------------------------------------------------
ENV TMP="/tmp/appsmith"
ENV NGINX_WWW_PATH="$TMP/www"
ENV WWW_PATH="$TMP/www"
