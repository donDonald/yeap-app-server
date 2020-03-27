Place here:
    * Certificates (.cer files) from your to root authority
    * Private keys (.key files)

To produce certificate and key:
    $ openssl req -nodes -new -x509 -keyout server.key -out server.cert

// openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
