FROM node:lts-alpine
COPY . /app
WORKDIR /app
RUN npm i --registry https://npmreg.proxy.ustclug.org