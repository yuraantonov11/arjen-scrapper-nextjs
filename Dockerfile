FROM ubuntu:latest
LABEL authors="Yurii"

RUN apt-get update && apt-get install -y chromium-browser

COPY . /app

WORKDIR /app

RUN npm i

CMD ["npm", "start"]
