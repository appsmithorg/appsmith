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
    supervisor curl cron nfs-common certbot nginx gnupg wget netcat openssh-client \
    software-properties-common gettext \
    python3-pip python3-requests python-setuptools git ca-certificates-java \
  && wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add - \
  && echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list \
  && apt-get update && apt-get install --no-install-recommends --yes temurin-17-jdk \
  && pip install --no-cache-dir git+https://github.com/coderanger/supervisor-stdout@973ba19967cdaf46d9c1634d1675fc65b9574f6e \
  && apt-get remove --yes git python3-pip

# Install MongoDB v5.0.14, Redis, NodeJS - Service Layer, PostgreSQL v13
RUN curl --silent --show-error --location https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add - \
  && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list \
  && curl --silent --show-error --location https://deb.nodesource.com/setup_16.x | bash - \
  && echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list \
  && curl --silent --show-error --location https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \ 
  && apt update \
  && apt-get install --no-install-recommends --yes mongodb-org=5.0.14 nodejs redis build-essential postgresql-13 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

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
# Add backend server - Application Layer
ARG JAR_FILE=./app/server/dist/server-*.jar
ARG PLUGIN_JARS=./app/server/dist/plugins/*.jar
ARG APPSMITH_SEGMENT_CE_KEY
ENV APPSMITH_SEGMENT_CE_KEY=${APPSMITH_SEGMENT_CE_KEY}
#Create the plugins directory
RUN mkdir -p ./backend ./editor ./rts ./backend/plugins ./templates ./utils

#Add the jar to the container
COPY ${JAR_FILE} backend/server.jar
COPY ${PLUGIN_JARS} backend/plugins/

# Add client UI - Application Layer
COPY ./app/client/build editor/

# Add RTS - Application Layer
COPY ./app/client/packages/rts/package.json ./app/client/packages/rts/dist rts/

# Nginx, MongoDB and PostgreSQL data config template - Configuration layer
COPY ./deploy/docker/templates/nginx/* \
  ./deploy/docker/templates/docker.env.sh \
  ./deploy/docker/templates/mockdb_postgres.sql \
  ./deploy/docker/templates/users_postgres.sql \
  ./deploy/docker/templates/appsmith_starting.html \
  ./deploy/docker/templates/appsmith_initializing.html \
  templates/

# Add bootstrapfile
COPY ./deploy/docker/entrypoint.sh ./deploy/docker/scripts/* ./

# Add util tools
COPY ./deploy/docker/utils ./utils
RUN cd ./utils && npm install && npm install -g .

# Add process config to be run by supervisord
COPY ./deploy/docker/templates/supervisord.conf /etc/supervisor/supervisord.conf
COPY ./deploy/docker/templates/supervisord/ templates/supervisord/

# Add defined cron job
COPY ./deploy/docker/templates/cron.d /etc/cron.d/
RUN chmod 0644 /etc/cron.d/*

RUN chmod +x entrypoint.sh renew-certificate.sh healthcheck.sh

# Disable setuid/setgid bits for the files inside container.
RUN find / \( -path /proc -prune \) -o \( \( -perm -2000 -o -perm -4000 \) -print -exec chmod -s '{}' + \) || true

# Update path to load appsmith utils tool as default
ENV PATH /opt/appsmith/utils/node_modules/.bin:$PATH
LABEL com.centurylinklabs.watchtower.lifecycle.pre-check=/watchtower-hooks/pre-check.sh
LABEL com.centurylinklabs.watchtower.lifecycle.pre-update=/watchtower-hooks/pre-update.sh
COPY ./deploy/docker/watchtower-hooks /watchtower-hooks
RUN chmod +x /watchtower-hooks/pre-check.sh
RUN chmod +x /watchtower-hooks/pre-update.sh


EXPOSE 80
EXPOSE 443
ENTRYPOINT [ "/opt/appsmith/entrypoint.sh" ]
HEALTHCHECK --interval=15s --timeout=15s --start-period=45s CMD "/opt/appsmith/healthcheck.sh"
CMD ["/usr/bin/supervisord", "-n"]
