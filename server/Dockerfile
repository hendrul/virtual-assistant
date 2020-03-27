FROM node:jessie

RUN mkdir -p /usr/src/chatbot
WORKDIR /usr/src/chatbot

COPY ./build/package.json /usr/src/chatbot
COPY ./build/package-lock.json /usr/src/chatbot
RUN npm install

COPY ./build /usr/src/chatbot

WORKDIR /usr/src/chatbot
ENV PUBLIC_PATH=/usr/src/chatbot/public
EXPOSE 8080

VOLUME ["/usr/src/chatbot/public"]

CMD [ "npm", "start" ]