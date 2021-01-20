FROM legodevops/appsmith as frontend

FROM appsmith/appsmith-server

RUN mkdir -p /var/www/appsmith
COPY --from=legodevops/appsmith /var/www/appsmith /var/www/appsmith
COPY --from=legodevops/appsmith nginx-root.conf.template nginx-root.conf.template
COPY --from=legodevops/appsmith nginx.conf.template nginx.conf.template

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
