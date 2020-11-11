FROM ubuntu:18.04

ENV NODE_VERSION 4.4.7

COPY ./ /micro

EXPOSE 1212

CMD ["node","server.js"]

