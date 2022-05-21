/* eslint-disable no-console */
const { BoocoRestApi } = require('..');

const booco = new BoocoRestApi({
  port: 3000,
  // socketPort: 5990,
  username: 'admin',
  password: 'admin'
});
booco.on('error', (err) => console.error(err.message));
booco.connect().then(async () => {
  // booco.log.debug('Connected');
  console.log('Connected');

  const feedbacks = await booco.equipment.getFeedback('Relay');
  console.log(feedbacks);
  const device = await booco.equipment.getDevice('Relay');
  console.log(await device.getFeedback('relay1'));
  await device.setChannel('toggleRelay1');
  console.log(await device.getFeedback('relay1'));

  await booco.equipment.subscribe(['Relay']);
});

booco.equipment.on('Relay.relay5', (value, oldValue) => {
  console.log(value, oldValue);
});

// setTimeout(() => booco.destroy(), 10000);
