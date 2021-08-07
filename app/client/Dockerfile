FROM nginx:1.21-alpine

COPY ./build /var/www/appsmith

EXPOSE 80
# This is the default nginx template file inside the container. 
# This is replaced by the install.sh script during a deployment
COPY ./docker/templates/nginx-app.conf.template /nginx.conf.template
COPY ./docker/templates/nginx-root.conf.template /nginx-root.conf.template
# This is the script that is used to start Nginx when the Docker container starts
COPY ./docker/start-nginx.sh /start-nginx.sh
CMD ["/start-nginx.sh"]
