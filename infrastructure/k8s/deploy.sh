#!/bin/bash

# Exit on error
set -e

echo "Deploying Bug Bounty Tracker to Kubernetes"
echo "============================================"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl could not be found. Please install it first."
    exit 1
fi

# Apply resources in order
echo "Applying Kubernetes resources..."

echo "1. Base resources (Namespace, ServiceAccount)..."
kubectl apply -f 00-base.yaml

echo "2. Network Policies..."
kubectl apply -f 01-network-policies.yaml

echo "3. MongoDB..."
kubectl apply -f 02-mongodb.yaml

echo "4. Backend..."
kubectl apply -f 03-backend.yaml

echo "5. Frontend..."
kubectl apply -f 04-frontend.yaml

echo ""
echo " Deployment applied successfully!"
echo ""
echo " To check the status of your pods, run:"
echo "   kubectl get pods -n bugbounty-ns"
echo ""
echo " To access the frontend (if using Minikube):"
echo "   minikube service frontend -n bugbounty-ns"

alias kubectl='kubectl -n bugbounty-ns'
echo "Bugbounty-Namespace set for kubectl commands"