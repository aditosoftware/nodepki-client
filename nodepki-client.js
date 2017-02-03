/*
 * Requests a certificate
 * Usage: nodejs certrequest.js
 */

var http = require('http');
var fs = require('fs');
var log = require('fancy-log');
var yaml = require('js-yaml');
var yargs = require('yargs');

var subhandlers  = {
    request: require('./subcommands/request.js'),
    list: require('./subcommands/list.js'),
    get: require('./subcommands/get.js')
}


log.info("Reading config file ...");
global.config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));


var subcommands = {};

subcommands.request = function(yargs) {
    log.info("Requesting certificate from .csr");
    var argv = yargs.demandOption(['csr']).argv;
    subhandlers.request(argv.csr);
};

subcommands.list = function(yargs) {
    log.info("Requesting list of certificates");
    var argv = yargs.demandOption(['state']).argv;
    subhandlers.list(argv.state);
};

subcommands.get = function(yargs) {
    log.info("Requesting certificate by serial number");
    var argv = yargs.demandOption(['serialno']).argv;
    subhandlers.get(argv.serialno);
};



/**
 * Register subcommands
 */
var argv = yargs.usage("$0 command")
    .command("request", "Request a new certificate via .csr file", function(yargs){
        subcommands.request(yargs);
    })
    .command("list", "List issued certificates.", function(yargs){
        subcommands.list(yargs);
    })
    .command("get", "Get issued certificate by serial number", function(yargs){
        subcommands.get(yargs);
    })
    .command("revoke", "Revoke certificate")
    .help("h")
    .alias("h", "help")
    .argv
