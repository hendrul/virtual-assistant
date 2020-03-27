import * as React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { space } from "styled-system";
import Typography from "@material-ui/core/Typography";

const TYPOGRAPHY_VARIANT = "caption";

let AnimatedDots = props => {
  const { classes, className, ...restProps } = props;
  return (
    <div
      className={`${classes.dotsWrapper} ${classes.space} ${className || ""}`}
      {...restProps}
    >
      <span />
      <span />
      <span />
    </div>
  );
};

class StatusIndicator extends React.PureComponent {
  render() {
    const {
      classes,
      className,
      text,
      showDots = false,
      dotsPosition = "left",
      ...restProps
    } = this.props;
    return (
      <div
        className={`${classes.container} ${classes.space} ${className || ""}`}
        {...restProps}
      >
        <div className={classes.wrapper}>
          {showDots && dotsPosition === "left" && <AnimatedDots ml="4px" />}
          <Typography variant={TYPOGRAPHY_VARIANT} color="inherit">
            {text}
          </Typography>
          {showDots && dotsPosition === "right" && <AnimatedDots ml="4px" />}
        </div>
      </div>
    );
  }
}

const styles = theme => ({
  space,
  container: {
    height: `calc(${theme.typography[TYPOGRAPHY_VARIANT].fontSize} + 15px)`,
    minHeight: `calc(${theme.typography[TYPOGRAPHY_VARIANT].fontSize} + 15px)`,
    marginTop: `calc(-${theme.typography[TYPOGRAPHY_VARIANT].fontSize} - 15px)`,
    justifyContent: "flex-start",
    background:
      "linear-gradient(to bottom, rgba(255,255,255,0) 0%,rgba(255,255,255,0) 1%,rgba(255,255,255,1) 54%,rgba(255,255,255,1) 100%)",
    alignItems: "flex-end",
    color: theme.palette.text.hint,
    flexDirection: "row",
    display: "flex",
    zIndex: theme.zIndex.appBar,
    paddingLeft: `${theme.spacing(1)}px`
  },
  wrapper: {
    display: "flex",
    alignItems: "baseline"
  },
  dotsWrapper: {
    display: "inline",
    position: "relative",
    background: "none",
    "& span": {
      backgroundColor: theme.palette.text.hint,
      height: "5px",
      width: "5px",
      float: "left",
      margin: "0 1px",
      display: "block",
      borderRadius: "50%",
      opacity: 0.4,
      "&:nth-of-type(1)": {
        animation: "1s blink infinite 0.3333s"
      },
      "&:nth-of-type(2)": {
        animation: "1s blink infinite 0.6666s"
      },
      "&:nth-of-type(3)": {
        animation: "1s blink infinite 0.9999s"
      }
    }
  },
  "@keyframes blink": {
    "50%": {
      opacity: 1
    }
  }
});

export default withTheme(withStyles(styles)(StatusIndicator));

AnimatedDots = withStyles(styles)(AnimatedDots);
export { AnimatedDots };
