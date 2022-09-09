FROM node:16.14.0

LABEL maintainer="tech@appsmith.com"

WORKDIR /app

COPY package.json dist ./

COPY node_modules ./node_modules

EXPOSE 8091

CMD ["node", "--require", "source-map-support/register", "server.js"]
