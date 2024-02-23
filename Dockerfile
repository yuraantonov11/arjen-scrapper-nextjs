FROM alpine
LABEL authors="Yurii"

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      npm


# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Puppeteer v13.5.0 works with Chromium 100.
# RUN yarn add puppeteer@13.5.0


COPY . /app

WORKDIR /app

RUN npm i

RUN npm i sharp

RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]
