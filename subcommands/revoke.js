/**
 * Revoke subcommand
 */

var log = require('fancy-log');
var


revoke = function(certfile) {
    // Read certificate file

    fs.readFile(certfile, 'utf8', function(err, certdata){
        if(err === null) {
            log.info("Successfully read certificate data.");
            // console.log(certdata);

            var pushdata = {
                cert: certdata
            };

            httpclient.request('/certificates/revoke/', 'PUT', pushdata)
                .then(function(response) {
                    log.info("HTTP request successful.");

                    if(response.success){
                        log.info("Successfully revoked certificate");

                        process.exit(0);
                    } else {
                        log.error(">>> Failed to revoke certificate. :( <<<");
                        log.error("Error: " + JSON.stringify(response.errors));
                        log.error("For more information see NodePKI log.");
                        process.exit(1);
                    }
                })
                .catch(function(error) {
                    log.error("HTTP request failed: " + error);
                    process.exit(1);
                });

        } else {
            log.error("Could not read cert file:\r\n" + err);
        }
    });
};


module.exports = revoke;
