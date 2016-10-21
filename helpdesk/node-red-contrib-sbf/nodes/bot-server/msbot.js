var builder = require('botbuilder');

module.exports = function(appId, appPassword, luisIntentUrl) {
  var connector = new builder.ChatConnector({
    appId: appId,
    appPassword: appPassword
  });
  var recognizer = new builder.LuisRecognizer(luisIntentUrl);
  var opts = {};
  if (process.env.ISCLUSTER) {
    opts.storage = require('../../storage/bot.storage.js');
  }
  var bot = new builder.UniversalBot(connector, opts);

  var intent = new builder.IntentDialog({
    recognizers: [recognizer]
  });

  bot.dialog('/', intent);

  return {
    bot: bot,
    intent: intent,
    connector: connector
  }
};
