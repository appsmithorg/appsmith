FROM caddy:builder-alpine AS caddybuilder

RUN xcaddy build \
  --with github.com/mholt/caddy-ratelimit

FROM ubuntu:20.04

LABEL maintainer="tech@appsmith.com"

WORKDIR /opt/appsmith

# The env variables are needed for Appsmith server to correctly handle non-roman scripts like Arabic.
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Install dependency packages
RUN set -o xtrace \
  && apt-get update \
  && apt-get upgrade --yes \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --yes \
    supervisor curl nfs-common gnupg \
    gettext \
    ca-certificates \
  # Install MongoDB v5, Redis, PostgreSQL
  && curl --silent --show-error --location https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add - \
  && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list \
  && echo "deb http://apt.postgresql.org/pub/repos/apt $(grep CODENAME /etc/lsb-release | cut -d= -f2)-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list \
  && curl --silent --show-error --location https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && apt update \
  && apt-get install --no-install-recommends --yes mongodb-org redis postgresql-15 \
  && apt-get clean

ENV PATH="/usr/lib/postgresql/15/bin:${PATH}"

# Install Java
RUN set -o xtrace \
  && mkdir -p /opt/java \
  # Assets from https://github.com/adoptium/temurin17-binaries/releases
  # TODO: The release jdk-17.0.9+9.1 doesn't include Linux binaries, so this fails.
  #       Temporarily using hardcoded version in URL until we figure out a more elaborate/smarter solution.
  #&& version="$(curl --write-out '%{redirect_url}' 'https://github.com/adoptium/temurin17-binaries/releases/latest' | sed 's,.*jdk-,,')" \
  && version="17.0.9+9" \
  && curl --location "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-$version/OpenJDK17U-jdk_$(uname -m | sed s/x86_64/x64/)_linux_hotspot_$(echo $version | tr + _).tar.gz" \
  | tar -xz -C /opt/java --strip-components 1

# Install NodeJS
RUN <<END
  set -eo xtrace

  mkdir -p /opt/node
  arch="$(uname -m | sed 's/x86_64/x64/; s/aarch64/arm64/')"

  curl -LOsS "https://nodejs.org/dist/latest-v20.x/SHASUMS256.txt"
  filename="$(awk '/linux-'"$arch"'.tar.gz/ {print $2}' SHASUMS256.txt)"

  curl -LOsS "https://nodejs.org/dist/latest-v20.x/$filename"
  grep "$filename" SHASUMS256.txt | sha256sum -c -
  tar -xzf "$filename" -C /opt/node --strip-components 1

  rm "$filename" SHASUMS256.txt
END

# Install Caddy
RUN set -o xtrace \
  && mkdir -p /opt/caddy \
  && version="$(curl --write-out '%{redirect_url}' 'https://github.com/caddyserver/caddy/releases/latest' | sed 's,.*/v,,')" \
  && curl --location "https://github.com/caddyserver/caddy/releases/download/v$version/caddy_${version}_linux_$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/').tar.gz" \
  | tar -xz -C /opt/caddy

RUN mv /opt/caddy/caddy /opt/caddy/caddy_vanilla

COPY --from=caddybuilder /usr/bin/caddy /opt/caddy/caddy

# Clean up
RUN rm -rf \
  /root/.cache \
  /root/.npm \
  /usr/local/share/doc \
  /usr/share/doc \
  /usr/share/man \
  /var/lib/apt/lists/* \
  /tmp/*

VOLUME [ "/appsmith-stacks" ]

ENV TMP="/tmp/appsmith"
ENV WWW_PATH="$TMP/www"
