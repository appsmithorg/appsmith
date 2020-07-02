FROM nginx:1.17.9-alpine

COPY ./build /var/www/appsmith

EXPOSE 80
COPY ./docker/templates/nginx-linux.conf.template /nginx.conf.template
COPY ./docker/start-nginx.sh /start-nginx.sh
CMD ["/start-nginx.sh"]
