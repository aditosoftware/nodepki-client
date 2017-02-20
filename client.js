/*
 * NodePKI client for NodePKI server
 *
 * Usage information:
 * $ nodejs client.js help
 */

var http = require('http');
var fs = require('fs-extra');
var log = require('fancy-log');
var yaml = require('js-yaml');
var yargs = require('yargs');

var rootcheck = require('./rootcheck.js');


var subhandlers  = {
    request: require('./subcommands/request.js'),
    list: require('./subcommands/list.js'),
    get: require('./subcommands/get.js'),
    revoke: require('./subcommands/revoke.js'),
    getcacert: require('./subcommands/getcacert.js')
}


/*
 * Make sure there is a config file config.yml
 */
if(fs.existsSync('data/config/config.yml')) {
    log.info("Reading config file data/config/config.yml ...");
    global.config = yaml.safeLoad(fs.readFileSync('data/config/config.yml', 'utf8'));
} else {
    // There is no config file yet. Create one from config.yml.default and quit server.
    log("No custom config file 'data/config/config.yml' found.")
    fs.ensureDirSync('data/config');
    fs.copySync('config.default.yml', 'data/config/config.yml');
    log("Default config file was copied to data/config/config.yml.");
    console.log("\
**********************************************************************\n\
***   Please customize data/config/config.yml according to your    ***\n\
***             environment and restart NodePKI-Client.            ***\n\
**********************************************************************");

    log("Server will quit now.");
    process.exit();
}


/*
 * Check if Root CA certificate exists in root.cert.pem
 * Cert is needed for establishing a secure connection to API server.
 * If not, request via Public server (API-Server port 8080) and show fingerprint.
 * User can then verify cert.
 */

/*
 * Subcommands:
 * request, list, get, revoke
 */
var subcommands = {};
global.apipath = '/api/v1';

subcommands.request = function(yargs) {
    var argv = yargs
        .option('csr', {
            demand: false,
            describe: "CSR file to be processed",
            type: "string"
        })
        .option('out', {
            demand: false,
            describe: "Output file (when using --csr) or output directory",
            type: "string"
        })
        .boolean('fullchain')
        .option('lifetime', {
            demand: false,
            describe: "Lifetime of certificate in days",
            type: "number",
            default: global.config.defaultlifetime
        })
        .option('type', {
            demand: false,
            describe: "Certificate type: 'server' or 'client'. Default: server.",
            type: "string",
            default: 'server'
        })
        .example("$0 request --csr cert.csr --out cert.pem --fullchain", "Process cert.csr and write certificate + intermediate cert to cert.pem")
        .example("$0 request --out out --fullchain", "Create CSR and write certificate + intermediate cert to out/cert.pem")
        .example("$0 request --out out --type client", "Create client certificate.")
        .argv;
    subhandlers.request(argv);
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
        .example("$0 list", "List all certificates")
        .argv;
    subhandlers.list(argv.state);
};

subcommands.get = function(yargs) {
    var argv = yargs
        .option('serialnumber', {
            demand: true,
            describe: "Serial number of certificate",
            type: "string"
        })
        .option('out', {
            demand: false,
            describe: "Output file",
            type: "string"
        })
        .example("$0 get --serialnumber 1001 --out cert.pem", "Get certificate 1001 and save it to cert.pem in the current directory.")
        .argv;
    subhandlers.get(argv.serialnumber, argv.out);
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

subcommands.getcacert = function(yargs) {
    var argv = yargs
        .option('ca', {
            demand: true,
            describe: "Choose which ca cert to retrieve. Can be 'root' or 'intermediate'",
            type: 'string'
        })
        .option('out', {
            demand: false,
            describe: "Output file",
            type: "string"
        })
        .boolean('chain')
        .example("$0 getcacert --ca root --out ca.cert.pem", "Get ca cert of root ca and save it to ca.cert.pem")
        .argv;
    subhandlers.getcacert(argv.ca, argv.out, argv.chain);
};



/**
 * Register subcommands
 */
var argv = yargs
    .usage("Usage: $0 <subcommand> [options]")
    .command("request", "Request a new certificate with or without .csr file", function(yargs){
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
    .command("getcacert", "Get CA certificate", function(yargs){
        subcommands.getcacert(yargs);
    })
    .demandCommand(1)
    .help("h")
    .alias("h", "help")
    .argv
