var _ = require('lodash');
module.exports = function(RED) {
    RED.nodes.registerType('text-dialog', function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        /*RED.events.on("nodes-started",function() {
         setConfigIsDifferentBotServer(RED,node,config)
         });*/
        this.on('input', function (msg) {
            msg.sbf.session.sendTyping();
            msg.sbf.botServer.personality
                .getDialogs(msg.sbf.session.message.text, config.dialogs)
                .then(dialogs => {
                    msg.sbf.session.send(dialogs, msg.payload);
                    node.send(msg);
                }).catch(err => {
                console.log("Sentiment Error:", err);
                node.send(null);
            });
        });
    });
};

function setConfigIsDifferentBotServer(RED,node,config) {
    var allStartNodes = getStartIntentMatcher(RED);
    allStartNodes.forEach(function (startNode) {
        var connectedNodes = getNodesFromWires(RED, startNode);
        var found = connectedNodes.find(x=>x.id == node.id);
        var botServer = RED.nodes.getNode(startNode.botServer);
        if(found){
            if(config.botServer != startNode.botServer) {
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: 'bot should be ' + botServer.name
                });
            }else {
                node.status({});
            }
        }
    });
}
function getStartIntentMatcher(RED){
    var startIntentMatcherNode = [];
    RED.nodes.eachNode((node)=>{
        if(node.type === "start-intent-matcher"){
            startIntentMatcherNode.push(node);
        }
    });
    return startIntentMatcherNode;
}

function getNodesFromWires(RED,node){
    if(!node || !node.wires || !node.wires.length)
        return [];
    var foundNodes = [];
    var nodeIds = _.uniq(_.flatten(node.wires));
    nodeIds.forEach((nodeId)=>{
        var nextNode = RED.nodes.getNode(nodeId);
        if(nextNode){
            foundNodes.push(nextNode);
            foundNodes = foundNodes.concat(getNodesFromWires(RED,nextNode));
        }
    });
    return foundNodes;
}