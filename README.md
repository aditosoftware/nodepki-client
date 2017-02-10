# NodePKI CLI Client

*A simple command-line client for the NodePKI server*

---

## Dependencies

* NodeJS
* NPM


## Setup

    git clone https://github.com/ThomasLeister/nodepki-client.git
    cd nodepki-client
    npm install


## Configure

Configure client in config.yml: Set IP-address and port of the NodePKI server according to the config.yml of your server.

    server:
        ip: localhost
        port: 8081

## Usage

### Display subcommand overview:

nodejs client.js help


### Request new certificate via .csr file

    nodejs client.js request --csr certificate.csr --outfile cert.pem

### Get list of all issued certificates

    nodejs client.js list --state all

... to list all issued certificates.

Valid states:
* all
* valid
* expired
* revoked


### Get certificate by serial number

    nodejs client.js get --serialno 324786EA --outfile cert.pem



### Revoke issued certificate

    nodejs client.js revoke --cert cert.pem


### Get CA Certificates

Get root certificate:

    nodejs client getcacert --ca root

Write received certificate to file:

    nodejs client getcacert --ca root --outfile root.cert.pem

Get intermediate certificate:

    nodejs client getcacert --ca intermediate

Get intermediate CA chain and write to file:

    nodejs client getcacert --ca intermediate  --chain --outfile ca-chain.cert.pem
