FROM node:alpine as build
ARG MODE
RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /build

COPY package.json .
RUN npm install
RUN npm install --save-exact esbuild

COPY . .

RUN npm run build

FROM node:alpine
RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python
WORKDIR /app

COPY package.json .

RUN npm install --production

COPY --from=build /build/dist /app/dist
COPY --from=build /build/server.js /app/server.js


EXPOSE 3001

CMD ["npm", "run", "start"]