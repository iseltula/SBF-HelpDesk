module.exports = function(RED) {
  RED.nodes.registerType('start-intent-matcher', function(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    if (config.botServer) {
      var botServer = RED.nodes.getNode(config.botServer);
      botServer.intent.matches(config.intentPattern, function(session, args) {
        node.send({
          payload: {},
          state: {},
          sbf: {
            session: session,
            botServer: botServer,
            luisArgs: args
          }
        });
      });
      node.status({
        fill: 'green',
        shape: 'dot',
        text: 'bot: ' + botServer.name
      });
    } else {
      node.status({
        fill: 'red',
        shape: 'dot',
        text: 'not connected'
      });
    }
  });
};
