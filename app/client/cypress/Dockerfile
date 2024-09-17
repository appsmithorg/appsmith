#ARG CHROME_VERSION="126.0.6478.114-1"
ARG YARN_VERSION='1.22.22'
ARG NODE_VERSION='20.13.1'
ARG CYPRESS_VERSION='13.13.0'
FROM cypress/factory:4.0.2

# Install chromium in this way since there is no browsers in the docker container for the arm64 architecture
# https://github.com/cypress-io/cypress-docker-images/issues/695
RUN apt update && apt install -y chromium

ENTRYPOINT ["yarn", "cypress:snapshot"]
