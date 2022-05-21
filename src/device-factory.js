const EventEmitter = require('events');

class DeviceFactory extends EventEmitter {
  constructor({ api }) {
    super();

    this.api = api;
  }

  getFeedback(name, feedback) {
    const { api } = this;
    const url = feedback ? `equipment/get/${name}/${feedback}` : `equipment/get/${name}`;

    return api.callRestApi({ url }).then(({ status, data, message }) => {
      if (status === 'success') return data;
      throw new Error(`Failed with status = ${status}, message = ${message}`);
    });
  }

  setChannel(name, channel, value) {
    const { api } = this;
    const url = typeof value !== 'undefined' ? `equipment/set/${name}/${channel}/${value}`
      : `equipment/set/${name}/${channel}`;

    return api.callRestApi({ url }).then(({ status, data, message }) => {
      if (status === 'success') return data;
      throw new Error(`Failed with status = ${status}, message = ${message}`);
    });
  }

  subscribe(nameOrNames) {
    const { api } = this;
    const { socketId } = api;
    const url = 'eqstates/subscribe';
    const devices = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames];

    if (!socketId) return Promise.reject(new Error('Cannot subscribe - socket not connected.'));

    const data = {
      socketId,
      query: { name: { $in: devices } }
    };
    return api.callRestApi({ url, method: 'POST', data }).then(({ status, message }) => {
      if (status === 'success') return Promise.resolve();
      throw new Error(`Failed with status = ${status}, message = ${message}`);
    });
  }
}

module.exports = DeviceFactory;
