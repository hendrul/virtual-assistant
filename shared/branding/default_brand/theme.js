let SPACING_UNIT = 8;

const theme = {
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
      main: "#e11282",
      gradient: "linear-gradient(to bottom, #e11282 0%,#c1197f 100%)",
      contrastText: "#fff"
    },
    secondary: {
      main: "#c1197f"
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
