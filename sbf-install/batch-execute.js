var exec = require('child_process').exec,
	spawn = require('child_process').spawn 
    path = require('path'),
    os   = require('os');
fs   = require('fs');

// HACK: to make our calls to exec() testable,
// support using a mock shell instead of a real shell
var shell = process.env.SHELL || 'sh';

// support for Win32 outside Cygwin
if (os.platform() === 'win32' && process.env.SHELL === undefined) {
    shell = process.env.COMSPEC || 'cmd.exe';
}

// Merges the current environment variables and custom params for the environment used by child_process.exec()
function createEnv(params) {
    var env = {};
    var item;

    for (item in process.env) {
        env[item] = process.env[item];
    }

    for(item in params) {
        env[item] = params[item];
    }

    return env;
}

// scriptFile must be a full path to a shell script
exports.exec = function (scriptFile, workingDirectory, environment, callback) {
    var cmd;

    if (!workingDirectory) {
        callback(new Error('workingDirectory cannot be null'), null, null);
    }

    if (!fs.existsSync(workingDirectory)) {
        callback(new Error('workingDirectory path not found - "' + workingDirectory + '"'), null, null);
    }

    if (scriptFile === null) {
        callback(new Error('scriptFile cannot be null'), null, null);
    }

    if (!fs.existsSync(scriptFile)) {
        callback(new Error('scriptFile file not found - "' + scriptFile + '"'), null, null);
    }

    // transform windows backslashes to forward slashes for use in cygwin on windows
    if (path.sep === '\\') {
        scriptFile = scriptFile.replace(/\\/g, '/');
    }

    // TODO: consider building the command line using a shell with the -c argument to run a command and exit
    cmd = '"' + shell + '" "' + scriptFile + '"';

    // execute script within given project workspace
    var batchProcess = exec(cmd,
        {
            cwd: workingDirectory,
            env: createEnv(environment)
        },
        function (error, stdout, stderr) {
            // TODO any optional processing before invoking the callback

            callback(error, stdout, stderr);
        }
    );
	batchProcess.stdout.on('data', function(data) {
		console.log(data); 
	});
};
exports.spawn = function (scriptFile, workingDirectory, environment, callback) {
    var cmd;

    if (!workingDirectory) {
        callback(new Error('workingDirectory cannot be null'), null, null);
    }

    if (!fs.existsSync(workingDirectory)) {
        callback(new Error('workingDirectory path not found - "' + workingDirectory + '"'), null, null);
    }

    if (scriptFile === null) {
        callback(new Error('scriptFile cannot be null'), null, null);
    }

    if (!fs.existsSync(scriptFile)) {
        callback(new Error('scriptFile file not found - "' + scriptFile + '"'), null, null);
    }

    // transform windows backslashes to forward slashes for use in cygwin on windows
    if (path.sep === '\\') {
        scriptFile = scriptFile.replace(/\\/g, '/');
    }

    // TODO: consider building the command line using a shell with the -c argument to run a command and exit
    //cmd = '"' + shell + '" "' + scriptFile + '"';

    // execute script within given project workspace
    var ls = spawn(scriptFile,[],
        {
            cwd: workingDirectory,
            env: createEnv(environment)
        },
        function (error, stdout, stderr) {
            // TODO any optional processing before invoking the callback

            callback(error, stdout, stderr);
        }
    );
	ls.stdout.on('data', (data) => {
		console.log(data.toString());
	});

	ls.stderr.on('data', (data) => {
		console.log(data.toString());
	});

	ls.on('close', (code) => {
		callback();
	});
};