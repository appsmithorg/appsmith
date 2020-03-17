FROM node:10.19-alpine as build-deps

WORKDIR /usr/src/app

ARG REACT_APP_ENVIRONMENT="DEVELOPMENT"
ARG GIT_SHA=""

ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}
ENV REACT_APP_BASE_URL=${REACT_APP_BASE_URL}
ENV GIT_SHA=${GIT_SHA}

COPY package.json yarn.lock ./
COPY . ./
RUN yarn install --production && yarn build

# Use the output from the previous Docker build to create the nginx container
FROM nginx:1.17.9-alpine as final-image
COPY --from=build-deps /usr/src/app/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-deps /usr/src/app/build /var/www/appsmith

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
