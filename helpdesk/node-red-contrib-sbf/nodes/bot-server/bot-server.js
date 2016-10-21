var builder = require('botbuilder');
var path = require('path');
var request = require('request');
var util = require('util');
var MSBot = require('./msbot');
var sbf = require('../../initializer');
var BotPersonality = require('./bot-personality');

function getDataFromLUIS(url, subscriptionKey) {
  return function(req, res, next) {
    var options = {
      url: url,
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey
      }
    };
    request(options, function(err, response, body) {
      if (err) {
        res.send(err);
      } else {
        res.json(body);
      }
      return next();
    });
  }
}

function getBotServers(done) {
  var args = {
    url: process.env.NODE_RED_HTTPNODEROOT + '/sbf/bot-servers'
  }
  request(args, function(err, response, body) {
    console.log(err);
    console.log(body);
    if (err) {
      done(err);
    } else {
      done(body);
    }
  });
}

module.exports = function(RED) {

  function botServer(n) {

    // creating the bot-server node
    RED.nodes.createNode(this, n);
    var node = this;
    var app = sbf.getApp();
    // TO DO: find a way to find this file
    var configFile = path.join(__dirname, '../../../sbf-api/bot-server-config.json');

    // get the GLOBAL context
    var serverConfig = require(configFile)[n.name];

    // instantiate a new msbot
    var msbot = new MSBot(
      serverConfig.microsoft.appId,
      serverConfig.microsoft.appPassword,
      util.format(
        process.env.LUIS_APP_URL,
        serverConfig.microsoft.luis.appId,
        serverConfig.microsoft.luis.ocpApimSubscriptionKey
      )
    );
    // exposing the msbot properties from bot-server...
    for (var key in msbot) {
      this[key] = msbot[key];
    }

    // expose the name as it is needs for showing on the UI
    this.name = n.name;
    this.personality = new BotPersonality();

    // set the connector to list to requests
    var connector_url = util.format(
      '%s/%s',
      process.env.NODE_RED_HTTPNODEROOT,
      serverConfig.uri
    );

    // collect metrics on connector url
    app.use(connector_url, function(req, res, next){
      var _body = JSON.parse(JSON.stringify(req.body));
      delete _body.text;
      node.metric("incomming.message", {} , _body);
      next();
    });
    
    app.use(connector_url, msbot.connector.listen());
    // Intents
    var intents_url = util.format(
      '%s/%s/intents',
      process.env.NODE_RED_HTTPNODEROOT,
      this.id
    );
    app.get(
      intents_url,
      getDataFromLUIS(
        util.format(
          process.env.LUIS_INTENTS_URL,
          serverConfig.microsoft.luis.appId
        ),
        serverConfig.microsoft.luis.ocpApimSubscriptionKey
      )
    );

    // Entities
    var entities_url = util.format(
      '%s/%s/entities',
      process.env.NODE_RED_HTTPNODEROOT,
      this.id
    );
    app.get(
      entities_url,
      getDataFromLUIS(
        util.format(
          process.env.LUIS_ENTITIES_URL,
          serverConfig.microsoft.luis.appId
        ),
        serverConfig.microsoft.luis.ocpApimSubscriptionKey
      )
    );

    // Composite Entities
    var compositeEntities_url = util.format(
      '%s/%s/compositeentities',
      process.env.NODE_RED_HTTPNODEROOT,
      this.id
    );
    app.get(
      compositeEntities_url,
      getDataFromLUIS(
        util.format(
          process.env.LUIS_COMPOSITEENTITIES_URL,
          serverConfig.microsoft.luis.appId
        ),
        serverConfig.microsoft.luis.ocpApimSubscriptionKey
      )
    );

    // Hierarchical Entities
    var hierarchicalEntities_url = util.format(
      '%s/%s/hierarchicalentities',
      process.env.NODE_RED_HTTPNODEROOT,
      this.id
    );
    app.get(
      hierarchicalEntities_url,
      getDataFromLUIS(
        util.format(
          process.env.LUIS_HIERARCHICALENTITIES_URL,
          serverConfig.microsoft.luis.appId
        ),
        serverConfig.microsoft.luis.ocpApimSubscriptionKey
      )
    );

  } //end: botServer

  RED.nodes.registerType('bot-server', botServer);
}
