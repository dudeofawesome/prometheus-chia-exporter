# build stage
FROM docker.io/library/node:14 AS builder

LABEL maintainer="louis@orleans.io"

RUN useradd --create-home chiaprom
USER chiaprom
RUN mkdir /home/chiaprom/app
WORKDIR /home/chiaprom/app

COPY package.json .
COPY yarn.lock .
COPY . .

RUN yarn install --frozen-lockfile --non-interactive
RUN yarn run build

# run stage
FROM docker.io/library/node:14

# user-configurable vars
ENV PORT=9133
EXPOSE $PORT/tcp

RUN useradd --create-home chiaprom
USER chiaprom
RUN mkdir /home/chiaprom/app
WORKDIR /home/chiaprom/app

COPY --from=builder /home/chiaprom/app/README.md .
COPY --from=builder /home/chiaprom/app/Containerfile .
COPY --from=builder /home/chiaprom/app/package.json .
COPY --from=builder /home/chiaprom/app/yarn.lock .
# TODO: figure out how to get yarn to not need this since it's a dev dependency
COPY --from=builder /home/chiaprom/app/eslint ./eslint
COPY --from=builder /home/chiaprom/app/dist ./dist

ENV PROC_DIR=/host/proc

RUN yarn install --production --frozen-lockfile --non-interactive
CMD yarn run start:prod

HEALTHCHECK CMD curl --fail localhost:9133/health || exit 1
