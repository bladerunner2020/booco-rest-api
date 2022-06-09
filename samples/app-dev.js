/* eslint-disable no-console */
const { BoocoRestApi } = require('..');

const booco = new BoocoRestApi({
  port: 3000,
  // socketPort: 5990,
  username: 'admin',
  password: 'admin'
});

booco.on('error', (err) => console.error(err.message));

booco.login().then(async () => {
  console.log('REST API logged on');
  // booco.equipment.setFeedback('Relay', 'relay1', 'on');
  booco.connect();
});

booco.on('connect', () => {
  booco.equipment.subscribeChannels('Relay');
});

booco.equipment.on('channel:Relay:toggleRelay1', (data) => console.log(data));
booco.equipment.on('channel:Relay', (data) => console.log(data));
