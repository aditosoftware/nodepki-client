# NodePKI CLI Client

*A simple command-line client for the NodePKI server*


## Dependencies

* NodeJS
* NPM
* OpenSSL


## Setup

    git clone https://github.com/ThomasLeister/nodepki-client.git
    cd nodepki-client
    npm install


## Configure

Copy config.default.yml to config/config.yml and set the settings according to your environment.


## Usage

### Display subcommand overview:

    nodejs client help

### Display subcommand usage help:

    nodejs client request --help

### Request new certificate

Create new key + certificate from scratch and store both in out/ directory. Lifetime: 7 days.

    nodejs client request --lifetime 7 --out out/

Create new key + certificate from scratch, add intermediate cert to cert and store in out/ directory

    nodejs client request --out out/ --fullchain

Create new certificate via existing .csr file and write certificate to out/cert.pem:

    nodejs client request --csr certificate.csr --out out/cert.pem

Lifetime defaults to *cert_lifetime_default* setting in config.yml

Create a new client certificate:

    nodejs client request --type client --out out/


### Get list of issued certificates

    nodejs client list --state all

... to list all issued certificates.

Valid states:
* all
* valid
* expired
* revoked


### Get certificate by serial number

... and store certificate to out/cert.pem

    nodejs client get --serialnumber 324786EA --out out/cert.pem


### Revoke issued certificate

    nodejs client revoke --cert cert.pem


### Get CA certificates

Get root certificate:

    nodejs client getcacert --ca root

Write root certificate to file:

    nodejs client getcacert --ca root --out out/root.cert.pem

Get intermediate certificate:

    nodejs client getcacert --ca intermediate

Get intermediate certificate + root certificate (=cert chain) and write to file:

    nodejs client getcacert --ca intermediate --chain --out out/ca-chain.cert.pem
