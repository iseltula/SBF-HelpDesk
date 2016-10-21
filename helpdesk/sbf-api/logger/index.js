var bunyan = require('bunyan');
var PrettyStream = require('bunyan-prettystream');
var r = require('rethinkdb');
var bunyan_rethink = require('bunyan-rethinkdb').default;
var conn = null;
var connMetric = null;
//var prettyStdOut = new PrettyStream();
//prettyStdOut.pipe(process.stdout);

var stream = [
    //{ stream: prettyStdOut }
]
var streamMetric = [];
if(process.env.LOGGER_DB_URL)
{
	var conn = r.connect({db: 'sbfLogger',host:process.env.LOGGER_DB_URL});
	stream.push({ type: 'raw',level:'info', stream: new bunyan_rethink(r, conn,{tableName :'logs' }) });
}

if(process.env.METRICS_DB_URL)
{
	connMetric = r.connect({db: 'sbfMetrics', host:process.env.METRICS_DB_URL});
	streamMetric.push({ 
		type: 'raw',level:'info', 
		stream: new bunyan_rethink(r, connMetric,{tableName :'metrics' }) 
	});
}

var	metrics = bunyan.createLogger({
  name: 'SBFMetrics',
  streams: streamMetric
});
var logger = bunyan.createLogger({
  name: 'SBFLogger',
  streams: stream
});

var getLogLvls= function(RED){
	var logTypes={
		'10': 'FATAL',
		'20': 'ERROR',
		'30': 'WARN',
		'40': 'INFO',
		'50': 'DEBUG',
		'60': 'TRACE',
		'98': 'AUDIT',
		'99': 'METRIC' 
	}
	return logTypes;
};

module.exports= function(RED){
	var logLevel = getLogLvls(RED);
	var temp = function(settings){
		var handler = function(msg){
			var temp={};
			if(msg.level==99){
			  	temp=JSON.parse(JSON.stringify(msg));
			  	delete temp.level;
			  	metrics.info(temp);
			  	return;
			}
			if( msg && msg.msg && msg.msg!=''){
			  	temp=JSON.parse(JSON.stringify(msg));
			  	temp.value=temp.msg;
			  	temp.node=temp.name || '';
			  	if(temp.id){
			  		temp.nodeId = temp.id;
			  		delete temp.id;
			  	}
			  	if(temp.name){
			  		delete temp.name;
			  	}
				temp.red_level=temp.level;
				temp.logType=logLevel[temp.red_level];
				delete temp.level;
			  	logger.info(temp);
			}
		}
		return handler;
	}
	return temp;
}