import * as React from "react";
import merge from "merge";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { space, width, height } from "styled-system";
import Paper from "@material-ui/core/Paper";

import ChatHeader from "./chat-header";
import MessageList from "./message-list";
import StatusIndicator from "./status-indicator";
import MessageSendForm from "./message-send-form";

const strings = window.appStrings;

const Status = {
  STARTING: "STARTING",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  ERROR: "ERROR",
  TYPING: "TYPING",
  OFFLINE: "OFFLINE"
};

const mapStatusToProps = status => {
  switch (status) {
    case Status.STARTING:
      return {
        text: strings.statusStarting,
        showDots: false
      };
    case Status.CONNECTED:
      return {
        text: "",
        showDots: false
      };
    case Status.DISCONNECTED:
      return {
        text: strings.statusDisconnected,
        showDots: false
      };

    //case Status.ERROR:
    case Status.OFFLINE:
      return {
        text: strings.statusOffline,
        showDots: false
      };
    case Status.TYPING:
      return {
        text: strings.statusTyping,
        showDots: true,
        dotsPosition: "right"
      };
  }
};

class ChatWindow extends React.PureComponent {
  static defaultProps = {
    avatarName: "",
    avatarUrl: "",
    slogan: "",
    onClose: i => i,
    onMounted: i => i
  };
  state = {
    status: Status.STARTING,
    error: null,
    replies: [],
    history: [
      // { text: "hola", type: "outgoing" },
      // { text: "hola", type: "incoming" },
      // { text: "hola", type: "outgoing" },
      // { text: "hola", type: "incoming" },
      // { text: "hola", type: "outgoing" },
      // { text: "hola", type: "incoming" },
      // { text: "hola", type: "outgoing" },
      // { text: "hola", type: "incoming" },
      // { text: "hola", type: "outgoing" }
    ]
  };
  constructor(props) {
    super(props);
    this.connection = props.connection;
  }
  handleSend = (text = "", e) => {
    if (e) e.preventDefault();
    if (this.state.status === Status.CONNECTED && text.trim().length > 0) {
      const msg = this.connection.send(text);
      this.setState({
        history: [...this.state.history, msg]
      });
    }

    return false;
  };
  componentDidMount() {
    this.connection.on("disconnected", () => {
      this.setState({
        status: Status.DISCONNECTED
      });
    });

    this.connection.on("socket_error", err => {
      this.setState({
        status: Status.ERROR,
        error: strings.statusConnectionError
      });
    });

    this.connection.on("typing", () => {
      this.setState({
        status: Status.TYPING
      });
    });

    this.connection.on("message", message => {
      message = Object.assign({}, message, { type: "incoming" });
      this.setState({
        status: Status.CONNECTED,
        history: [...this.state.history, message]
      });
    });
    this.connection.on("history_loaded", history => {
      if (history) {
        this.setState({
          history: history.map(msg => ({
            ...msg,
            type: msg.type == "message_received" ? "outgoing" : "incoming"
          }))
        });
      }
    });
    this.connection.on("history_error", history => {
      this.setState({
        status: Status.ERROR,
        error: strings.statusConnectionError,
        history: []
      });
    });
    this.connection.on("connected", () => {
      this.setState({
        status: Status.CONNECTED
      });
    });
    this.connection.boot();
    this.props.onMounted();
  }

  componentWillUnmount() {
    this.connection.removeAllListeners();
  }

  render() {
    const {
      avatarName,
      avatarUrl,
      slogan,
      onMounted,
      onClose,
      connection,
      theme,
      className,
      classes,
      ...props
    } = this.props;
    const { status, history } = this.state;

    return (
      <Paper
        className={`${classes.container} ${classes.space} ${classes.width} ${
          classes.height
        } ${className || {}}`}
        {...props}
      >
        <div className={classes.messageWindow}>
          <ChatHeader
            avatar={avatarUrl}
            avatarName={avatarName}
            slogan={slogan}
            onClose={onClose}
          />
          <MessageList
            variant="outlined"
            altColors
            messages={history}
            pb="1.5em"
          />
          <StatusIndicator
            {...mapStatusToProps(status)}
            pl={`${theme.spacing(1)}px`}
            mr="17px"
          />
          <MessageSendForm
            disabled={status !== Status.CONNECTED}
            placeholder={strings.inputPlaceholder}
            onSend={this.handleSend}
          />
        </div>
      </Paper>
    );
  }
}

const styles = theme =>
  merge(
    {
      width,
      height,
      space,
      container: {
        "&:after": {
          content: "",
          display: "table",
          clear: "both"
        },
        zIndex: 1000
      },
      messageWindow: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column"
      }
    },
    theme.chatWindow
  );

export default withTheme(withStyles(styles)(ChatWindow));
