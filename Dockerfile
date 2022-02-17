FROM node:15.12.0-alpine3.10
WORKDIR /home/node/app

# Installing dependencies
COPY package*.json ./
RUN yarn

# Copying source files
COPY . /home/node/app

# Building app
EXPOSE 8100

# Running the app
CMD ["yarn", "server"]
