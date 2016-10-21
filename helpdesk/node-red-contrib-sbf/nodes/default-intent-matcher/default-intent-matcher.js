module.exports = function(RED) {
  function defaultIntentMatcher(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    if (config.botServer) {
      var botServer = RED.nodes.getNode(config.botServer)
      botServer.intent.onDefault(function(session, args) {
        console.log(arguments);
        node.send({
          payload: {},
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
  }
  RED.nodes.registerType('default-intent-matcher', defaultIntentMatcher);
};
