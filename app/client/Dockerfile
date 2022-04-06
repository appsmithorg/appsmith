FROM nginx:1.20-alpine

COPY ./build /var/www/appsmith

EXPOSE 80

ENV APPSMITH_SERVER_PROXY_PASS="http://appsmith-internal-server:8080"

# This is the default nginx template file inside the container.
# This is replaced by the install.sh script during a deployment
# COPY ./docker/templates/nginx-app.conf.template /nginx.conf.template
COPY ./docker/templates/nginx-root.conf.template /nginx-root.conf.template

COPY ./docker/templates/nginx-app-http.conf.template /nginx-app-http.conf.template
COPY ./docker/templates/nginx-app-https.conf.template /nginx-app-https.conf.template

# This is the script that is used to start Nginx when the Docker container starts
COPY ./docker/start-nginx.sh /start-nginx.sh
CMD ["/start-nginx.sh"]
