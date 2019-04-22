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
      sm: 600
    }
  },
  typography: {
    useNextVariants: true
  },
  palette: {
    primary: {
      main: "#00A261",
      //gradient: "linear-gradient(to bottom, #e11282 0%,#c1197f 100%)",
      contrastText: "#fff"
    },
    secondary: {
      main: "#FFDE00"
    },
    text: {
      primary: "#00A261"
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
