import * as React from "react";
import withStyles, { withTheme } from "react-jss";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import MinimizeIcon from "@material-ui/icons/Minimize";
import "./assets/fonts.css";

class ChatHeader extends React.PureComponent {
  render() {
    const { avatar, avatarName, slogan, onClose, classes } = this.props;
    return (
      <header className={classes.container} onClick={onClose}>
        <IconButton
          color="inherit"
          aria-label="Cerrar"
          className={classes.closeButton}
          onClick={onClose}
        >
          <MinimizeIcon fontSize="small" style={{ margin: "auto auto" }} />
        </IconButton>
        <div className={classes.titleContainer}>
          {avatarName && (
            <Typography id="avatarName" color="inherit" variant="h5">
              {avatarName}
            </Typography>
          )}
          {slogan && (
            <Typography id="slogan" color="inherit">
              {slogan}
            </Typography>
          )}
        </div>
        <Avatar
          src={avatar}
          className={classes.avatar}
          imgProps={{
            className: classes.avatarImg
          }}
        />
      </header>
    );
  }
}

const styles = theme => ({
  container: {
    //linear-gradient(to bottom, rgba(0,182,251,1) 0%,rgba(47,144,168,1) 100%)
    background: theme.palette.primary.gradient,
    padding: "0.5rem 1rem",
    height: "50px",
    color: "#FFF",
    position: "relative",
    boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.2)",
    borderRadius: "0px 5px 0px 0px",
    [`@media (max-height:${theme.breakpoints.values.sm}px)`]: {
      borderRadius: "0px 0px 0px 0px"
    }
  },
  avatar: {
    position: "relative",
    background: theme.palette.primary.gradient,
    padding: "10px",
    width: "100px",
    height: "100px",
    left: "-40px",
    top: "-30px",
    zIndex: 1000,
    [`@media (max-height:${theme.breakpoints.values.sm}px)`]: {
      border: `1px solid ${theme.palette.primary.main}`,
      padding: "1px",
      width: "75px",
      height: "75px",
      left: "10px",
      top: "10px"
    },
    boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.2)"
  },
  avatarImg: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    [`@media (max-height:${theme.breakpoints.values.sm}px)`]: {
      width: "75px",
      height: "75px"
    }
  },
  titleContainer: {
    position: "absolute",
    left: "120px",
    color: "#fff",
    "& #avatarName": {
      fontFamily: '"Merienda", Times, serif'
    },
    "& #slogan": {
      fontStyle: "italic",
      fontFamily: "Roboto, sans-serif",
      marginLeft: "20px"
    }
  },
  closeButton: {
    position: "absolute",
    top: `0px`,
    right: `0px`
  }
});

export default withTheme(withStyles(styles)(ChatHeader));
