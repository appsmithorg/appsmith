FROM openjdk:11 as javabuild

COPY app/server/ /app

WORKDIR /app

RUN apt-get update;apt-get install -y maven rsync; apt-get clean; rm -rf /var/lib/apt/lists/*

RUN ./build.sh -DskipTests

FROM node:14 as rtsbuild

COPY app/rts /app

WORKDIR /app

RUN yarn install --frozen-lockfile

RUN npx tsc

FROM node:14 as clientbuild

COPY app/client /app

COPY .git /app

WORKDIR /app

RUN yarn install; yarn build

RUN mkdir /artifacts ; cp -r build /artifacts/

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
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
    supervisor curl cron certbot nginx gnupg wget netcat openssh-client \
    software-properties-common gettext openjdk-11-jre \
    python3-pip python-setuptools git \
  && add-apt-repository ppa:redislabs/redis \
  && pip install --no-cache-dir git+https://github.com/coderanger/supervisor-stdout@973ba19967cdaf46d9c1634d1675fc65b9574f6e \
  && apt-get remove -y git python3-pip \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install MongoDB v4.0.5, Redis, NodeJS - Service Layer
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ]http://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list \
  && apt-get remove wget -y
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
  && apt-get -y install --no-install-recommends -y mongodb-org=4.4.6 nodejs redis build-essential \
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
COPY --from=javabuild /app/dist/ /opt/appsmith/app/server/dist/

COPY --from=rtsbuild /app/package.json /opt/appsmith/rts/
COPY --from=rtsbuild /app/dist/* /opt/appsmith/rts/
COPY --from=rtsbuild /app/node_modules /opt/appsmith/rts/node_modules

ARG JAR_FILE=/opt/appsmith/app/server/dist/server-*.jar
ARG PLUGIN_JARS=/opt/appsmith/app/server/dist/plugins/*.jar
ARG APPSMITH_SEGMENT_CE_KEY
ENV APPSMITH_SEGMENT_CE_KEY=${APPSMITH_SEGMENT_CE_KEY}

#Create the plugins directory
RUN mkdir -p backend editor rts backend/plugins templates utils

#Add the jar to the container
RUN mv ${JAR_FILE} backend/server.jar
RUN mv ${PLUGIN_JARS} backend/plugins/

# Add client UI - Application Layer
COPY --from=clientbuild /artifacts/build editor/

# Nginx & MongoDB config template - Configuration layer
COPY ./deploy/docker/templates/nginx/* \
  ./deploy/docker/templates/mongo-init.js.sh\
  ./deploy/docker/templates/docker.env.sh \
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

RUN chmod +x entrypoint.sh renew-certificate.sh

# Update path to load appsmith utils tool as default
ENV PATH /opt/appsmith/utils/node_modules/.bin:$PATH

EXPOSE 80
EXPOSE 443
ENTRYPOINT [ "/opt/appsmith/entrypoint.sh" ]
CMD ["/usr/bin/supervisord", "-n"]
