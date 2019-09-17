#When you are building, name it appsmith-server which is how it is referenced in docker-compose.yml

#FROM openjdk:11
FROM adoptopenjdk/openjdk11:alpine-slim

LABEL maintainer="tech@appsmith.com"

VOLUME /tmp

EXPOSE 8080

ARG JAR_FILE=appsmith-server/target/server-1.0-SNAPSHOT.jar

#Add the jar to the container. Always keep this at the end. This is to ensure that all the things that can be taken
#care of via the cache happens. The following statement would lead to copy because of change in hash value
ADD ${JAR_FILE} server.jar

#Run the jar
ENTRYPOINT ["java", "-Dspring.profiles.active=docker", "-jar", "/server.jar"]