ARG BASE
FROM ${BASE}

ENV IN_DOCKER=1

# Add backend server - Application Layer
ARG JAR_FILE=./app/server/dist/server-*.jar
ARG PLUGIN_JARS=./app/server/dist/plugins/*.jar

ARG APPSMITH_CLOUD_SERVICES_BASE_URL
ENV APPSMITH_CLOUD_SERVICES_BASE_URL=${APPSMITH_CLOUD_SERVICES_BASE_URL}

ARG APPSMITH_SEGMENT_CE_KEY
ENV APPSMITH_SEGMENT_CE_KEY=${APPSMITH_SEGMENT_CE_KEY}

COPY deploy/docker/fs /

RUN <<END
  mkdir -p ./editor ./rts ./backend/plugins

  # Ensure all *.sh scripts are executable.
  find . -name node_modules -prune -or -type f -name '*.sh' -print -exec chmod +x '{}' ';'

  # Ensure all custom command-scripts have executable permission
  chmod +x /opt/bin/*
END

#Add the jar to the container
COPY ${JAR_FILE} backend/server.jar
COPY ${PLUGIN_JARS} backend/plugins/

# Add client UI - Application Layer
COPY ./app/client/build editor/

# Add RTS - Application Layer
COPY ./app/client/packages/rts/dist rts/

ENV PATH /opt/bin:/opt/appsmith/utils/node_modules/.bin:/opt/java/bin:/opt/node/bin:$PATH

RUN cd ./utils && npm install --only=prod && npm install --only=prod -g . && cd - \
  && chmod +x /opt/bin/* *.sh /watchtower-hooks/*.sh \
  # Disable setuid/setgid bits for the files inside container.
  && find / \( -path /proc -prune \) -o \( \( -perm -2000 -o -perm -4000 \) -print -exec chmod -s '{}' + \) || true \
  && mkdir -p /.mongodb/mongosh /appsmith-stacks \
  && chmod ugo+w /etc /appsmith-stacks \
  && chmod -R ugo+w /var/run /.mongodb /etc/ssl /usr/local/share

LABEL com.centurylinklabs.watchtower.lifecycle.pre-check=/watchtower-hooks/pre-check.sh
LABEL com.centurylinklabs.watchtower.lifecycle.pre-update=/watchtower-hooks/pre-update.sh

EXPOSE 80
EXPOSE 443
ENTRYPOINT [ "/opt/appsmith/entrypoint.sh" ]
HEALTHCHECK --interval=15s --timeout=15s --start-period=45s CMD "/opt/appsmith/healthcheck.sh"
CMD ["/usr/bin/supervisord", "-n"]
