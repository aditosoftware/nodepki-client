/**
 * "request" subcommand
 */

log = require('fancy-log');
fs = require('fs');
httpclient = require('../httpclient.js');

var requestCert = function(csr) {
    //Read cert data from file
    fs.readFile('./' + csr, 'utf8', function(err, csrdata){
        if(err == null) {
            httpclient.request('/certificate/request/', 'PUT', csrdata)
                .then(function(response) {
                    log.info("HTTP request successful.");

                    if(response.success){
                        log.info("Certificate could be retrieved :-)")

                        // echo certificate
                        console.log("\r\n\r\n" + response.cert + "\r\n");

                        process.exit(0);
                    } else {
                        log.error(">>> Failed to retrieve certificate. :( <<<");
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
        }
    });
};

module.exports = requestCert;
