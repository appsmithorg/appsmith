FROM appsmith/appsmith-editor as frontend

FROM appsmith/appsmith-server

RUN mkdir -p /var/www/appsmith
COPY --from=appsmith/appsmith-editor /var/www/appsmith /var/www/appsmith

RUN apk add --update nginx && \ 
				rm -rf /var/cache/apk/* && \
				mkdir -p /tmp/nginx/client-body && \
				apk --no-cache add gettext bash curl

COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf.template /etc/nginx/conf.d/default.conf.template
COPY bootstrap.sh /bootstrap.sh
COPY analytics.sh /analytics.sh
RUN chmod +x /analytics.sh

EXPOSE 80

ENTRYPOINT [ "/bin/sh -c" ]
CMD ["/bootstrap.sh"]

