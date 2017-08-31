FROM node:7.10.0
#this image already has yarn installed
WORKDIR /srv/frogchat
COPY package.json .
COPY yarn.lock .
RUN yarn global add gulp
RUN yarn install --save-dev
#node_modules should get ignored because it is in .dockerignore
COPY . .
RUN gulp build-dist
EXPOSE 8081