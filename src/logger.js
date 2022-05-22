/* eslint-disable class-methods-use-this, no-console */

const onError = () => {};

class Logger {
  constructor({ api }) {
    this.api = api;
  }

  info(message) {
    this.api.callRestApi({
      url: `log/info/${message}`
    }).catch(onError);
  }

  warn(message) {
    this.api.callRestApi({
      url: `log/warn/${message}`
    }).catch(onError);
  }

  error(message) {
    this.api.callRestApi({
      url: `log/error/${message}`
    }).catch(onError);
  }

  debug(message) {
    this.api.callRestApi({
      url: `log/debug/${message}`
    }).catch(onError);
  }
}

module.exports = Logger;
