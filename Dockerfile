FROM node
MAINTAINER cyoooo7@gmail.com

WORKDIR /www
RUN npm install
CMD npm start