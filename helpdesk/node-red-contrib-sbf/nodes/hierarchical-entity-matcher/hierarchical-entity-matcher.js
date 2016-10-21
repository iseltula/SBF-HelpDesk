var builder = require('botbuilder');

module.exports = function(RED) {
  function hierarchicalEntityMatcher(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var botServer = RED.nodes.getNode(n.botServer);
    node.status({
      fill: 'green',
      shape: 'dot',
      text: 'bot: ' + botServer.name
    });
    this.on('input', function(msg) {
      payload = {};
      for (var i = 0; i < n.entities.length; i++) {
        var task = builder.EntityRecognizer.findEntity(
          msg.sbf.luisArgs.entities,
          n.entities[i]
        );
        payload[n.entities[i]] = task;
      }
      msg.payload = payload || null;
      node.send(msg);
    });
  }
  RED.nodes.registerType('hierarchical-entity-matcher', hierarchicalEntityMatcher);
}
