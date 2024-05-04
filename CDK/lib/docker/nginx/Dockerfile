FROM nginx:1.26.0-alpine

COPY default.conf /etc/nginx/conf.d/

RUN apk --no-cache add curl

CMD [ "nginx", "-g", "daemon off;" ]