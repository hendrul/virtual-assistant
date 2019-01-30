import EventEmitter from "eventemitter3";

const Events = {
  DISCONNECTED: "DISCONNECTED",
  CONNECTED: "CONNECTED",
  SOCKET_ERROR: "SOCKET_ERROR",
  TYPING: "TYPING"
};

const COOKIE_NAME = "botkit_guid";

class BotkitConnection {
  static defaultConfig = {
    ssl: false,
    host: location.host,
    reconnectTimeout: 3000,
    maxReconnect: 5
  };
  reconnectCount = 0;
  guid = null;
  currentUser = null;

  constructor(config = {}) {
    this.config = {};
    Object.assign(this.config, BotkitConnection.defaultConfig, config);
    (this.wsUrl = (this.config.ssl ? "wss" : "ws") + "://" + this.config.host),
      (this.eventEmitter = new EventEmitter());
  }
  on = (event, handler) => {
    this.eventEmitter.on(event, handler);
  };
  trigger = (event, payload, error) => {
    this.eventEmitter.emit(event, payload, error);
  };
  removeAllListeners = () => {
    this.eventEmitter.removeAllListeners();
  };
  request = (url, body) => {
    return new Promise((resolve, reject) => {
      var xmlhttp = new XMLHttpRequest();

      xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
          if (xmlhttp.status == 200) {
            var response = xmlhttp.responseText;
            var message = null;
            try {
              message = JSON.parse(response);
            } catch (err) {
              reject(err);
              return;
            }
            resolve(message);
          } else {
            reject(new Error("status_" + xmlhttp.status));
          }
        }
      };

      xmlhttp.open("POST", url, true);
      xmlhttp.setRequestHeader("Content-Type", "application/json");
      xmlhttp.send(JSON.stringify(body));
    });
  };
  send = text => {
    if (!text) {
      return;
    }
    var message = {
      type: "outgoing",
      text: text
    };

    this.socket.send(
      JSON.stringify({
        type: "message",
        text: text,
        user: this.guid,
        channel: "socket"
      })
    );

    return message;
  };
  getHistory = () => {
    if (this.guid) {
      // prettier-ignore
      this.request(this.config.ssl ? "https" : "http" + "://" + this.config.host + "/botkit/history", {
        user: this.guid
      })
        .then(history => {
          if (history.success) {
            this.trigger("history_loaded", history.history);
          } else {
            this.trigger("history_error", null, new Error(history.error));
          }
        })
        .catch(err => {
          this.trigger("history_error", null, err);
        });
    }
  };
  setCookie = (cname, cvalue, exdays) => {
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + /*";" + expires +*/ ";path=/";
  };
  getCookie = cname => {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  };
  invalidateSession() {
    document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
  }
  //prettier-ignore
  generateGuid = () => {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }
  connect = wsUrl => {
    // Create WebSocket connection.
    this.socket = new WebSocket(wsUrl);

    var connectEvent = "welcome";
    if (this.getCookie(COOKIE_NAME)) {
      this.guid = this.getCookie(COOKIE_NAME);
      connectEvent = "welcome_back";
    } else {
      this.guid = this.generateGuid();
      this.setCookie(COOKIE_NAME, this.guid, 1);
    }
    // Connection opened
    this.socket.onopen = event => {
      console.log("CONNECTED TO SOCKET");
      this.reconnectCount = 0;
      this.trigger("connected", event);
      this.socket.send(
        JSON.stringify({
          type: connectEvent,
          user: this.guid,
          channel: "socket",
          user_profile: this.currentUser ? this.currentUser : null
        })
      );
    };

    this.socket.onerror = event => {
      this.trigger("socket_error", event, new Error("Socket Error"));
    };

    this.socket.onclose = event => {
      console.log("SOCKET CLOSED!");
      this.trigger("disconnected", event);
      if (this.reconnectCount < this.config.maxReconnect) {
        setTimeout(() => {
          console.log("RECONNECTING ATTEMPT ", ++this.reconnectCount);
          this.connectWebsocket(this.wsUrl);
        }, this.config.reconnectTimeout);
      } else {
        this.trigger("offline", event);
      }
    };

    // Listen for messages
    this.socket.onmessage = event => {
      var message = null;
      try {
        message = JSON.parse(event.data);
      } catch (err) {
        this.trigger("socket_error", null, err);
        return;
      }

      this.trigger(message.type, message);
    };
  };
  boot = () => {
    if (!this.socket) {
      this.connect(this.wsUrl);
      this.on("connected", () => {
        console.log("Booted successfuly");
      });
      this.on("socket_error", payload => {
        console.error("Boot unsuccessful");
      });
    } else if (this.socket.readyState === this.socket.OPEN) {
      this.trigger("connected");
    }
    this.getHistory();
  };
  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export default BotkitConnection;
