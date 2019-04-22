import amber from "@material-ui/core/colors/amber";
import avatarUrl from "./avatar.png";
import "./reset.css";

let SPACING_UNIT = 8;

const theme = {
  avatar: {
    url: avatarUrl,
    name: "TaiBot"
  },
  breakpoints: {
    values: {
      sm: ((window.appConfig || {}).breakpoints || {}).sm || 600
    }
  },
  typography: {
    useNextVariants: true
  },
  palette: {
    primary: {
      main: "#00b6fb",
      gradient:
        "linear-gradient(to bottom, rgba(0,182,251,1) 0%,rgba(47,144,168,1) 100%)",
      contrastText: "#fff"
    },
    secondary: {
      main: amber[600]
    },
    text: {
      primary: "#33475b"
    }
  },
  spacing: {
    unit: SPACING_UNIT,
    spaces: [
      0,
      SPACING_UNIT,
      SPACING_UNIT * 2,
      SPACING_UNIT * 3,
      SPACING_UNIT * 4,
      SPACING_UNIT * 5,
      SPACING_UNIT * 6,
      SPACING_UNIT * 7,
      SPACING_UNIT * 8
    ]
  }
};

module.exports = theme;
