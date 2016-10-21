var builder = require('botbuilder');

module.exports = function(RED) {
  RED.nodes.registerType('prompt-dialog', function (config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var isBotRegistered = false;

    this.on('input', function (msg) {
      if (!isBotRegistered) {
        msg.sbf.botServer.bot.dialog('/' + this.name, [
          function (session, args) {
            msg.sbf.botServer
                .personality
                .getDialogs(msg.sbf.session.message.text, config.dialogs)
                .then(dialogs => {
                  builder.Prompts[config.dialogType](
                      session,
                      dialogs);
                }).catch(err => {
                   console.log("Sentiment Error:", err);
                  node.send(null);
                });
          },
          function (session, results) {
            msg.payload = results.response;
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
