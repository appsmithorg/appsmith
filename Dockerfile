FROM debian:buster

LABEL maintainer="tech@appsmith.com"

# Set workdir to /opt/appsmith
WORKDIR /opt/appsmith

# Update APK packages - Base Layer
RUN apt-get update && apt-get install --no-install-recommends -y \
	supervisor curl cron certbot nginx gnupg \
	redis wget gettext openjdk-11-jre \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Install MongoDB v4.0.5, Redis - Service Layer
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ]http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list \
	&& apt-get remove wget -y 

# Install node v14 - Service Layer
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
	&& apt-get -y install --no-install-recommends -y mongodb-org=4.4.6 nodejs \
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
ARG JAR_FILE=./app/server/appsmith-server/target/server-*.jar
ARG PLUGIN_JARS=./app/server/appsmith-plugins/*/target/*.jar
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
COPY ./app/rts/package.json ./app/rts/dist/* rts/
COPY ./app/rts/node_modules rts/node_modules

# Nginx & MongoDB config template - Configuration layer
COPY ./deploy/fat_container/templates/nginx_app.conf.sh ./deploy/fat_container/templates/mongo-init.js.sh ./deploy/fat_container/templates/docker.env.sh templates/

# Add bootstrapfile
COPY ./deploy/fat_container/entrypoint.sh ./deploy/fat_container/scripts/* ./

# Add uitl tools
COPY ./deploy/fat_container/utils ./utils
RUN cd ./utils && npm install && npm install -g .

# Add process config to be run by supervisord
COPY ./deploy/fat_container/templates/supervisord.conf /etc/supervisor/supervisord.conf
COPY ./deploy/fat_container/templates/supervisord/ templates/supervisord/

# Add defined cron job
COPY ./deploy/fat_container/templates/cron.d /etc/cron.d/
RUN chmod 0644 /etc/cron.d/*

RUN chmod +x entrypoint.sh renew-certificate.sh

# Update path to load appsmith utils tool as default
ENV PATH /opt/appsmith/utils/node_modules/.bin:$PATH

EXPOSE 80
EXPOSE 443
EXPOSE 9001
ENTRYPOINT [ "/opt/appsmith/entrypoint.sh" ]
CMD ["/usr/bin/supervisord" ,"-n"]