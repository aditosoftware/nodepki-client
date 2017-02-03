/**
 * HTTP helper function for HTTP client
 */

var log = require('fancy-log');
var http = require('http');

var request = function(path, method, pushdata) {
    return new Promise(function(resolve, reject) {
        log.info("Making HTTP request to http://" + global.config.server.ip + ":" + global.config.server.port + path + " via " + method);

        var req = http.request({
            host: global.config.server.ip,
            port: global.config.server.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        }, function (response){
            var body = '';

            response.on('data', function(chunk) {
                body += chunk;
            });

            response.on('end', function() {
                var response = JSON.parse(body);
                resolve(response);
            });
        });

        req.on('error', function(error) {
            log.error("There was a HTTP error: " + error);
            reject();
        });

        if(method === 'PUSH'){
            var jsonobj = {
                csr: pushdata,
                applicant: "John Doe"
            };
            var json = JSON.stringify(jsonobj);

            req.write(json);
        } 

        // Send request
        req.end();
    });
};


module.exports = {
    request: request
};
