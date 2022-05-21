const Device = require('./device');

class DeviceFactory {
  constructor({ api }) {
    this.api = api;
  }

  getDevice(name) {
    const { api } = this;
    const url = `equipment/${name}`;
    return api.callRestApi({ url }).then(({ status, data, message }) => {
      if (status === 'success') return new Device({ api, options: data });
      throw new Error(`Failed with status = ${status}, message = ${message}`);
    });
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

    if (socketId) {
      const data = {
        socketId,
        devices
      };
      return api.callRestApi({ url, method: 'POST', data }).then(({ status, message }) => {
        if (status === 'success') return Promise.resolve();
        throw new Error(`Failed with status = ${status}, message = ${message}`);
      });
    }

    return new Promise((resolve, reject) => {
      const onError = (err) => {
        // eslint-disable-next-line no-use-before-define
        api.removeListener('connect', onConnect);
        reject(err);
      };
      const onConnect = () => {
        this.subscribe(nameOrNames)
          .then(resolve)
          .catch(reject)
          .finally(() => {
            api.removeListener('connect', onConnect);
            api.removeListener('error', onError);
          });
      };

      api.once('error', onError);
      api.once('connect', onConnect);
    });
  }
}

module.exports = DeviceFactory;
