FROM nginx:1.17.9-alpine

COPY ./build /var/www/appsmith
RUN ls -al /var/www/appsmith

EXPOSE 80
COPY ./docker/templates/nginx-linux.conf.template /nginx.conf.template
CMD ["/bin/sh" , "-c" , "envsubst \$(printf '\$%s,' \$(export | grep -e '^APPSMITH_[A-Z_]\+')) < /nginx.conf.template > /etc/nginx/conf.d/app.conf && exec nginx -g 'daemon off;'"]
