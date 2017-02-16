/**
 * Subcommand 'getcacert'
 */


var log = require('fancy-log');
var httpclient = require('./../httpclient.js');
var fs = require('fs');


var getcacert = function(ca, out, chain) {
    // get ca cert file
    log("Getting cert for " + ca + " CA  ...")

    var postbody = {
        data: {
            ca: ca,
            chain: chain
        }
    }

    httpclient.request(global.apipath + '/ca/cert/get/', 'POST', postbody)
        .then(function(response){
            log.info("Received HTTP response :-)");

            if(response.success) {
                log.info("Successfully received requested certificate :-)");

                if(typeof out === 'string') {
                    // Write certificate to file
                    fs.writeFileSync(out, response.cert);
                    log("Cert written to " + out);
                } else {
                    console.log("\r\n\r\n" + response.cert + "\r\n");
                }
            } else {
                log.error("Could not get requested certificate:");
                log.error(JSON.stringify(response.errors));
            }
        })
        .catch(function(error){
            log.error("HTTP request failed: " + error);
        });
};

module.exports = getcacert;
