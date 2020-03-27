import * as React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { space, width, height } from "styled-system";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

class Callout extends React.PureComponent {
  render() {
    const {
      avatarUrl = "",
      messages = [],
      onClose = i => i,
      onClick = i => i,
      theme,
      className,
      classes,
      children,
      ...props
    } = this.props;
    return (
      <div
        className={`${
          classes.container
        } ${width} ${height} ${space} ${className || ""}`}
        {...props}
      >
        <div className={classes.wrapper}>
          <div className={`${classes.arrow} ${classes.fillArrow}`} />
          <IconButton
            aria-label="Cerrar"
            className={classes.closeButton}
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <div className={classes.wrapper} onClick={onClick}>
            <img src={avatarUrl} className={classes.image} />
            <Typography
              className={classes.typography}
              variant="caption"
              color="textPrimary"
            >
              {messages[Math.floor(Math.random() * messages.length)]}
            </Typography>
          </div>
        </div>
      </div>
    );
  }
}

const styles = ({ palette, shape }) => ({
  space,
  width,
  height,
  container: {
    position: "relative",
    maxWidth: "300px",
    minWidth: "60px",
    width: "280px",
    height: "86px",
    borderRadius: `${shape.borderRadius}px`,
    border: `2px solid ${palette.secondary.main}`,
    backgroundColor: palette.background.paper,
    zIndex: 1000
  },
  wrapper: {
    display: "flex",
    justifyContent: "flex-start",
    alignContent: "baseline",
    width: "100%",
    height: "100%"
  },
  closeButton: {
    position: "absolute",
    top: `-5px`,
    right: `-5px`
  },
  image: {
    position: "relative",
    width: "86px",
    height: "86px"
  },
  typography: {
    marginTop: "auto",
    marginBottom: "auto",
    marginLeft: "12px",
    marginRight: "40px",
    textAlign: "justify"
  },
  //prettier-ignore
  arrow: {
    borderStyle: "solid",
    position: "absolute",
    borderColor: `${ palette.secondary.main} transparent transparent transparent`,
    borderWidth: "12px 12px 0px 12px",
    bottom: "-12px",
    right: "16px"
  },
  fillArrow: {
    "&:after": {
      borderColor: `${
        palette.secondary.main
      } transparent transparent transparent`,
      borderStyle: "solid",
      borderWidth: "11px 11px 0px 11px",
      bottom: "1px",
      content: "",
      position: "absolute",
      left: "-11px"
    }
  }
});

export default withTheme(withStyles(styles)(Callout));
