# DHBW Bug Bounty Tracker

Projekt als Prüfungsleistung der Vorlesung Security by Design

A React.js-based bug bounty tracking system that allows users to submit security vulnerabilities to companies and track bounties. The project includes a comprehensive CI/CD pipeline with security-first practices.

## Features

### Application
- **Bug Submission Form**: Users can report security vulnerabilities with details including:
  - Bug title and description
  - Severity level (Low, Medium, High, Critical)
  - Target company name
  - Reporter contact information
  - Expected bounty amount
- **Bug Tracking Dashboard**: View all submitted bugs with status tracking
- **Persistent Storage**: MongoDB database for bug reports
- **REST API**: Express.js backend with comprehensive endpoints
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Server-side persistence with instant feedback

### Security & CI/CD Pipeline

The project implements a comprehensive security-focused CI/CD pipeline with the following stages:

#### 1. **SBOM Generation**
- Generates Software Bill of Materials using Syft
- CycloneDX JSON format
- Uploaded as artifact for audit trails

#### 2. **Secret Scanning**
- Gitleaks integration for detecting hardcoded secrets
- Scans entire git history
- Quality gate: Pipeline fails if secrets are found

#### 3. **SAST (Static Application Security Testing)**
- CodeQL analysis for JavaScript/React code
- Identifies security vulnerabilities in source code
- Results uploaded to GitHub Security tab

#### 4. **SCA (Software Composition Analysis)**
- npm audit for dependency vulnerabilities
- Trivy scanning for comprehensive vulnerability detection
- SARIF reports uploaded to GitHub Security
- Quality gate: Pipeline fails on CVSS >= 7.0 vulnerabilities

#### 5. **Build**
- Automated React application build with Vite
- Build artifacts stored for deployment
- Only proceeds if security scans pass

#### 6. **Container Build & Scan**
- Multi-stage Docker build for optimized images
- Container pushed to GitHub Container Registry (GHCR)
- Trivy container image scanning
- Quality gate: Fails on HIGH/CRITICAL vulnerabilities in container

#### 7. **Image Signing**
- Cosign-based image signing using keyless signing
- Signature verification before deployment
- Quality gate: Deployment blocked if signature is invalid or missing

#### 8. **Quality Gate**
- Comprehensive validation of all security requirements:
  - ✅ No secrets found
  - ✅ No vulnerabilities with CVSS >= 7.0
  - ✅ Valid image signature
- Pipeline fails if any condition is not met

#### 9. **Kubernetes Deployment**
- Automated deployment to Kubernetes cluster
- Uses signed and verified container images
- Includes deployment, service, and ingress manifests
- Security hardening with Pod Security Standards

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Docker & Docker Compose (for containerization)
- MongoDB (included in Docker Compose setup)
- kubectl (for Kubernetes deployment)

### Local Development

#### Using Docker Compose

This will start MongoDB, Backend API, and Frontend together:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3000`
- MongoDB: `localhost:27017`

### Kubernetes Deployment

1. **Update the image reference in `k8s/deployment.yaml`:**
   Replace `IMAGE_PLACEHOLDER` with your actual container image.

2. **Apply Kubernetes manifests:**
   ```bash
   kubectl apply -f k8s/
   ```

3. **Verify deployment:**
   ```bash
   kubectl get pods -l app=bugbounty-tracker
   kubectl get service bugbounty-tracker-service
   ```

## CI/CD Pipeline Configuration

The CI/CD pipeline is configured in `.github/workflows/ci-cd.yml` and automatically runs on:
- Push to `main` branches
- Pull requests to `main` branches
- Manual workflow dispatch

### Required Secrets

For full functionality, configure the following GitHub secrets:
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- Optional: `KUBECONFIG`: For automated Kubernetes deployment

### Container Registry

The pipeline uses GitHub Container Registry (GHCR). Images are automatically pushed to:
```
ghcr.io/<username>/<repository>:tag
```

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # CI/CD pipeline configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BugSubmissionForm.jsx
│   │   │   ├── BugSubmissionForm.css
│   │   │   ├── BugList.jsx
│   │   │   └── BugList.css
│   │   ├── App.jsx            # Updated with API integration
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile             # Multi-stage container build
│   ├── nginx.conf             # Nginx configuration
│   ├── vite.config.js         # Vite build configuration with proxy
│   ├── package.json           # Dependencies and scripts
│   ├── .env.development       # Development environment variables
│   ├── .env.production        # Production environment variables
│   └── index.html
├── backend/
│   ├── models/
│   │   └── Bug.js             # MongoDB Bug model
│   ├── routes/
│   │   └── bugs.js            # API routes
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── server.js              # Express server entry point
│   ├── Dockerfile             # Production Docker image
│   ├── Dockerfile.dev         # Development Docker image
│   ├── package.json           # Backend dependencies
│   ├── .env.example           # Environment template
│   ├── .env                   # Environment variables
│   └── README.md              # Backend documentation
├── k8s/
│   └── deployment.yaml        # Kubernetes manifests
├── docker-compose.yml         # Full stack orchestration
└── README.md
```

## Security Features

- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Container Security**: Non-root user, read-only filesystem, dropped capabilities
- **Image Signing**: Cosign keyless signing with Sigstore
- **Vulnerability Scanning**: Multi-layer scanning (dependencies, code, container)
- **Quality Gates**: Automated enforcement of security policies

## Quality Gate Conditions

The pipeline enforces the following quality gates:

1. **Secret Detection**: Pipeline fails if any secrets are detected in the codebase
2. **Vulnerability Threshold**: Pipeline fails if vulnerabilities with CVSS >= 7.0 are found
3. **Image Signature**: Deployment blocked if container image signature is invalid or missing

## Technology Stack

- **Frontend**: React 18, Vite
- **Backend**: Express.js, Node.js 20
- **Database**: MongoDB 7.0
- **Styling**: CSS3 with responsive design
- **Container**: Docker, Docker Compose, nginx
- **CI/CD**: GitHub Actions
- **Security Tools**:
  - Gitleaks (secret scanning)
  - CodeQL (SAST)
  - Trivy (SCA & container scanning)
  - Syft (SBOM generation)
  - Cosign (image signing)
  - Helmet.js (security headers)
  - Express Rate Limit (DDoS protection)
- **Deployment**: Kubernetes

## License

This project is created as an academic assignment for the "Security by Design" course at DHBW.

## Contributing

This is an academic project. For questions or suggestions, please open an issue.
