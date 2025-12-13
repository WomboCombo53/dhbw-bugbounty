.PHONY: all start deploy open clean build

# Default target
all: start deploy open
up: all

build: start deploy-build open
cleanbuild: clean build

# Start Minikube if not running
start:
	@echo "🔧 Checking/installing dependencies (may prompt for sudo password once)..."
	@chmod +x infrastructure/k8s/dependency-check.sh
	@infrastructure/k8s/dependency-check.sh
	
	@echo "🚀 Checking Minikube status..."
	@minikube status > /dev/null 2>&1 || (echo "Minikube is not running. Starting..." && minikube start)
	@echo "Minikube is running"

# Deploy the application
deploy:
	@echo "Deploying application..."
	@chmod +x infrastructure/k8s/deploy.sh
	@cd infrastructure/k8s && ./deploy.sh

# Deploy the built application
deploy-build:
	@echo "Deploying built application..."
	@chmod +x infrastructure/k8s/deploy-build.sh
	@cd infrastructure/k8s && ./deploy-build.sh

# Open the frontend and backend
open:
	@echo "🛑 Killing existing port-forwards..."
	@pkill kubectl || true
	
	@echo "⏳ Waiting for pods to be ready..."

	@kubectl wait --namespace bugbounty-ns \
		--for=condition=ready pod \
		--selector=app=backend \
		--timeout=120s
	@kubectl wait --namespace bugbounty-ns \
		--for=condition=ready pod \
		--selector=app=frontend \
		--timeout=120s

	@clear
	@echo "Starting Port-Forwarding to https://localhost:8443 and https://localhost:3000 ..."
	@echo "⚠️  Keep this terminal open. Press Ctrl+C to stop."
	@echo "\n--- 🌐 The frontend website will be available at: https://localhost:8443 ---\n"
	@kubectl port-forward service/backend 3000:3000 -n bugbounty-ns & \
	kubectl port-forward service/frontend 8443:443 -n bugbounty-ns

# Clean up resources
clean:
	@echo "Cleaning up..."
	@kubectl delete namespace bugbounty-ns --ignore-not-found
	@echo "Cleanup complete"
