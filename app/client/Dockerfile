FROM nginx:1.17.9-alpine

COPY ./build /var/www/appsmith
RUN ls -al /var/www/appsmith

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
