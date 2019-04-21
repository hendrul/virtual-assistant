FROM node:jessie

RUN mkdir -p /usr/src/chatbot
WORKDIR /usr/src/chatbot

COPY ./server/package.json /usr/src/chatbot
RUN npm install

COPY ./.env /usr/src/chatbot

COPY ./client /usr/src/chatbot/~client
RUN cd ~client && npm install

RUN curl -L "https://github.com/gliderlabs/sigil/releases/download/v0.4.0/sigil_0.4.0_$(uname -sm|tr \  _).tgz" \
  | tar -zxC /usr/local/bin

RUN mkdir client && \
  VARS=$(cat .env | sed -e 's/\#.*//g' -e '/^\s*$/d' -e 's/ \+/ /g' | tr '\n' ' ') && \
  cd ~client && (rm -rf dist; exit 0) && echo 'resourcePath: $RESOURCES_PATH' && set -a; . ./.env; set +a && npm run build && \
  mv dist/${THEME}/prod/* ../client && cd .. && \
  sigil -pf ./~client/src/themes/${THEME}/demo.template.html $VARS > client/index.html && \
  cp ./~client/src/themes/${THEME}/avatar100p.png client/ && rm -rf ~client

COPY ./server/components /usr/src/chatbot/components
COPY ./server/sslcert /usr/src/chatbot/sslcert
COPY ./server/app.js /usr/src/chatbot
COPY ./server/server.js /usr/src/chatbot
COPY ./server/.env /usr/src/chatbot

WORKDIR /usr/src/chatbot
ENV PUBLIC_PATH=/usr/src/chatbot/client
EXPOSE 8080

CMD [ "npm", "start" ]