FROM docker.io/library/node:14

LABEL maintainer="louis@orleans.io"

# user-configurable vars
ENV PORT=9133

EXPOSE 9133

RUN useradd --create-home chiaprom
USER chiaprom
RUN mkdir /home/chiaprom/app
WORKDIR /home/chiaprom/app

COPY package.json .
COPY yarn.lock .
RUN yarn install --prod

COPY . .

RUN yarn run build

CMD yarn run start:prod

HEALTHCHECK CMD curl --fail localhost:9133/health || exit 1
