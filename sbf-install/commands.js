var co = require('co');
var https = require('https');
var fs = require('fs-extra');
var path = require('path');
var AdmZip = require('adm-zip');
var FindFolder = require('node-find-folder');
var exec = require('./batch-execute').exec;
var spawn = require('./batch-execute').spawn;
var util = require('util');
function download(url, dest) {
  console.log("Downloading started..")
  return new Promise((resolve,reject)=>{
	var file = fs.createWriteStream(dest);
	https.get(url, function(response) {
		if([200,302].indexOf(response.statusCode)==-1){
			return reject(new Error(response.statusCode+": "+response.statusMessage));
		}
		response.pipe(file);
		file.on('finish', function() {
			console.log("Downloading completed..")
			file.close();
			resolve(dest);
		});
	});
  }) 
}

function extractZip(zipFile,entries,dest) {
	try
	{
		var zip = new AdmZip(zipFile);
		var zipEntries = zip.getEntries(); // an array of ZipEntry records
		if(entries && entries.length){
			entries.forEach(entry=>{
				zip.extractEntryTo(entry, path.join(dest,entry),true);
			});
		}else {
			zip.extractAllTo(dest,true);
		}
		return Promise.resolve();
	}catch(err){
		return Promise.reject(err);
	}	
}
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
function createEmptyDirectory(dirPath){
	return new Promise((resolve,reject)=>{
		fs.rmdir(dirPath,(err)=>{
			if(err && err.code == "ENOTEMPTY"){
				return reject(new Error(`Directory not empty : ${dirPath}`));
			}
			fs.mkdir(dirPath,(err)=>{
				if(err){
					return reject(err) 
				}
				resolve(dirPath);
			});
		});
	})
}
function deleteFileFolder(path){
	return new Promise((resolve,reject)=>{
		fs.remove(path,(err)=>{
			return err?reject(err):resolve();
		});
	});
}
function WriteFile(filePath,data){
	return new Promise((resolve,reject)=>{
		fs.writeFile(filePath,data || '',(err)=>{
			if(err)
				return reject(err)
			resolve();
		});
	});
}
function checkToken(token){
	var url = util.format(process.env.AUTH_TOKEN_URL,token);
	return new Promise((resolve,reject)=>{
		https.get(url, function(response) {
			if(response.statusCode != 200){
				return reject(new Error(`${response.statusCode} - ${response.statusMessage}, Can not Authorize Token, Aborting installation.`));
			}
			resolve();
		})
	})
}
function create(token,name){
		var url = util.format(process.env.API_ARCHIVE_URL,token);
		var dirPath =  path.join(process.cwd(),name);
		var tempFolder = path.join(os.tmpdir(),guid());
		return co(function*(){
			yield checkToken(token);
			dirPath = yield createEmptyDirectory(dirPath);
			tempFolder = yield createEmptyDirectory(tempFolder);
			var zipPath = yield download(url,tempFolder+"/sbf.zip");
			console.log("Zip created")
			yield extractZip(zipPath,null,tempFolder); //
			console.log(`Zip extracted`);
			yield deleteFileFolder(zipPath);
			var sbfApiDir = yield searchAndMoveFolder(tempFolder,"sbf-api",dirPath);
			var sbfFrameworkDir = yield searchAndMoveFolder(tempFolder,"node-red-contrib-sbf",dirPath);
			console.log(sbfFrameworkDir);
			yield runBatch(__dirname+'/batch-sbf-install-template.cmd',{
				sbfFrameworkDir:sbfFrameworkDir,
				sbfApiDir:sbfApiDir,
				sbfNodePackageName:"node-red-contrib-sbf"
			});
			var startBatch = `cd\r\ncd sbf-api\r\nnpm start`;
			yield WriteFile(path.join(dirPath,"start.bat"),startBatch);
			process.chdir(dirPath);
			yield deleteFileFolder(tempFolder);
		});
}

function getFirstFolder(dirpath) {
	return new Promise((resolve,reject)=>{
		fs.readdir(dirpath,(err,list)=>{
			if(err){
				return reject(err)
			}
			resolve(list && list.length?path.resolve(dirpath,list[0]):null);
		});
	});
}

