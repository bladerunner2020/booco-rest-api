const http = require('http');
const EventEmitter = require('events');
const { Socket } = require('net');
const DeviceFactory = require('./device-factory');
const Logger = require('./logger');

const RECONNECTION_TIMEOUT = 10000;
const PING_TIMEOUT = 10000;

class BoocoRestApi extends EventEmitter {
  constructor({
    host = '127.0.0.1',
    port = 80,
    socketPort = 5990,
    apiBaseUrl = '/api/v1/',
    username = 'admin',
    password = 'admin',
  }) {
    super();

    this.hostname = host;
    this.port = port;
    this.socketPort = socketPort;
    this.username = username;
    this.password = password;
    this.apiBaseUrl = apiBaseUrl;

    this.socket = null;
    this.socketId = null; // Will be assigned by server!
    this.reconnectionTimer = null;
    this.socketConnected = false;

    this.authToken = null;
    this.authUserId = null;

    this.equipment = new DeviceFactory({ api: this });
    this.log = new Logger({ api: this });

    this.debug = () => {};
  }

  // if callback specified it will be called with null in case of success or error if fails
  // if callback not specified login will reject with error.
  login(callback) {
    const {
      username, password
    } = this;

    const data = {
      username,
      password
    };

    this.authToken = null;
    this.authUserId = null;

    return this.callRestApi({
      method: 'POST',
      url: 'login',
      data
    }).then(({ status, data: resData = {}, message }) => {
      if (status === 'success') {
        const { authToken, userId } = resData;
        this.authToken = authToken;
        this.authUserId = userId;
        this.emit('login');
        if (callback) callback(null);
      } else {
        const err = new Error(`Request failed with status = ${status}, message = ${message}`);
        if (callback) {
          callback(err);
          // ATTENTION: no rejection if callback is used!
        } else {
          throw err;
        }
      }
      return null;
    });
  }

  connect(callback) {
    const { host, socketPort: port } = this;

    this.socket = new Socket();
    this.socket.on('error', (err = {}) => {
      const newErr = new Error(`Socket connection error:${err.message}`);
      this.emit('error', newErr);
      this.socketConnected = false;
    });

    this.socket.on('close', () => {
      this.socketId = null;
      this.socketConnected = false;

      if (this.pingTimer) {
        // stop sending pings to socket
        clearTimeout(this.pingTimer);
        this.pingTimer = null;
      }

      this.reconnectionTimer = setTimeout(() => {
        this.reconnectionTimer = null;
        this.connect();
      }, RECONNECTION_TIMEOUT);
    });

    this.socket.on('data', (data) => {
      const processText = (text) => {
        try {
          const res = JSON.parse(text);
          if (res.socketId) {
            this.socketId = res.socketId;
            this.emit('connect');
            if (typeof cb === 'function') callback(null);
          } else if (res.pong) {
            this.pongReceived = true;
          } else if (res.resource === 'eqstates') {
            const { name, _id, ...feedbacks } = res.document || {};
            const { name: oldName, _id: oldId, ...oldFeedbacks } = res.oldDocument || {};
            if (name) {
              this.equipment.emit(name, feedbacks, oldFeedbacks);
              Object.keys(feedbacks).forEach((f) => {
                this.equipment.emit(`${name}.${f}`, feedbacks[f], oldFeedbacks[f]);
              });
            }
          }
        } catch (err) {
          this.debug(`Data error: ${err} (${text})`);
          this.emit('error', err);
        }
      };
      data
        .toString()
        .split('\n')
        .filter((text) => !!text)
        .forEach((text) => processText(text));
    });

    this.socket.connect({ port, host }, () => {
      this.debug(`Socket connected: ${host}:${port}`);
      this.socketConnected = true;
      this.ping(true); // to keep server subscribed
    });
  }

  destroy() {
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.socket = null;
      this.socketId = null;
      this.socketConnected = false;
    }

    this.authToken = null;
    this.authUserId = null;
  }

  callRestApi({
    method = 'GET',
    url,
    data,
    dataType = 'json'
  }, callback) {
    const {
      hostname, port, apiBaseUrl, authToken, authUserId
    } = this;

    const postData = typeof data === 'object' ? JSON.stringify(data) : data;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
    if (typeof authToken !== 'undefined') headers['X-Auth-Token'] = authToken;
    if (typeof authUserId !== 'undefined') headers['X-User-Id'] = authUserId;

    const options = {
      hostname,
      port,
      path: `${apiBaseUrl}${encodeURI(url)}`,
      method,
      headers
    };

    return new Promise((resolve, reject) => {
      this.debug(`Request: ${options.path}`);
      const req = http.request(options, (res) => {
        this.debug(`STATUS: ${res.statusCode}`);

        let resData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          resData += chunk;
        });

        res.on('end', () => {
          if (dataType === 'json') {
            try {
              const jsonData = JSON.parse(resData);
              resolve(jsonData);
              return;
            } catch (err) {
              reject(new Error(`Not JSON data received: ${resData}`));
            }
          }

          if (typeof callback === 'function') callback(resData, null);
          resolve(resData);
        });
      });
      req.on('error', (err) => {
        if (typeof callback === 'function') {
          callback(null, err);
          resolve(null, err);
        } else {
          reject(err);
        }
      });

      if (postData) req.write(postData);
      req.end();
    });
  }

  setDebug(logger) {
    this.debug = logger;
  }

  // *** Internal methods ***

  ping(first) {
    this.socket.write('ping');
    this.pongReceived = !!first;
    this.pingTimer = setTimeout(() => {
      this.pingTimer = null;
      if (this.pongReceived) {
        this.ping();
      } else {
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.destroy();
          this.socket = null;
        }
        this.connect();
      }
    }, PING_TIMEOUT);
  }
}

module.exports = BoocoRestApi;
