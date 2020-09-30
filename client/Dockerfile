FROM node:12.6.0

WORKDIR /usr/local/src/client

COPY . .

RUN yarn install

EXPOSE 1234

CMD ["yarn", "start"]