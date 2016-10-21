var builder = require('botbuilder');

module.exports = function(RED) {
  RED.nodes.registerType('thumbnail-dialog', function(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.on('input', function(msg) {
		var card = new builder.ThumbnailCard(msg.sbf.session)
	        .images([
	          builder.CardImage.create(msg.sbf.session, config.imageuri)
	        ])
	        .title(config.title)
	        .text(config.text);
	    if(config.subtitle){
	    	card.subtitle(config.subtitle);
	    }
	    if(config.tapUrl){
	    	card.tap(builder.CardAction.openUrl(msg.sbf.session, config.tapUrl));
	    }
	    var thumbnail = new builder.Message(msg.sbf.session).attachments([card]);
	    msg.sbf.session.send(thumbnail);
	    node.send(msg);
    });    
  });
};
