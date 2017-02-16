/**
 * List Subcommand
 */

var log = require('fancy-log');
var httpclient = require('./../httpclient.js');
var Table = require('easy-table');

list = function(state) {

    var postdata = {
        data: {
            state: state
        },
        auth: {
            username: global.config.user.username,
            password: global.config.user.password
        }
    };
    
    httpclient.request(global.apipath + '/certificates/list/', 'POST', postdata)
        .then(function(response){
            log.info("HTTP API request was successful");

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
                        t.cell('Expiration time', cert.expirationtime)
                        t.cell('Revocation time', cert.revocationtime)
                        t.cell('Subject', cert.subject)
                        t.newRow();
                    });

                    console.log("\r\n");
                    console.log(t.toString());
                } else {
                    log("There are no certificates matching the state.");
                }
            } else {
                log.error("Server could not respond. Errors: " + JSON.stringify(response.errors));
            }
        })
        .catch(function(error){
            log.error("HTTP request failed: " + error);
        });
};

module.exports = list;
