FROM appsmith/appsmith-editor:latest as frontend

FROM appsmith/appsmith-server:latest

RUN mkdir -p /var/www/appsmith
COPY --from=frontend /var/www/appsmith /var/www/appsmith
COPY --from=frontend nginx-root.conf.template nginx-root.conf.template
COPY --from=frontend nginx.conf.template nginx.conf.template

RUN apk add --update nginx && \ 
	rm -rf /var/cache/apk/* && \
	mkdir -p /tmp/nginx/client-body && \
	apk --no-cache add gettext bash curl

COPY bootstrap.sh /bootstrap.sh
COPY analytics.sh /analytics.sh 
RUN chmod +x /analytics.sh

EXPOSE 80

ENTRYPOINT [ "/bin/sh -c" ]
CMD ["/bootstrap.sh"]
