FROM ubuntu:20.04

LABEL version="1.1.0"
LABEL description="vk-cookie"
LABEL maintainer="gistrec@mail.ru"

ENV DEBIAN_FRONTEND=noninteractive

# Copy local files.
ADD app.js .
ADD package.json .

# Download geckodriver.
ADD https://github.com/mozilla/geckodriver/releases/download/v0.27.0/geckodriver-v0.27.0-linux32.tar.gz .
RUN tar -zxf geckodriver-v0.27.0-linux32.tar.gz

# Install NodeJS and firefox.
RUN apt-get update && apt-get install -y nodejs npm firefox

# Install module dependencies.
RUN npm install

ENTRYPOINT ["node", "app.js"]