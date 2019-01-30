import * as React from "react";
import withStyles, { withTheme } from "react-jss";

class FileAttachment extends React.PureComponent {
  render() {
    const { url, isImage, classes } = this.props;
    return (
      <div className={classes.container}>
        {isImage ? (
          <img src={url} alt={url} />
        ) : (
          <a href={url} title={url}>
            {url}
          </a>
        )}
      </div>
    );
  }
}

const styles = {
  container: {
    background: "#F0F0F0",
    color: "#333",
    borderRadius: "5px",
    display: "inline-block",
    maxWidth: "75%",
    "& img": {
      maxWidth: "100%",
      display: "block"
    }
  }
};

export default withTheme(withStyles(styles)(FileAttachment));
