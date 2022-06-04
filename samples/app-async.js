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
  booco.log.info('Connected from script - привет!');
  console.log('REST API logged on');

  const feedbacks = await booco.equipment.getFeedback('Relay');
  console.log(feedbacks);
  await booco.equipment.setChannel('Relay', 'toggleRelay5'); // called before subscription!
  booco.connect();
});

booco.on('connect', () => {
  booco.equipment.subscribe(['Relay', 'Projector 1', 'Projector 2']);
  booco.equipment.subscribe('Player 1');
});

booco.equipment.on('Relay.relay5', (value, oldValue) => {
  console.log(`Relay.relay5: ${oldValue} => ${value}`);
});

booco.equipment.on('Player 1', (value) => {
  console.log(value);
});

booco.equipment.on('Projector 1', (value) => {
  console.log(value);
});

booco.equipment.on('Projector 2', (value) => {
  console.log(value);
});

// setTimeout(() => booco.destroy(), 10000);
