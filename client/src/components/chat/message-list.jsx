import * as React from "react";
import withStyles, { withTheme } from "react-jss";
import { space } from "styled-system";
import uuid from "uuid";

import Message from "./message";

class MessageList extends React.PureComponent {
  bottomRef = React.createRef();
  scrollToBottom = () => {
    this.bottomRef.current.scrollIntoView({ behavior: "smooth" });
  };
  componentDidMount() {
    this.scrollToBottom();
  }
  componentDidUpdate() {
    this.scrollToBottom();
  }
  render() {
    const {
      messages,
      variant,
      altColors,
      theme,
      classes,
      className
    } = this.props;
    return (
      <section
        className={`${classes.container} ${className || ""} ${classes.space}`}
      >
        {messages.map((msg, i) => (
          <Message
            key={uuid()}
            message={msg}
            variant={variant}
            altColors={altColors}
            mb="5px"
            {...(i === 0 ? { mt: "auto" } : { mt: `${theme.spacing.unit}px` })}
          />
        ))}
        <div style={{ float: "left", clear: "both" }} ref={this.bottomRef} />
      </section>
    );
  }
}

const styles = theme => ({
  space,
  container: {
    flexGrow: 1,
    flexDirection: "column",
    display: "flex",
    overflowY: "auto",
    padding: `0 ${theme.spacing.spaces[2]}px`,
    minWidth: "115px"
  }
});

export default withTheme(withStyles(styles)(MessageList));
