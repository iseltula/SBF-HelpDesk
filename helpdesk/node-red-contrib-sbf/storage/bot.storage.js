var redis = require("redis");
var client = redis.createClient();

client.on("error", function (err) {
    console.log("Not able to connect to Redis " + err);
});

function getConvData(context, data, callback){
    client.get(context.conversationId+'_conversationStore', function(err, dat2) {
        data.conversationData=JSON.parse(dat2);
        callback(null, data);
    });
}
function getPrivateConvData(context, data, callback){
    var key = context.userId + ':' + context.conversationId+'_conversationStore';
    client.get(key, function(err, dat) {
        data.privateConversationData=JSON.parse(dat);
        if (context.persistConversationData && context.conversationId) {
            getConvData(context, data, callback);
        }else{
            callback(null, data);
        }
    });
}
function getUserData(context, data, callback){
    client.get(context.userId+'_userStore', function(err, reply) {
        data.userData = JSON.parse(reply);
        if (context.conversationId) {
            getPrivateConvData(context, data, callback);
        }else{
            if (context.persistConversationData && context.conversationId) {
                    getConvData(context, data, callback);
            }else{
                callback(null, data);
            }
        }
    });
}
exports.getData = function (context, callback) {
    var data = {};
    if (context.userId) {
        if (context.persistUserData) {
            getUserData(context, data, callback)
        }else{
            if (context.conversationId) {
                getPrivateConvData(context, data, callback);
            }else{
                if (context.persistConversationData && context.conversationId) {
                    getConvData(context, data, callback);
                }else{
                    callback(null,data);
                }
            }
        }
    }else{
        callback(null,data);
    }
};
exports.saveData = function (context, data, callback) {
    if (context.userId) {
            if (context.persistUserData) {
                client.set(context.userId+'_userStore',JSON.stringify(data.userData || {}));
            }
            if (context.conversationId) {
                client.set(context.userId+':'+context.conversationId+
                    '_conversationStore',JSON.stringify(data.privateConversationData || {}));
            }
        }
        if (context.persistConversationData && context.conversationId) {
            client.set(context.conversationId+'_conversationStore',JSON.stringify(data.conversationData || {}));
        }
        callback(null);
};

exports.deleteData = function (context) {
    if (context.userId) {
        if (context.conversationId) {
            client.del(context.conversationId+'_conversationStore',function(){});
        }
        else {
            client.del(context.userId+'_userStore',function(){});
            client.keys(context.userId + ':',function(err,keys){
                if(keys && keys.length>0){
                     client.del(keys,function(){});
                }
            });
        }
    }
};
