var log = require('fancy-log');
var http = require('http');
var fs = require('fs-extra');
var exec = require('child_process').exec;

var readlineSync = require('readline-sync');


var getFingerprint = function(certfile) {
    return new Promise(function(resolve, reject) {
        exec('openssl x509 -noout -in ' + certfile + ' -fingerprint -sha256', {}, function(error, stdout, stderr) {
            var filter = /=([A-F0-9\:]*)/;
            var matches = filter.exec(stdout)
            var fingerprint = matches[1];
            resolve(fingerprint);
        });
    });
};



var getCert = function() {
    return new Promise(function(resolve, reject) {
        var req = http.request({
            host: global.config.server.public.hostname,
            port: global.config.server.public.port,
            path: '/root.cert.pem',
            method: 'GET',
            headers: {
                'Content-Type': 'text/text'
            }
        }, function (response){
            var body = '';

            response.on('data', function(chunk) {
                body += chunk;
            });

            response.on('end', function() {
                resolve(body);
            });
        });

        req.on('error', function(error) {
            reject(error);
        });

        // Send request
        req.end();
    })
}


var checkCert = function() {
    return new Promise(function(resolve, reject) {
        log("Checking Root Cert ... ");

        if(fs.existsSync('root.cert.pem')) {
            log("Root Cert okay.")
            resolve();
        } else {
            getCert().then(function(cert) {
                fs.writeFileSync('root.cert.tmp', cert);
                log("Downloaded root cert from API server.")

                // Fingerprint verification ...
                getFingerprint('root.cert.tmp').then(function(fingerprint) {
                    log(">>> Fingerprint of Root CA is: " + fingerprint);
                    console.log("Compare fingerprint to fingerprint output of the API server startup log");
                    var answer = readlineSync.question("and type 'y' if fingerprint matches Root CA fingerprint: ", { defaultInput: 'n' });

                    if(answer.toLowerCase() === 'y') {
                        log("Root CA accepted.")
                        fs.copySync('root.cert.tmp', 'root.cert.pem');
                        fs.removeSync('root.cert.tmp')
                        resolve();
                    } else {
                        log("Root CA certificate not accepted. Deleting root.cert.pem.")
                        fs.removeSync('root.cert.tmp')
                        process.exit();
                    }
                })
                .catch(function(err) {
                    reject(err);
                });
            })
            .catch(function(err) {
                log("Error while fetching Root CA cert via HTTP: " + err)
            })
        }
    });
};


module.exports = {
    checkCert: checkCert
};
