  
FROM node:12-alpine as base
ENV NODE_ENV=production
ENV TYPEORM_CONNECTION=postgres
ENV TYPEORM_HOST=localhost
ENV TYPEORM_USERNAME=app
ENV TYPEORM_PASSWORD=password
ENV TYPEORM_DATABASE=turnip_tracker
ENV TYPEORM_PORT=5432
ENV TYPEORM_SYNCHRONIZE=true
ENV TYPEORM_LOGGING=false
ENV TYPEORM_ENTITIES=dist/entity/**/*.js
ENV TYPEORM_MIGRATIONS=dist/migration/**/*.js
ENV TYPEORM_SUBSCRIBERS=dist/subscriber/**/*.js
ENV REDIS_HOST=localhost
ENV DISCORD_TOKEN=foo
WORKDIR /opt
COPY yarn.lock ./
COPY package.json ./
RUN yarn config list \
    && yarn install --frozen-lockfile \
    && yarn cache clean --force

FROM base as basedev
ENV NODE_ENV=development
ENV PATH=/opt/node_modules/.bin:$PATH
WORKDIR /opt
COPY ./db/wait-for-db.sh .
RUN apk add postgresql \
    && chmod +x ./wait-for-db.sh \
    && yarn install --production=false
WORKDIR /opt/app

FROM basedev as compile
WORKDIR /opt
COPY . .
RUN yarn run build

FROM compile as dev
CMD ["./wait-for-db.sh", "yarn", "start"]

FROM base as prod
WORKDIR /opt
RUN mkdir /opt/dist
COPY --from=compile /opt/dist /opt/dist
CMD ["yarn", "start"]