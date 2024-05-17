FROM nginx:1.26.0-alpine

COPY default.conf /etc/nginx/conf.d/
COPY 403_error.html /var/www/html/

RUN apk --no-cache add curl

CMD [ "nginx", "-g", "daemon off;" ]