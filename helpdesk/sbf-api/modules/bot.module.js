var builder = require('botbuilder');
var connector = new builder.ChatConnector({
  appId: '239c5e8d-2120-4962-9ed3-2c6112a4e4d2',
  appPassword: '0Bgpqi4NcikaJhwOPLEA31D'
});
var bot = new builder.UniversalBot(connector);

module.exports = {
  connector: connector,
  bot: bot
};
