import * as React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";

class Replies extends React.PureComponent {
  handleClick = () => {};
  render() {
    const { replies = [], classes } = this.props;
    return (
      <div id="message_replies" className={classes.container}>
        <ul className={classes.replyList}>
          {replies.map(reply => (
            <li className={classes.replyItem}>
              <a
                href="#"
                onClick={this.handleClick}
                className={classes.replyAnchor}
              >
                {reply.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

const styles = theme => ({
  container: {
    textAlign: "center",
    overflowX: "auto",
    flexShrink: 0
  },
  replyList: {
    listStyleType: "none",
    margin: "0px auto",
    padding: 0
  },
  replyItem: {
    display: "inline-block",
    margin: "0.5rem",
    marginLeft: 0
  },
  replyAnchor: {
    textDecoration: "none",
    display: "block",
    border: "1px solid #a795ef",
    color: "#a795ef",
    borderRadius: "16px",
    padding: "0.25rem 1rem",
    fontSize: "14px",
    cursor: "pointer",
    "&:hover": {
      background: theme.primaryColor,
      color: "#FFF"
    }
  }
});

export default withTheme(withStyles(styles)(Replies));
