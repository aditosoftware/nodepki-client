/*
 * NodePKI client for NodePKI server
 *
 * Usage information:
 * $ nodejs client.js help
 */

var http = require('http');
var fs = require('fs');
var log = require('fancy-log');
var yaml = require('js-yaml');
var yargs = require('yargs');


var subhandlers  = {
    request: require('./subcommands/request.js'),
    list: require('./subcommands/list.js'),
    get: require('./subcommands/get.js'),
    revoke: require('./subcommands/revoke.js')
}


log("Reading config file ...");
global.config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));


/*
 * Subcommands:
 * request, list, get, revoke
 */
var subcommands = {};

subcommands.request = function(yargs) {
    var argv = yargs
        .option('csr', {
            demand: true,
            describe: "CSR file to be processed",
            type: "string"
        })
        .option('outfile', {
            demand: false,
            describe: "Output file",
            type: "string"
        })
        .example("$0 request --csr cert.csr --outfile cert.pem", "Process cert.csr and write certificate to cert.pem")
        .argv;
    subhandlers.request(argv.csr, argv.outfile);
};

subcommands.list = function(yargs) {
    var argv = yargs
        .option('state', {
            demand: false,
            default: 'all',
            describe: "Filter by status: 'all', 'verified', 'revoked', 'expired'.",
            type: 'string'
        })
        .example("$0 list --state revoked", "List all revoked certificates.")
        .argv;
    subhandlers.list(argv.state);
};

subcommands.get = function(yargs) {
    var argv = yargs
        .option('serialno', {
            demand: true,
            describe: "Serial number of certificate",
            type: "string"
        })
        .option('outfile', {
            demand: false,
            describe: "Output file",
            type: "string"
        })
        .example("$0 get --serialno 1001 --outfile cert.pem", "Get certificate 1001 and save it to cert.pem in the current directory.")
        .argv;
    subhandlers.get(argv.serialno, argv.outfile);
};

subcommands.revoke = function(yargs) {
    var argv = yargs
        .option('cert', {
            demand: true,
            describe: "File of certificate to be revoked.",
            type: 'string'
        })
        .example("$0 revoke --cert cert.pem", "Revoke cert.pem")
        .argv;
    subhandlers.revoke(argv.cert);
};



/**
 * Register subcommands
 */
var argv = yargs
    .usage("Usage: $0 <subcommand> [options]")
    .command("request", "Request a new certificate via .csr file", function(yargs){
        subcommands.request(yargs);
    })
    .command("list", "List issued certificates", function(yargs){
        subcommands.list(yargs);
    })
    .command("get", "Get issued certificate by serial number", function(yargs){
        subcommands.get(yargs);
    })
    .command("revoke", "Revoke certificate via cert file", function(yargs){
        subcommands.revoke(yargs);
    })
    .demandCommand(1)
    .help("h")
    .alias("h", "help")
    .argv
