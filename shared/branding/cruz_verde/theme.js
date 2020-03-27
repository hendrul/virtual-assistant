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
      main: "#369443",
      contrastText: "#fff"
    },
    secondary: {
      main: "#ffb300"
    },
    text: {
      primary: "#33475b"
    }
  },
  shape: {
    borderRadius: 4
  }
};

theme.chatWindow = {
  container: {
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: `${theme.shape.borderRadius}px`
  }
};

module.exports = theme;
