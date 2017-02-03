/**
 * List Subcommand
 */

var log = require('fancy-log');
var httpclient = require('./../httpclient.js');

list = function(state) {
    httpclient.request('/certificates/list/' + state + '/', 'GET', null)
        .then(function(response){
            log.info("HTTP request was successful");

            if(response.success) {
                response.certs.forEach(function(cert){
                    console.log(cert.serial + " | " + cert.subject);
                });
            } else {
                log.error("Server could not respond.");
            }
        })
        .catch(function(error){
            log.error("HTTP request failed: " + error);
        });
};

module.exports = list;
