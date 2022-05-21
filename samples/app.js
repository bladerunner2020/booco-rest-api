/* eslint-disable no-console */
const { BoocoRestApi } = require('..');

const booco = new BoocoRestApi({
  port: 3000,
  username: 'admin',
  password: 'admin'
});

booco.connect()
  .then(() => {
    booco.log.debug('Connected');
    console.log('Connected');

    booco.equipment
      .getFeedback('Relay')
      .then((feedbacks) => console.log(feedbacks))
      .catch((err) => console.log(err.message));

    booco.equipment.getDevice('Relay').then((device) => console.log(device.name));
  }).catch((err) => {
    console.log(`Error: ${err.message}`);
  });
