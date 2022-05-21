const http = require('http');
const EventEmitter = require('events');
const { Socket } = require('net');
const DeviceFactory = require('./device-factory');
const Logger = require('./logger');

const debug = () => {};

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
  }

  connect() {
    return this.loginRestApi().then(() => {
      this.emit('connect');
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

  // *** Internal methods ***

  callRestApi({
    method = 'GET',
    url,
    data,
    dataType = 'json'
  }) {
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
      path: `${apiBaseUrl}${url}`,
      method,
      headers
    };

    return new Promise((resolve, reject) => {
      debug(`Request: ${options.path}`);
      const req = http.request(options, (res) => {
        debug(`STATUS: ${res.statusCode}`);

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

          resolve(resData);
        });
      });
      req.on('error', (err) => {
        reject(err);
      });

      if (postData) req.write(postData);
      req.end();
    });
  }

  socketConnect() {
    const { host, socketPort: port } = this;

    this.socket = new Socket();
    this.socket.on('error', (err = {}) => {
      this.emit('error', new Error(`Socket connection error:${err.message}`));
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
        this.socketConnect();
      }, RECONNECTION_TIMEOUT);
    });

    this.socket.on('data', (data) => {
      const processText = (text) => {
        try {
          const res = JSON.parse(text);
          if (res.socketId) {
            this.socketId = res.socketId;
            this.emit('connect');
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
          debug(`Data error: ${err} (${text})`);
          //
        }
      };
      data.toString().split('\n').forEach((text) => processText(text));
    });

    this.socket.connect({ port, host }, () => {
      debug(this, `Socket connected: ${host}:${port}`);
      this.socketConnected = true;
      this.ping(true); // to keep server subscribed
    });
  }

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
        this.socketConnect();
      }
    }, PING_TIMEOUT);
  }

  loginRestApi() {
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
      } else {
        throw new Error(`Request failed with status = ${status}, message = ${message}`);
      }
    });
  }
}

module.exports = BoocoRestApi;
