/**
 * HTTP helper function
 * Makes HTTP requests to server API
 * Makes only GET and POST requests with JSON Body.
 */

var log     = require('fancy-log');
var http    = require('http');
var https   = require('https');
var fs      = require('fs-extra');
var rootcheck = require('./rootcheck.js');

var request = function(path, method, pushdata) {
    return new Promise(function(resolve, reject) {
        log.info("Requesting " + (global.config.server.tls ? 'https' : 'http') + "://" + global.config.server.hostname + ":" + (global.config.server.tls ? global.config.server.port_tls : global.config.server.port_plain) + path + " via " + method);


        var httpresponse = function(response) {
            var body = '';

            response.on('data', function(chunk) {
                body += chunk;
            });

            response.on('end', function() {
                var response = JSON.parse(body);

                // Catch API Input errors:
                if(response.success === false) {
                    // Check if the first error is an API error (coded 100). It the first is, a second will be as well.
                    if(response.errors[0].code === 100){
                        // API input was invalid.
                        response.errors.forEach(function(error) {
                            log.error("API error: " + error.message);
                        });

                        reject("One or more API errors");
                    } else {
                        resolve(response);
                    }
                } else {
                    resolve(response);
                }
            });
        };

        new Promise(function(resolve, reject) {
            if(config.server.tls) {
                rootcheck.checkCert().then(function(){
                    var rootcert = fs.readFileSync('data/root.cert.pem');

                    var req = https.request({
                        host: global.config.server.hostname,
                        port: global.config.server.port_tls,
                        path: path,
                        method: method,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        ca: rootcert
                    }, httpresponse);
                    resolve(req);
                })
                .catch(function(err) {
                    reject("Could not check root cert.");
                });

            } else {
                var req = http.request({
                    host: global.config.server.hostname,
                    port: global.config.server.port_plain,
                    path: path,
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, httpresponse);
                resolve(req);
            }
        }).then(function(req){
            req.on('error', function(error) {
                reject(error);
            });

            if(method === 'POST') {
                var json = JSON.stringify(pushdata);
                req.write(json);
            }

            // Send request
            req.end();
        })
        .catch(function(err) {
            reject(err)
        });
    });
};


module.exports = {
    request: request
};
