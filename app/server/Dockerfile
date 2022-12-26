#When you are building, name it appsmith-server which is how it is referenced in docker-compose.yml

FROM eclipse-temurin:17-jdk-alpine as jdk-image

RUN ${JAVA_HOME}/bin/jlink --module-path jmods --add-modules jdk.jcmd --output /jcmd

FROM eclipse-temurin:17-jre-alpine

COPY --from=jdk-image /jcmd /jcmd

LABEL maintainer="tech@appsmith.com"

VOLUME /tmp

EXPOSE 8080

ARG JAR_FILE=./dist/server-*.jar
ARG PLUGIN_JARS=./dist/plugins/*.jar
ARG APPSMITH_SEGMENT_CE_KEY
ENV APPSMITH_SEGMENT_CE_KEY=${APPSMITH_SEGMENT_CE_KEY}

#Create the plugins directory
RUN mkdir -p /plugins

# Add entrypoint script and make it executable.
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

#Add the jar to the container. Always keep this at the end. This is to ensure that all the things that can be taken
#care of via the cache happens. The following statement would lead to copy because of change in hash value
COPY ${JAR_FILE} server.jar
COPY ${PLUGIN_JARS} /plugins/
HEALTHCHECK --interval=15s --timeout=15s --start-period=15s --retries=3 CMD wget --no-verbose --spider http://localhost:8080/api/v1/users/me/ || exit 1
ENTRYPOINT ["/entrypoint.sh"]