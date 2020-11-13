FROM registry.flexbe.net/flexbe/images/nodejs
MAINTAINER Vitaliy Shindin <vit@flexbe.com>
LABEL Vendor="Flexbe"

WORKDIR /flexbe/micro

COPY ./ /micro

EXPOSE 8080

CMD ["node","server.js"]

