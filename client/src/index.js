import React from "react";
import { render } from "react-dom";
import { ThemeProvider } from "react-jss";
import path from "path";
import merge from "merge";
import { createMuiTheme } from "@material-ui/core/styles";
import "typeface-roboto";

import Chat from "./components/chat";
import BotkitConnection from "./botkit-connection";

const botkitConnection = new BotkitConnection({
  ssl: (window.appConfig || {}).ssl,
  host: (window.appConfig || {}).host,
  reconnectTimeout: 3000,
  maxReconnect: 5
});
import themes from "./themes";
const baseThemeName = (window.appConfig || {}).baseTheme || "default";
const baseTheme = themes[baseThemeName] || {};
const themeOverrides = (window.appConfig || {}).themeOverrides;
let baseThemeWithOverrides = !themeOverrides
  ? baseTheme
  : merge.recursive(true, baseTheme, themeOverrides);
const theme = createMuiTheme(baseThemeWithOverrides);

render(
  <ThemeProvider theme={theme}>
    <Chat
      connection={botkitConnection}
      avatarUrl={theme.avatar.url}
      avatarName="TaiBot"
      slogan="Tu satisfacción es mi objetivo."
      calloutMessages={["¡Hola! Soy TaiBot, listo para ayudarte."]}
    />
  </ThemeProvider>,
  document.getElementById("chat-root")
);
