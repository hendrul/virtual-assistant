import * as React from "react";
import withStyles, { withTheme } from "react-jss";
import Fab from "@material-ui/core/Fab";
import ChatIcon from "@material-ui/icons/Forum";
import CloseIcon from "@material-ui/icons/Close";
import CircularProgress from "@material-ui/core/CircularProgress";
// import posed, { PoseGroup } from "react-pose";
import "./assets/fonts.css";
import "./assets/reboot.css";

import Callout from "./callout";
import ChatWindow from "./chat-window";

class Chat extends React.PureComponent {
  static defaultProps = {
    connection: undefined,
    avatarUrl: "",
    avatarName: "Unnamed",
    slogan: "The Unnamed bot that no one knows",
    calloutMessages: []
  };
  state = {
    loading: false,
    active: false,
    calloutClosed: false
  };
  constructor(props) {
    super(props);
    this.connection = props.connection;
    // this.ChatWindow = React.lazy(() => {
    //   this.setState({ loading: true });
    //   return import("./chat-window");
    // });
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  componentWillUnmount() {
    this.connection.close();
  }

  handleBeforeUnload = ev => {
    ev.preventDefault();
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.connection.invalidateSession();
    return;
  };

  handleToggleWindow = () => {
    this.setState({ active: !this.state.active, calloutClosed: false });
  };

  handleCalloutClose = () => {
    this.setState({
      calloutClosed: true
    });
  };

  handleChatWindowClose = () => {
    this.setState({
      active: false
    });
  };

  render() {
    const {
      connection,
      avatarUrl,
      avatarName,
      slogan,
      calloutMessages,
      theme,
      className,
      classes
    } = this.props;
    // const LazyChatWindow = this.ChatWindow;
    const { active, loading, calloutClosed } = this.state;
    //prettier-ignore
    // const Hide = posed.div({
    //   enter: { opacity: 1 },
    //   exit: { opacity: 0 }
    // });
    return (
      <div className={classes.container}>
        {/* <PoseGroup> */}
        {active && (
          // <Hide key={uuid()}>
          //<React.Suspense fallback={null}>
          <ChatWindow
            connection={connection}
            onMounted={() => this.setState({ loading: false })}
            onClose={this.handleChatWindowClose}
            className={`${classes.sm} ${classes.chatWindow}`}
            avatarUrl={avatarUrl}
            avatarName={avatarName}
            slogan={slogan}
          />
          // </React.Suspense>
          // </Hide>
        )}
        {!active && !calloutClosed && (
          // <Hide key={uuid()}>
          <Callout
            className={classes.callout}
            onClick={this.handleToggleWindow}
            onClose={this.handleCalloutClose}
            avatarUrl={avatarUrl}
            messages={calloutMessages}
          />
          // </Hide>
        )}
        {/* </PoseGroup> */}
        <ChatToogleButton
          active={active}
          loading={loading}
          onClick={this.handleToggleWindow}
          className={classes.toogleButton}
        />
      </div>
    );
  }
}

let ChatToogleButton = ({ active, loading, onClick, className, classes }) => (
  <React.Fragment>
    {loading && (
      <Fab color="primary" onClick={onClick} className={`${className}`}>
        <CircularProgress />
      </Fab>
    )}
    {active && !loading && (
      <Fab
        color="primary"
        onClick={onClick}
        style={{ zIndex: 1000 }}
        className={`${className} ${classes.hidden}`}
      >
        <CloseIcon />
      </Fab>
    )}
    {!loading && !active && (
      <Fab color="primary" onClick={onClick} className={`${className}`}>
        <ChatIcon />
      </Fab>
    )}
  </React.Fragment>
);

const styles = theme => ({
  container: {
    display: "flex",
    flexDirection: "column",
    zIndex: theme.zIndex.appBar
  },
  sm: {
    [`@media(max-height:${theme.breakpoints.values.sm}px)`]: {
      position: "fixed",
      top: "0px !important",
      right: "0px !important",
      bottom: "0px !important",
      height: "100% !important"
    }
  },
  chatWindow: {
    width: "360px",
    height: "470px"
  },
  toogleButton: {
    alignSelf: "flex-end",
    marginTop: "20px",
    background: theme.palette.primary.gradient
  },
  callout: {
    cursor: "pointer"
  },
  hidden: {
    [`@media (max-height:${theme.breakpoints.values.sm}px)`]: {
      display: "none"
    }
  }
});

ChatToogleButton = withStyles(styles)(ChatToogleButton);
export default withTheme(withStyles(styles)(Chat));
