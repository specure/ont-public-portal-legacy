FROM debian:jessie

MAINTAINER SPECURE GmbH

RUN apt-get update && apt-get install -y \
        curl wget tmux git \
        nginx

EXPOSE 80 443

COPY support/nginx.conf /etc/nginx/sites-available/default

CMD ["nginx", "-g", "daemon off;"]