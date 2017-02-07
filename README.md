# NodePKI CLI Client

*A simple command-line client for the NodePKI server*

---

## Dependencies

* NodeJS
* NPM


## Setup

```
git clone https://github.com/ThomasLeister/nodepki-client.git
cd nodepki-client
npm install
```

## Configure

Configure client in config.yml: Set IP-address and port of the NodePKI server according to the config.yml of your server.

```
server:
    ip: localhost
    port: 8081
```

## Usage

### Display subcommand overview:

```
nodejs nodepki-client.js help
```

### Request new certificate via .csr file

```
nodejs nodepki-client.js request --csr certificate.csr
```

### Get list of all issued certificates

```
nodejs nodepki-client.js list --state all
```
... to list all issued certificates.

Valid states:
* all
* valid
* expired
* revoked


### Get certificate by serial number

```
nodejs nodepki-client.js get --serialno 324786EA
```


### Revoke issued certificate

```
nodejs nodepki-client.js revoke --certfile cert.pem
```
