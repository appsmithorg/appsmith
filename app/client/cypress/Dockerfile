#ARG CHROME_VERSION="126.0.6478.114-1"
ARG YARN_VERSION='1.22.22'
ARG NODE_VERSION='20.11.1'
ARG CYPRESS_VERSION='13.5.1'
FROM cypress/factory:4.0.2

RUN apt update && apt install -y chromium

ENTRYPOINT ["yarn", "snapshot:customer-functional"]
