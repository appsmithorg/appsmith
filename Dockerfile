ARG BASE
FROM gouthamappsmith/appsmith_base:0.0.1

ENV IN_DOCKER=1

ARG APPSMITH_CLOUD_SERVICES_BASE_URL
ENV APPSMITH_CLOUD_SERVICES_BASE_URL=${APPSMITH_CLOUD_SERVICES_BASE_URL}

ARG APPSMITH_SEGMENT_CE_KEY
ENV APPSMITH_SEGMENT_CE_KEY=${APPSMITH_SEGMENT_CE_KEY}

COPY deploy/docker/fs /

# Install git
RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN <<END
  if ! [ -f info.json ]; then
    echo "Missing info.json" >&2
    exit 1
  fi

  if ! [ -f server/mongo/server.jar -a -f server/pg/server.jar ]; then
    echo "Missing one or both server.jar files in the right place. Are you using the build script?" >&2
    exit 1
  fi
END

# Add client UI - Application Layer
COPY ./app/client/build editor/

# Add RTS - Application Layer
COPY ./app/client/packages/rts/dist rts/

ENV PATH /opt/bin:/opt/java/bin:/opt/node/bin:$PATH

RUN <<END
  set -o errexit

  # Make all `*.sh` files executable, excluding `node_modules`.
  find . \( -name node_modules -prune \) -o \( -type f -name '*.sh' \) -exec chmod +x '{}' +

  # Ensure all custom command-scripts have executable permission
  chmod +x /opt/bin/* /watchtower-hooks/*.sh

  # Disable setuid/setgid bits for the files inside container.
  find / \( -path /proc -prune \) -o \( \( -perm -2000 -o -perm -4000 \) -exec chmod -s '{}' + \) || true

  mkdir -p /.mongodb/mongosh /appsmith-stacks
  chmod ugo+w /etc /appsmith-stacks
  chmod -R ugo+w /var/run /.mongodb /etc/ssl /usr/local/share
END

LABEL com.centurylinklabs.watchtower.lifecycle.pre-check=/watchtower-hooks/pre-check.sh
LABEL com.centurylinklabs.watchtower.lifecycle.pre-update=/watchtower-hooks/pre-update.sh

EXPOSE 80
EXPOSE 443
ENTRYPOINT [ "/opt/appsmith/entrypoint.sh" ]
HEALTHCHECK --interval=15s --timeout=15s --start-period=45s CMD "/opt/appsmith/healthcheck.sh"
CMD ["/usr/bin/supervisord", "-n"]
