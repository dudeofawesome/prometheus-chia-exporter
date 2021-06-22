# build stage
FROM docker.io/library/node:14 AS builder

LABEL maintainer="louis@orleans.io"

ENV APP_DIR=~/app

RUN useradd chiaprom
RUN mkdir -p "$APP_DIR"; \
    chown chiaprom "$APP_DIR";
USER chiaprom
WORKDIR "$APP_DIR"

COPY package.json .
COPY yarn.lock .
COPY . .

RUN yarn install --frozen-lockfile --non-interactive
RUN yarn run build

# run stage
FROM docker.io/library/node:14

ENV APP_DIR=~/app
# ENV DOCKER_GID=470
ENV PORT=9133
EXPOSE $PORT/tcp

RUN useradd chiaprom
# RUN usermod -aG $DOCKER_GID chiaprom
RUN mkdir -p "$APP_DIR"; \
    chown chiaprom "$APP_DIR";
# USER chiaprom
WORKDIR "$APP_DIR"

COPY --from=builder "$APP_DIR/README.md" .
COPY --from=builder "$APP_DIR/Containerfile" .
COPY --from=builder "$APP_DIR/package.json" .
COPY --from=builder "$APP_DIR/yarn.lock" .
# TODO: figure out how to get yarn to not need this since it's a dev dependency
COPY --from=builder "$APP_DIR/eslint" ./eslint
COPY --from=builder "$APP_DIR/dist" ./dist

ENV PROC_DIR=/host/proc

RUN yarn install --production --frozen-lockfile --non-interactive
CMD yarn run start:prod

HEALTHCHECK CMD curl --fail localhost:9133/health || exit 1
