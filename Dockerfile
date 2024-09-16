FROM node:18.18.0-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install pm2 -g

COPY . .

CMD ["pm2-runtime","start","ecosystem.config.js"]
