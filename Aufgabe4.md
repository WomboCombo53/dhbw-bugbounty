TODO: Umsetzung vom Google Login beschreiben

# TLS Implementation

## Overview
To ensure secure communication, the application has been upgraded to support TLS (Transport Layer Security) for both the Frontend and the Backend.

## Certificate Authority (CA)
A local Certificate Authority is established to issue certificates for the development environment.
- **Script**: \`infrastructure/pki/gen-certs.sh\`
- **Function**: Generates a CA key/cert and issues a server certificate for \`localhost\`, \`host.minikube.internal\`, and internal Kubernetes DNS names (\`backend\`, \`backend.bugbounty-ns\`).

## Deployment Automation
The deployment process (\`infrastructure/k8s/deploy.sh\`) has been updated to:
1.  Execute the certificate generation script.
2.  Create a Kubernetes Secret named \`bugbounty-tls\` containing the generated \`server.crt\` and \`server.key\`.

## Frontend (Nginx)
- **HTTPS Support**: Configured to listen on port 8443 with SSL enabled.
- **Certificate Mounting**: Mounts the \`bugbounty-tls\` secret to \`/etc/nginx/ssl\`.
- **Reverse Proxy**: Proxies \`/api/\` requests to the backend via HTTPS (\`https://backend:3000\`), ensuring end-to-end encryption.

## Backend (Node.js)
- **HTTPS Enforcement**: The server now detects the presence of SSL certificates (mounted at \`/etc/ssl/certs\`) and starts an HTTPS server.
- **Internal Communication**: Service-to-service communication (Frontend -> Backend) occurs over HTTPS.

## Usage
The \`Makefile\` orchestrates the entire process. Simply run:
\`\`\`bash
make
\`\`\`
This will start Minikube, generate certificates, deploy the application, and open the frontend.