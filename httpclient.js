/**
 * HTTP helper function
 * Makes HTTP requests to server API
 * Makes only GET and POST requests with JSON Body.
 */

var log = require('fancy-log');
var https = require('https');
var fs = require('fs-extra');

var request = function(path, method, pushdata) {
    return new Promise(function(resolve, reject) {
        log.info("Making HTTPS request to https://" + global.config.server.api.hostname + ":" + global.config.server.api.port + path + " via " + method);

        var rootcert = fs.readFileSync('root.cert.pem');

        var req = https.request({
            host: global.config.server.api.hostname,
            port: global.config.server.api.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            ca: rootcert
        }, function (response){
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
        });

        req.on('error', function(error) {
            reject(error);
        });

        if(method === 'POST') {
            var json = JSON.stringify(pushdata);
            req.write(json);
        }

        // Send request
        req.end();
    });
};


module.exports = {
    request: request
};
