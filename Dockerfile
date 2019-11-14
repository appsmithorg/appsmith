#When you are building, name it appsmith-server which is how it is referenced in docker-compose.yml

FROM adoptopenjdk/openjdk11:alpine-jre

LABEL maintainer="tech@appsmith.com"

VOLUME /tmp

EXPOSE 8080

ARG JAR_FILE=./appsmith-server/target/server-1.0-SNAPSHOT.jar
ARG PLUGIN_JARS=./appsmith-plugins/*/target/*.jar

#Create the plugins directory
RUN mkdir -p /plugins

#Add the jar to the container. Always keep this at the end. This is to ensure that all the things that can be taken
#care of via the cache happens. The following statement would lead to copy because of change in hash value
COPY entrypoint.sh /entrypoint.sh
COPY ${JAR_FILE} server.jar
COPY ${PLUGIN_JARS} /plugins/

#Run the jar
ENTRYPOINT ["/bin/sh", "-c" , "/entrypoint.sh"]
