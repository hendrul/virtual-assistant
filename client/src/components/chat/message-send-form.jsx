import * as React from "react";
import withStyles, { withTheme } from "react-jss";
import SendIcon from "@material-ui/icons/Send";

class SendMessageForm extends React.PureComponent {
  static defaultProps = {
    onSend: i => i,
    placeholder: "",
    text: "",
    disabled: false
  };
  state = {
    msg: ""
  };
  handleChange = evt => {
    this.setState({
      msg: evt.target.value
    });
  };
  inputRef = React.createRef();
  componentDidUpdate(prevProps, prevState) {
    this.inputRef.current.focus();
  }
  render() {
    const { onSend, placeholder, disabled, theme, classes } = this.props;
    return (
      <footer className={classes.container}>
        <form
          className={classes.form}
          onSubmit={event => {
            this.setState({
              msg: ""
            });
            onSend(this.state.msg, event);
            this.inputRef.current.focus();
          }}
        >
          <input
            type="text"
            autoFocus
            ref={this.inputRef}
            value={this.state.msg}
            autoComplete="off"
            placeholder={placeholder}
            className={classes.msgInput}
            onChange={this.handleChange}
            {...(disabled ? { disabled } : {})}
          />
          <button
            type="submit"
            className={`${classes.sendButton} sendbutton`}
            {...(disabled ? { disabled } : {})}
          >
            <SendIcon />
          </button>
        </form>
      </footer>
    );
  }
}

const styles = ({ palette }) => ({
  container: {
    borderTop: `1px solid ${palette.divider}`,
    padding: "0.25rem"
  },
  form: {
    display: "flex",
    margin: 0,
    padding: "0.25rem"
  },
  msgInput: ({ disabled }) => ({
    flexGrow: 1,
    fontSize: "0.8rem",
    outline: "none",
    border: "none",
    ...(disabled
      ? {
          backgroundColor: palette.background.paper
        }
      : {})
  }),
  sendButton: ({ disabled }) => ({
    border: 0,
    cursor: "pointer",
    background: "none",
    width: "24px",
    height: "24px",
    marginRight: "10px",
    color: disabled ? palette.action.disabled : palette.primary.main
  })
});

export default withTheme(withStyles(styles)(SendMessageForm));
