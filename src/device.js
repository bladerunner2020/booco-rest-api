class Device {
  constructor({ api, options }) {
    this.api = api;
    Object.assign(this, options);
  }

  getFeedback(feedback) {
    const { name } = this;
    const url = feedback ? `equipment/get/${name}/${feedback}` : `equipment/get/${name}`;

    return this.api.callRestApi({ url }).then(({ status, data, message }) => {
      if (status === 'success') return data;
      throw new Error(`Failed with status = ${status}, message = ${message}`);
    });
  }

  setChannel(channel, value) {
    const { api, name } = this;
    const url = typeof value !== 'undefined' ? `equipment/set/${name}/${channel}/${value}`
      : `equipment/set/${name}/${channel}`;

    return api.callRestApi({ url }).then(({ status, data, message }) => {
      if (status === 'success') return data;
      throw new Error(`Failed with status = ${status}, message = ${message}`);
    });
  }

  subscribe() {
    const { api, name } = this;
    return api.equipment.subscribe([name]);
  }
}

module.exports = Device;