function installPackage(token,name) {
	var url = util.format(process.env.PACKAGE_ARCHIVE_URL, name, token);
	var dirPath = process.cwd();
	var tempFolder = path.join(os.tmpdir(), guid());
	return co(function*() {
		yield checkToken(token);
		var sbfApiDir = path.join(dirPath, "sbf-api");
		fs.accessSync(sbfApiDir, fs.F_OK);// will throw error if not present
		tempFolder = yield createEmptyDirectory(tempFolder);
		var zipPath = yield download(url, tempFolder + `/${name}.zip`);
		console.log("Zip created");
		yield extractZip(zipPath, null, tempFolder); //
		console.log(`Zip extracted`);
		yield deleteFileFolder(zipPath);
		var packageFolder = yield getFirstFolder(tempFolder);
		if (!packageFolder) {
			throw new Error(`${name} package not found.`);
		}
		try
		{
			fs.accessSync(path.join(packageFolder,"package.json"),fs.F_OK);// Check if package.json exist
		}
		catch(ex){
			throw new Error("Invalid sbf node/flow, package.json does not exist");
		}
		
		yield copyFolder(packageFolder, dirPath + '/' + name);
		var flowsFolderPath = path.join(packageFolder,"/.nodered/lib/flows");
		try {
			fs.accessSync(flowsFolderPath,fs.F_OK);
			yield moveFolder(flowsFolderPath, sbfApiDir + '/.nodered/lib/flows/'+name);
		}
		catch(ex){
			// Not found, Don't do anything
		}
		yield runBatch(__dirname + '/batch-install-package-template.cmd', {
			sbfPackageDir: path.join(dirPath, name),
			sbfApiDir: sbfApiDir,
			sbfNodePackageName: name
		});
		yield deleteFileFolder(tempFolder);
	});
}
function uninstallPackage(name) {
	var dirPath = process.cwd();
	return co(function*() {
		var sbfApiDir = path.join(dirPath, "sbf-api");
		fs.accessSync(sbfApiDir, fs.F_OK);// will throw error if not present
		// Remove flows
		var flowDir = sbfApiDir + '/.nodered/lib/flows/'+name;
		fs.removeSync(flowDir);
		yield runBatch(__dirname + '/batch-uninstall-package-template.cmd', {
			sbfPackageDir: path.join(dirPath, name),
			sbfApiDir: sbfApiDir,
			sbfNodePackageName: name
		});
		fs.removeSync(path.join(dirPath, name));
	});
}
/*
function installFlow(token,name) {
	var url = util.format(process.env.API_ARCHIVE_URL, token);
	var dirPath = process.cwd();
	var tempFolder = path.join(os.tmpdir(), guid());
	return co(function*() {
		var sbfFolderApi = yield searchFolder(dirPath, "sbf-api");
		if(!sbfFolderApi){
			throw new Error("Please select app folder.");
		}
		tempFolder = yield createEmptyDirectory(tempFolder);
		var zipPath = yield download(url, tempFolder + "/sbf.zip");
		console.log("Zip created", zipPath)
		yield extractZip(zipPath, null, tempFolder); //
		console.log(`Zip extracted`);
		yield deleteFileFolder(zipPath);
		console.log(`Zip deleted`);
		var flowFolder = yield searchFolder(tempFolder, "flows-library");
		if (!flowFolder) {
			throw  new Error("Directory structure modified.");
		}

		var flowFileName =`flow_` + name + '.json';
		var flowFilePath = path.join(flowFolder, flowFileName);
		var stats = fs.statSync(flowFile);
		if (!stats.isFile()) {
			throw new Error(`Flow ${name} not found.`);
		}
		stats = fs.statSync(path.join(sbfFolderApi,".nodered"));
		if(!stats.isDirectory()){}
		fs.createReadStream(flowFile).pipe(fs.createWriteStream(sbfFolderApi+""));
	});
}
*/
function searchFolder(tempFolder,toSearch) {
	return new Promise((resolve,reject)=>{
		var cwd = process.cwd();
		process.chdir(tempFolder);
		var folder = new FindFolder(toSearch);
		process.chdir(cwd);
		if(!folder.length){
			return reject(new Error(`Folder not found ${toSearch}`));
		}
		resolve(path.join(tempFolder,folder[0]));
	});
}

function searchAndMoveFolder(tempFolder,toSearch,dirPath) {
	return new Promise((resolve, reject)=> {
		searchFolder(tempFolder, toSearch)
			.then(apiFolder=> {
				moveFolder(apiFolder, path.join(dirPath, path.basename(apiFolder)))
					.then(resolve)
					.catch(reject);
			})
			.catch(reject);
	});
}

function moveFolder(src,dest) {
	return new Promise((resolve,reject)=>{
		fs.move(src, dest, function (err) {
			if (err) {
				return reject(err);
			}
			resolve(dest);
		});
	})
}
function copyFolder(src,dest) {
	return new Promise((resolve,reject)=>{
		fs.copy(src, dest, function (err) {
			if (err) {
				return reject(err);
			}
			resolve(dest);
		});
	})
}
function runBatch(batchFilePath,options) {
	options = options || {};
	var tempBatchFile =  path.dirname(batchFilePath)+"/batch-file.cmd";;
	var promise = new Promise((resolve,reject)=>{
		fs.readFile(batchFilePath,'utf8',function(err, data){
			if(err)
				return reject(err);
			for(var opt in options){
				data = data.replace(new RegExp(opt,"g"),options[opt]);
			}
			
			fs.writeFile(tempBatchFile,data,function(err){
				if(err)
					return reject(err);
				spawn(tempBatchFile,process.cwd(),{},function(error, stdout, stderr) {
					if(error){
						return reject(error);
					}
					resolve();
				});	
			});
		});
	});
	
	return promise
	.then(()=>{
		fs.remove(tempBatchFile,()=>{});
	})
	.catch(()=>{
		fs.remove(tempBatchFile,()=>{});
	});	
}

module.exports.create = create;
module.exports.installPackage = installPackage;
module.exports.uninstallPackage = uninstallPackage;
