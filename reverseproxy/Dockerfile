FROM nginx:alpine
RUN apk update && apk --update add redis
RUN mkdir -p /tmp
COPY upstream.conf /tmp/upstream.conf
COPY update_upstream.sh /tmp/update_upstream.sh
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]

