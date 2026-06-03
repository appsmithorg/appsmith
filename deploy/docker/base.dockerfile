FROM redis:7.4.8 AS redis-source

FROM caddy:builder-alpine AS caddybuilder

# caddy:builder-alpine sets XCADDY_SETCAP=1, which calls setcap on the output
# binary. Linux refuses to execve a file with file capabilities when the
# calling process's bounding set has those caps dropped (e.g. Kubernetes
# restricted profile with cap-drop ALL). The image binds low ports via
# net.ipv4.ip_unprivileged_port_start, so the setcap is unnecessary.
#
# --replace pins mitigate x/crypto and x/net CVEs from the May 22, 2026
# coordinated Go security disclosure. None are reachable in Caddy's HTTP
# path (the x/crypto CVEs are all in the SSH subsystem), but scanners
# flag the embedded library version regardless.
RUN XCADDY_SETCAP=0 xcaddy build \
  --with github.com/mholt/caddy-ratelimit \
  --replace golang.org/x/crypto=golang.org/x/crypto@v0.52.0 \
  --replace golang.org/x/net=golang.org/x/net@v0.55.0

# Build MongoDB database tools from source with pinned x/crypto and x/net
# Apt-installed mongodb-database-tools ships x/crypto@0.45.0 with no upstream fix available.
FROM golang:1.26.4-alpine AS mongotoolsbuilder

RUN apk add --no-cache git make bash
WORKDIR /tmp/mongo-tools
RUN git clone --depth 1 --branch 100.17.0 https://github.com/mongodb/mongo-tools.git .
RUN go mod edit -require=golang.org/x/crypto@v0.52.0 \
               -require=golang.org/x/net@v0.55.0 && \
    go mod tidy && \
    go mod vendor
ENV GOROOT=/usr/local/go
RUN ./make build -pkgs=mongodump,mongorestore,bsondump,mongoexport,mongofiles,mongoimport,mongostat,mongotop && \
    for tool in mongodump mongorestore bsondump mongoexport mongofiles mongoimport mongostat mongotop; do \
      test -f /tmp/mongo-tools/bin/$tool || (echo "Missing binary: $tool" && exit 1); \
    done

FROM ubuntu:24.04

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
    libnss-wrapper \
    software-properties-common \
    git \
  && add-apt-repository -y ppa:git-core/ppa \
  # Install MongoDB v7, PostgreSQL v14
  # Note: MongoDB 7.0 does not publish apt packages for Ubuntu 24.04 (noble) yet, so we use the jammy (22.04) packages — same pattern used for the previous 6.0 install.
  && curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg \
  && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
  && echo "deb http://apt.postgresql.org/pub/repos/apt $(grep CODENAME /etc/lsb-release | cut -d= -f2)-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list \
  && curl --silent --show-error --location https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && apt update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --yes \
    mongodb-org-server mongodb-org-mongos mongodb-mongosh \
    postgresql-14 \
    git tar zstd openssh-client \
  && apt-get clean \
  && rm -rf \
    /root/.cache \
    /root/.npm \
    /usr/local/share/doc \
    /usr/share/doc \
    /usr/share/man \
    /var/lib/apt/lists/* \
    /tmp/*

# Install Redis from official image to avoid false positive CVE reports from dpkg-based scanners.
COPY --from=redis-source /usr/local/bin/redis-server /usr/local/bin/redis-server
COPY --from=redis-source /usr/local/bin/redis-cli /usr/local/bin/redis-cli

# Install MongoDB database tools built from source with patched x/crypto and x/net
COPY --from=mongotoolsbuilder /tmp/mongo-tools/bin/ /usr/bin/

ENV PATH="/usr/lib/postgresql/14/bin:${PATH}"

# Install Java
RUN set -o xtrace \
  && mkdir -p /opt/java \
  && arch="$(uname -m | sed 's/x86_64/x64/; s/aarch64/aarch64/')" \
  && curl --location "https://api.adoptium.net/v3/binary/latest/25/ga/linux/${arch}/jdk/hotspot/normal/eclipse" \
  | tar -xz -C /opt/java --strip-components 1

# Install NodeJS
RUN <<END
  set -eo xtrace

  mkdir -p /opt/node
  arch="$(uname -m | sed 's/x86_64/x64/; s/aarch64/arm64/')"

  curl -LOsS "https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt"
  filename="$(awk '/linux-'"$arch"'.tar.gz/ {print $2}' SHASUMS256.txt)"

  curl -LOsS "https://nodejs.org/dist/latest-v24.x/$filename"
  grep "$filename" SHASUMS256.txt | sha256sum -c -
  tar -xzf "$filename" -C /opt/node --strip-components 1

  rm "$filename" SHASUMS256.txt
END

# Install Caddy (built with rate-limit module via xcaddy; the module is inert unless configured)
RUN mkdir -p /opt/caddy
COPY --from=caddybuilder /usr/bin/caddy /opt/caddy/caddy

VOLUME [ "/appsmith-stacks" ]

ENV TMP="/tmp/appsmith"
ENV WWW_PATH="$TMP/www"

# libnss_wrapper.so is written to an architecture-specific directory, so we symlink to it in a common location to make it easier to activate
ENV NSS_WRAPPER_SYMLINK=/usr/local/lib/libnss_wrapper.so
RUN NSS_WRAPPER_LIB=$(find /usr/lib -name libnss_wrapper.so -type f 2>/dev/null | head -n1) && \
    ln -sf "$NSS_WRAPPER_LIB" $NSS_WRAPPER_SYMLINK
# these env vars need to be set for NSS Wrapper to work but don't matter until LD_PRELOAD is set which is optionally done at runtime
ENV NSS_WRAPPER_PASSWD="${TMP}/passwd"
ENV NSS_WRAPPER_GROUP="${TMP}/group"
