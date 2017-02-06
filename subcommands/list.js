/**
 * List Subcommand
 */

var log = require('fancy-log');
var httpclient = require('./../httpclient.js');
var Table = require('easy-table');

list = function(state) {
    httpclient.request('/certificates/list/' + state + '/', 'GET', null)
        .then(function(response){
            log.info("HTTP request was successful");

            if(response.success) {
                if(response.certs.length > 0) {
                    var t = new Table;

                    response.certs.forEach(function(cert) {
                        var state;

                        switch(cert.state) {
                            case 'V':
                                state = 'Valid';
                                break;
                            case 'R':
                                state = 'Revoked';
                                break;
                            case 'E':
                                state = 'Expired';
                                break;
                        }

                        t.cell('State', state)
                        t.cell('Serial No', cert.serial)
                        t.cell('Subject', cert.subject)
                        t.newRow();
                    });

                    console.log("\r\n");
                    console.log(t.toString());
                } else {
                    log("There are no certificates matching the state.");
                }
            } else {
                log.error("Server could not respond.");
            }
        })
        .catch(function(error){
            log.error("HTTP request failed: " + error);
        });
};

module.exports = list;
