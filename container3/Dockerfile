FROM node:18-alpine
RUN apk add --no-cache bash
WORKDIR /usr/src/app
VOLUME /usr/src/app
EXPOSE 3000
CMD [ "bash", "-c","npm install && node app.js" ]
