/**
 * "request" subcommand
 */

var log = require('fancy-log');
var fs = require('fs-extra');
var httpclient = require('../httpclient.js');
var exec = require('child_process').exec;
const uuidV4 = require('uuid/v4');
var readlineSync = require('readline-sync');

var requestCert = function(csrarg, outfile) {
    var csr = csrarg;
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
            var country = readlineSync.question("County [DE]: ", { defaultInput: 'DE' });
            var state = readlineSync.question("State [Bayern]: ", { defaultInput: 'Bayern' });
            var locality = readlineSync.question("Locality [Geisenhausen]: ", { defaultInput: 'Geisenhausen' });
            var organization = readlineSync.question("Organization [ADITO Software GmbH]: ", { defaultInput: 'ADITO Software GmbH' });
            var commonname = readlineSync.question("CommonName [example.com]: ", { defaultInput: 'example.adito.de' });

            // Interactive mode
            passparam = (passphrase === 'none') ? '' : '-aes256 -passout pass:' + passphrase;
            exec('openssl genrsa -out key.pem ' + passparam + ' 2048', {
                cwd: tempdir
            }, function() {
                // Create csr.
                passparam = (passphrase === 'none') ? '' : '-passin pass:' + passphrase;
                exec('openssl req -config ../../openssl.cnf -key key.pem -new -sha256 -out cert.csr ' + passparam + ' -subj "/C='+country+'/ST='+state+'/L='+locality+'/O='+organization+'/CN='+commonname+'"', {
                    cwd: tempdir
                }, function() {
                    // ready
                    csr = tempdir + 'cert.csr';
                    log("CSR created. Ready.");
                    resolve();
                })
            });
        } else {
            resolve();
        }
    }).then(function() {
        //Read cert data from file
        fs.readFile('./' + csr, 'utf8', function(err, csrdata){
            if(csrarg === undefined) { fs.removeSync(tempdir); }

            if(err == null) {
                var pushdata = {
                    csr: csrdata,
                    applicant: "Thomas Leister"
                }

                httpclient.request('/certificates/request/', 'PUT', pushdata)
                    .then(function(response) {
                        log.info("HTTP request successful.");

                        if(response.success){
                            log.info("Certificate could be retrieved :-)")

                            if(typeof outfile === 'string') {
                                // Write certificate to file
                                fs.writeFileSync(outfile, response.cert);
                                log("Certificate written to " + outfile);
                            } else {
                                // echo certificate
                                console.log("\r\n\r\n" + response.cert + "\r\n");
                            }

                            process.exit(0);
                        } else {
                            log.error(">>> Failed to retrieve certificate. :( <<<");

                            log.error("Errors: " + JSON.stringify(response.errors));

                            log.error("Maybe there was already another certificate issued from the submitted .csr?");
                            log.error("For more information see NodePKI log.");
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
