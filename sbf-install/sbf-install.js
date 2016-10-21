#!/usr/bin/env node

require('dotenv').config({
	path: __dirname+'/.env'
});
var os = require('os');
var program = require('commander');
var commands = require('./commands');

// 1 sbf-install create [sbf-api,npm link node-red-contrib-sbf]
program
  .command('create') 
  .description('Create application instances')
  .option("-k, --apiKey <secret>", "Secret key") //Need to change description
  .option("-n, --name <name>", "Name of folder") //Need to change description
  .action(function(options){
	commands.create(options.apiKey,options.name)
	.then(()=>{
		console.log(`Successfully created, run start.bat from ${options.name} folder`);
	})
	.catch(x=>{
		console.error(x);
	})
  });

program
  .command('install')
  .description('Install nodes/flows')
  .option("-k, --apiKey <secret>", "Secret key") //Need to change description
  .option("-n, --name <name>", "Package Name") //Need to change description
  .action(function(options){
	commands.installPackage(options.apiKey,options.name)
	.then(()=>{
		console.log('Successfully Installed, please restart instance!');
	})
	.catch(x=>{
		console.error(x);
	});
  });

program
	.command('uninstall')
	.description('uninstall nodes/flows')
	.option("-n, --name <name>", "Package Name") //Need to change description
	.action(function(options){
		commands.uninstallPackage(options.name)
			.then(()=>{
				console.log('Successfully uninstalled, please restart instance!');
			})
			.catch(x=>{
				console.error(x);
			});
	});
program.parse(process.argv);

 if (!process.argv.slice(2).length) {
		program.outputHelp(function(text){
			return text;
	});
}


