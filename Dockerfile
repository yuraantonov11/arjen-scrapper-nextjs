FROM node:18-slim
LABEL authors="Yurii"

RUN apt-get update && apt-get install -y chromium

COPY . /app

WORKDIR /app

RUN npm i

RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]
