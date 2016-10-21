var express = require('express');
var router = express.Router();
var serverConfigs = require('../bot-server-config.json');



router.get(
  '/bot-servers',
  function(req, res, next) {
    res.send(serverConfigs);
  }
);

router.get(
  '/:botServerName/intents',
  function(req, res, next) {
    res.send(serverConfigs[req.params.botServerName]);
  }
);
module.exports = router;
