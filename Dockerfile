# Base stage
ARG BASE
FROM ${BASE} AS base 

# Add backend server - Application Layer
ARG JAR_FILE=./app/server/dist/server-*.jar
ARG PLUGIN_JARS=./app/server/dist/plugins/*.jar

ARG APPSMITH_CLOUD_SERVICES_BASE_URL
ENV APPSMITH_CLOUD_SERVICES_BASE_URL=${APPSMITH_CLOUD_SERVICES_BASE_URL}

ARG APPSMITH_SEGMENT_CE_KEY
ENV APPSMITH_SEGMENT_CE_KEY=${APPSMITH_SEGMENT_CE_KEY}

# Create the plugins directory
RUN mkdir -p ./editor ./rts ./backend/plugins

COPY deploy/docker/fs /
# Add the jar to the container
COPY ${JAR_FILE} backend/server.jar
COPY ${PLUGIN_JARS} backend/plugins/

# Add client UI - Application Layer
COPY ./app/client/build editor/

# Add RTS - Application Layer
COPY ./app/client/packages/rts/dist rts/

# Copy package.json and optionally package-lock.json
COPY app/client/package*.json ./editor/

ENV PATH /appsmith/utils/node_modules/.bin:/java/bin:/opt/node/bin:$PATH

# Install dependencies using npm install (locally to regenerate package-lock.json)
# Check if package-lock.json exists and use it if present
RUN if [ -f package-lock.json ]; then \
      echo "Using package-lock.json"; \
      yarn ci; \
    else \
      echo "Warning: package-lock.json not found, using package.json"; \
      yarn install; \
    fi

# Additional setup and permissions
RUN cd ./utils && npm install --only=prod && npm install --only=prod -g . && cd - \
  && chmod +x /deploy/docker/fs/entrypoint.sh \
  && chmod +x *.sh /watchtower-hooks/*.sh \
  # Disable setuid/setgid bits for the files inside container.
  && find / \( -path /proc -prune \) -o \( \( -perm -2000 -o -perm -4000 \) -print -exec chmod -s '{}' + \) || true \
  && mkdir -p /.mongodb/mongosh /appsmith-stacks \
  && chmod ugo+w /etc /appsmith-stacks \
  && chmod -R ugo+w /var/run /.mongodb /etc/ssl /usr/local/share

LABEL com.centurylinklabs.watchtower.lifecycle.pre-check=/watchtower-hooks/pre-check.sh
LABEL com.centurylinklabs.watchtower.lifecycle.pre-update=/watchtower-hooks/pre-update.sh

EXPOSE 80
EXPOSE 443
# ENTRYPOINT [ "/opt/appsmith/entrypoint.sh" ]
HEALTHCHECK --interval=15s --timeout=15s --start-period=45s CMD "/opt/appsmith/healthcheck.seh"
CMD ["/usr/bin/supervisord", "-n"]
