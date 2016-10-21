var builder = require('botbuilder');

module.exports = function(RED) {
  RED.nodes.registerType('end-intent-matcher', function(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {
            msg.sbf.session.endDialog();
    });
  });
};

