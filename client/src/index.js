import path from "path";
import React from "react";
import { render } from "react-dom";
import merge from "merge";
import { ThemeProvider, createMuiTheme } from "@material-ui/core/styles";

import { theme as baseTheme, strings, avatar } from "../../shared/branding";
import Chat from "./components/chat";
import BotkitConnection from "./botkit-connection";

const {
  host = location.host,
  basePath = "",
  ssl = location.protocol === "https:"
} = window.appConfig || {};

const protocol = ssl ? "https" : "http";
const wsProtocol = ssl ? "wss" : "ws";
const wsEndpoint = `${wsProtocol}://${path.join(host, basePath)}`;
const historyEndpoint = `${protocol}://${path.join(
  host,
  basePath,
  "/botkit/history"
)}`;

const botkitConnection = new BotkitConnection({
  wsEndpoint,
  historyEndpoint,
  reconnectTimeout: 3000,
  maxReconnect: 5
});

const themeOverrides = (window.appConfig || {}).themeOverrides;
let themeWithOverrides = !themeOverrides
  ? baseTheme
  : merge.recursive(true, baseTheme, themeOverrides);
const theme = createMuiTheme(themeWithOverrides);

const calloutMessages = Object.keys(strings)
  .filter(key => key.match(/^calloutMessage\d+$/))
  .sort((a, b) => parseInt(a.slice(14)) - parseInt(b.slice(14)))
  .reduce((prev, key) => prev.concat(strings[key]), []);

render(
  <ThemeProvider theme={theme}>
    <Chat
      connection={botkitConnection}
      avatarUrl={avatar}
      avatarName={strings.botName}
      slogan={strings.botSlogan}
      calloutMessages={calloutMessages}
    />
  </ThemeProvider>,
  document.getElementById("chat-root")
);
