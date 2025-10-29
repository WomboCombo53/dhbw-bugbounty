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
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Client-side state management

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
- Node.js 18.x or higher
- npm or yarn
- Docker (for containerization)
- kubectl (for Kubernetes deployment)

### Local Development

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

3. **Build for production:**
   ```bash
   npm run build
   ```

### Docker

1. **Build container image:**
   ```bash
   docker build -t bugbounty-tracker ./frontend
   ```

2. **Run container:**
   ```bash
   docker run -p 8080:80 bugbounty-tracker
   ```
   Access the application at `http://localhost:8080`

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
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches
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
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile             # Multi-stage container build
│   ├── nginx.conf             # Nginx configuration
│   ├── vite.config.js         # Vite build configuration
│   ├── package.json           # Dependencies and scripts
│   └── index.html
├── k8s/
│   └── deployment.yaml        # Kubernetes manifests
├── backend/                   # Backend directory (empty for now)
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
- **Styling**: CSS3 with responsive design
- **Container**: Docker, nginx
- **CI/CD**: GitHub Actions
- **Security Tools**:
  - Gitleaks (secret scanning)
  - CodeQL (SAST)
  - Trivy (SCA & container scanning)
  - Syft (SBOM generation)
  - Cosign (image signing)
- **Deployment**: Kubernetes

## License

This project is created as an academic assignment for the "Security by Design" course at DHBW.

## Contributing

This is an academic project. For questions or suggestions, please open an issue.
