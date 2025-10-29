#!/bin/bash

echo "🚀 Deploying Bug Bounty Tracker to Minikube"
echo "==========================================="

# Check if minikube is running
if ! minikube status > /dev/null 2>&1; then
    echo "⚠️  Minikube is not running. Starting Minikube..."
    minikube start
fi

echo ""
echo "✅ Minikube is running"

# Point Docker CLI to Minikube's Docker daemon
echo ""
echo "🔧 Configuring Docker to use Minikube's Docker daemon..."
eval $(minikube docker-env)

# Build the Docker image inside Minikube
echo ""
echo "🐳 Building Docker image inside Minikube..."
cd ../frontend
docker build -t dhbw-bugbounty:local .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo ""
echo "✅ Docker image built successfully"

# Apply Kubernetes resources
echo ""
echo "☸️  Deploying to Kubernetes..."
cd k8s
kubectl apply -f deployment.yaml

if [ $? -ne 0 ]; then
    echo "❌ Kubernetes deployment failed!"
    exit 1
fi

echo ""
echo "✅ Kubernetes resources applied"

# Wait for deployment to be ready
echo ""
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/bugbounty-tracker

# Get the service URL
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "💡 To access via NodePort, run:"
echo "   minikube service bugbounty-tracker-service"
echo ""
echo "📊 Check pod status:"
echo "   kubectl get pods"
echo ""
echo "📝 View logs:"
echo "   kubectl logs -l app=bugbounty-tracker"
