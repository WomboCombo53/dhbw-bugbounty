#!/bin/bash
set -e

mkdir -p certs

# 1. Generate CA
if [ ! -f certs/ca.key ]; then
    echo "Generating CA key..."
    openssl genrsa -out certs/ca.key 2048
fi

if [ ! -f certs/ca.crt ]; then
    echo "Generating CA certificate..."
    openssl req -x509 -new -nodes -key certs/ca.key -sha256 -days 365 -out certs/ca.crt -subj "/CN=BugBountyCA"
fi

# 2. Generate Server Cert
if [ ! -f certs/server.key ]; then
    echo "Generating Server key..."
    openssl genrsa -out certs/server.key 2048
fi

if [ ! -f certs/server.csr ]; then
    echo "Generating Server CSR..."
    openssl req -new -key certs/server.key -out certs/server.csr -subj "/CN=localhost" -config <(cat /etc/ssl/openssl.cnf <(printf "\n[SAN]\nsubjectAltName=DNS:localhost,DNS:host.minikube.internal,IP:127.0.0.1")) -reqexts SAN
    # Note: The config part might be tricky across OSs. Let's try a simpler approach or assume standard openssl config location.
    # Actually, let's just use a simple config file for the CSR to ensure SANs are present.
fi

cat > certs/csr.conf <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = DE
ST = BW
L = Stuttgart
O = DHBW
OU = BugBounty
CN = localhost

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = host.minikube.internal
DNS.3 = backend
DNS.4 = backend.bugbounty-ns
IP.1 = 127.0.0.1
EOF

echo "Generating Server CSR..."
openssl req -new -key certs/server.key -out certs/server.csr -config certs/csr.conf

echo "Generating Server Certificate..."
openssl x509 -req -in certs/server.csr -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial -out certs/server.crt -days 365 -sha256 -extfile certs/csr.conf -extensions req_ext

echo "Certificates generated in infrastructure/pki/certs/"
