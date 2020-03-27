import * as React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { space } from "styled-system";
import { Markdown } from "react-showdown";
import Typography from "@material-ui/core/Typography";
import FileAttachment from "./file-attachment";
import Paper from "@material-ui/core/Paper";

const Variants = {
  DEFAULT: "outlined",
  PAPER: "paper",
  OUTLINED: "outlined"
};

let MsgWrapper = ({ variant = Variants.OUTLINED, classes, children }) =>
  variant === Variants.PAPER ? (
    <Paper
      className={`${classes.container} ${classes.msgPaper} ${classes.space}`}
    >
      {children}
    </Paper>
  ) : (
    <div
      className={`${classes.container} ${classes.msgOutline} ${classes.space}`}
    >
      {children}
    </div>
  );

class Message extends React.PureComponent {
  render() {
    const { message, classes } = this.props;
    return (
      <MsgWrapper {...this.props}>
        {message.text && (
          <Typography variant="caption" color="inherit">
            <Markdown markup={message.text} />
          </Typography>
        )}
        {message.open_link && (
          <a
            href={message.open_link}
            target="_blank"
            className={classes.buttonMessage}
          >
            <Typography variant="caption" color="inherit">
              {message.link_title ? message.link_title : message.open_link}
            </Typography>
          </a>
        )}
        {(message.files || []).map(file => (
          <FileAttachment url={file.url} isImage={!!file.image} />
        ))}
      </MsgWrapper>
    );
  }
}

const styles = theme => ({
  space,
  container: ({ message }) => ({
    padding: `${theme.spacing(2)}px`,
    textAlign: "justify",
    width: "auto",
    display: "inline-block",
    ...(message.files
      ? {
          maxWidth: "100%"
        }
      : {
          maxWidth: "75%"
        }),
    ...(message.type === "outgoing"
      ? {
          alignSelf: "flex-end",
          borderRadius: "0.5em 0 0.5em 0.5em"
        }
      : {
          alignSelf: "flex-start",
          borderRadius: "0 0.5em 0.5em 0.5em"
        })
  }),
  msgPaper: ({ message, altColors }) => ({
    ...(message.type === "outgoing" || !altColors
      ? {
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }
      : {
          background: theme.palette.secondary.light,
          color: theme.palette.secondary.contrastText
        })
  }),
  msgOutline: ({ message, altColors }) => ({
    background: theme.palette.common.white,
    ...(message.type === "outgoing" || !altColors
      ? {
          border: `1px solid ${theme.palette.secondary.main}`,
          boxShadow: `0 0 0.5em ${theme.palette.secondary.light}`
        }
      : {
          border: `1px solid ${theme.palette.primary.main}`,
          boxShadow: `0 0 0.5em ${theme.palette.primary.light}`
        })
  }),
  buttonMessage: {
    margin: "1rem 0",
    borderRadius: `${theme.shape.borderRadius}px`,
    borderColor: theme.palette.secondary.main,
    borderStyle: "solid",
    color: theme.palette.secondary.main,
    borderWidth: "1px",
    padding: "0.25rem 1rem",
    textDecoration: "none",
    textAlign: "center",
    boxShadow: "1px 1px 2px rgba(0, 0, 0, 0.25)",
    display: "block"
  }
});

export default withTheme(withStyles(styles)(Message));
