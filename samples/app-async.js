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
  // booco.log.debug('Connected');
  console.log('REST API logged on');

  const feedbacks = await booco.equipment.getFeedback('Relay');
  console.log(feedbacks);
  const device = await booco.equipment.getDevice('Relay');
  console.log(await device.getFeedback('relay1'));
  await device.setChannel('toggleRelay1');
  console.log(await device.getFeedback('relay1'));

  booco.on('connect', () => {
    device.subscribe();
    booco.equipment.subscribe(['Projector 1', 'Projector 2']);
    booco.equipment.subscribe('Player 1');
  });

  booco.connect();
});

booco.equipment.on('Relay.relay5', (value, oldValue) => {
  console.log(value, oldValue);
});

booco.equipment.on('Player 1', (value) => {
  console.log(value);
});

// setTimeout(() => booco.destroy(), 10000);
