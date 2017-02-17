/**
 * "request" subcommand
 */

var log = require('fancy-log');
var fs = require('fs-extra');
var httpclient = require('../httpclient.js');
var exec = require('child_process').exec;
const uuidV4 = require('uuid/v4');
var readlineSync = require('readline-sync');

var requestCert = function(argv) {
    var csrarg = argv.csr;
    var csr = argv.csr;
    var out = argv.out
    var lifetime = argv.lifetime ? argv.lifetime : global.config.cert_lifetime_default;
    var type = argv.type === 'client' ? 'client' : 'server';

    var tempdir;

    new Promise(function(resolve, reject) {
        if(csrarg === undefined) {
            tempdir = 'tmp/' + uuidV4() + '/';
            fs.ensureDirSync(tempdir),
            log("Creating Key and CSR");

            var passphrase = readlineSync.question("Enter a new certificate key passphrase: [Press ENTER to skip] ", { hideEchoBack: true, defaultInput:'none' });
                if(passphrase !== 'none') {
                    var passrepeat = readlineSync.question("Repeat password: ", { hideEchoBack: true, defaultInput:'none' });
                    if(passphrase !== passrepeat) { throw "Passwords do not match!"; }
                }
            var country = readlineSync.question("County ["+global.config.csr_defaults.country+"]: ", { defaultInput: global.config.csr_defaults.country });
            var state = readlineSync.question("State ["+global.config.csr_defaults.state+"]: ", { defaultInput: global.config.csr_defaults.state });
            var locality = readlineSync.question("Locality ["+global.config.csr_defaults.locality+"]: ", { defaultInput: global.config.csr_defaults.locality });
            var organization = readlineSync.question("Organization ["+global.config.csr_defaults.organization+"]: ", { defaultInput: global.config.csr_defaults.organization });
            var commonname = readlineSync.question("CommonName [example.tld]: ", { defaultInput: 'example.tld' });

            // Interactive mode
            passparam = (passphrase === 'none') ? '' : '-aes256 -passout pass:' + passphrase;
            exec('openssl genrsa -out key.pem ' + passparam + ' 2048', {
                cwd: tempdir
            }, function(error, stdout, stderr) {
                if(!error) {
                    // Create csr.
                    passparam = (passphrase === 'none') ? '' : '-passin pass:' + passphrase;
                    exec('openssl req -config ../../openssl.cnf -key key.pem -new -sha256 -out cert.csr ' + passparam + ' -subj "/C='+country+'/ST='+state+'/L='+locality+'/O='+organization+'/CN='+commonname+'"', {
                        cwd: tempdir
                    }, function(error, stdout, stderr) {
                        if(!error) {
                            // ready
                            csr = tempdir + 'cert.csr';
                            log("CSR created. Ready.");
                            resolve();
                        } else {
                            reject("Could not create .csr: " + error);
                        }
                    });
                } else {
                    reject("Could not create .csr: " + error);
                }
            });
        } else {
            resolve();
        }
    }).then(function() {
        //Read cert data from file
        fs.readFile('./' + csr, 'utf8', function(err, csrdata){
            if(err == null) {
                var pushdata = {
                    data: {
                        csr: csrdata,
                        lifetime: lifetime,
                        type: type
                    },
                    auth: {
                        username: global.config.user.username,
                        password: global.config.user.password
                    }
                }

                var cert;

                httpclient.request(global.apipath + '/certificate/request/', 'POST', pushdata)
                    .then(function(response) {
                        log.info("HTTP request successful.");

                        if(response.success){
                            log.info("Certificate could be retrieved :-)");

                            cert = response.cert;

                            new Promise(function(resolve, reject) {
                                if(argv.fullchain) {

                                    // Get intermediate cert to assemble fullchain
                                    var getcacert = require('./getcacert.js');

                                    var postdata = {
                                        data: {
                                            ca: 'intermediate'
                                        }
                                    };
                                    httpclient.request(global.apipath + '/ca/cert/get/', 'POST', postdata).then(function(response){
                                        if(response.success) {
                                            log.info("Successfully received requested certificate :-)");

                                            cert = cert + '\n\n' + response.cert;
                                            resolve();
                                        } else {
                                            log.error("Could not get requested certificate:");
                                            log.error(JSON.stringify(response.errors));
                                            reject();
                                        }
                                    })
                                    .catch(function(error){
                                        log.error("HTTP request failed: " + error);
                                        reject();
                                    });
                                } else {
                                    resolve();
                                }
                            }).then(function(){
                                // Was the cert requested by .csr input or csr creation?
                                if(csrarg === undefined) {
                                    // by csr creation: Private key and cert are output.
                                    // Read private key
                                    var key = fs.readFileSync(tempdir + 'key.pem')

                                    // Check if out is defined
                                    if(out === undefined) {
                                        // output in console
                                        console.log(key + '\n\n');
                                        console.log(cert);
                                    } else {
                                        // output in directory
                                        // Add trailing slash
                                        if (out.substr(-1) != '/') out += '/';

                                        // Check if directory is empty
                                        dircontent = fs.readdirSync(out);

                                        var outpath = out;
                                        if(dircontent.length !== 0) {
                                            log("Output dir is not empty.")
                                            outpath = out + uuidV4() + '/';
                                            fs.ensureDirSync(outpath);
                                        }

                                        // save key and cert to out
                                        fs.writeFileSync(outpath + 'key.pem', key);
                                        fs.writeFileSync(outpath + 'cert.pem', cert)
                                        log("Key and certificate have been written to " + outpath + 'key.pem and ' + outpath + 'cert.pem.');
                                    }
                                } else {
                                    // by csr input: only the cert is output
                                    if(out === undefined) {
                                        console.log(cert);
                                    } else {
                                        // Check if file specified in 'out' already exists
                                        var outpath = out;
                                        if(fs.existsSync(outpath)){
                                            log("Output file already exists.")
                                            var curdir = outpath.substring(0,outpath.lastIndexOf("\/")+1);
                                            var outdir = curdir + uuidV4() + '/'
                                            fs.ensureDirSync(outdir);
                                            outpath = outdir + 'cert.pem';
                                        }

                                        fs.writeFileSync(outpath, cert);
                                        log("Cert written to " + outpath);
                                    }
                                }

                                if(csrarg === undefined) { fs.removeSync(tempdir); }
                                process.exit(0);
                            })
                            .catch(function(err) {
                                // Error while getting intermediate cert for fullchain
                                log("Error while getting intermediate cert for fullchain: " + err);
                            });
                        } else {
                            log.error(">>> Failed to retrieve certificate. :( <<<");

                            log.error(">>> Errors: " + JSON.stringify(response.errors));

                            log.error("For more information see NodePKI log.");
                            if(csrarg === undefined) { fs.removeSync(tempdir); }
                            process.exit(1);
                        }
                    })
                    .catch(function(error) {
                        log.error("HTTP request failed: " + error);
                        process.exit(1);
                    });
            } else {
                log.error("Error reading file:" + err);
                process.exit(1);
            }
        });
    })
    .catch(function(err) {
        // Promise rejected.
        log("Could not request certificate. Reason: " + err);
        process.exit(1);
    });
};

module.exports = requestCert;
