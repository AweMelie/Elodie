// loaders/index.js
const loadCommands = require('./loadCommands');
const loadEvents   = require('./loadEvents');
const loadButtons  = require('./loadButtons');
const loadModals   = require('./loadModals');

module.exports = client => {
  loadCommands(client);
  loadEvents(client);
  loadButtons(client);
  loadModals(client);
};