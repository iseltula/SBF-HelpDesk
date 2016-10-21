var builder = require('botbuilder');

module.exports = function(RED) {
  RED.nodes.registerType('prompt-choice-dialog', function (config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var isBotRegistered = false;
    this.on('input', function (msg) {
      if (!isBotRegistered) {
        msg.sbf.results = null;
        msg.sbf.botServer.bot.dialog('/' + this.name, [
          function (session, args, next) {
            msg.sbf.botServer.personality
                .getDialogs(msg.sbf.session.message.text, config.dialogs)
                .then(dialogs => {
                  builder.Prompts.choice(
                      session,
                      dialogs,
                      config.options);
                }).catch(err => {
              console.log("Sentiment Error:", err);
              node.send(null);
            });
          },
          function (session, results) {
            msg.payload = results.response.entity;
            msg.sbf.session = session;
            node.send(msg);
          }
        ]);
        isBotRegistered = true;
      }
      msg.sbf.session.beginDialog('/' + this.name, msg);
    });
  });
};
