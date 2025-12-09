.PHONY: all start deploy open clean

# Default target
all: start deploy open

# Start Minikube if not running
start:
	@echo "🚀 Checking Minikube status..."
	@minikube status > /dev/null 2>&1 || (echo "⚠️  Minikube is not running. Starting..." && minikube start)
	@echo "✅ Minikube is running"

# Deploy the application
deploy:
	@echo "📦 Deploying application..."
	@chmod +x infrastructure/k8s/deploy.sh
	@cd infrastructure/k8s && ./deploy.sh

# Open the frontend
open:
	@echo "🌐 Opening frontend..."
	@minikube service frontend -n bugbounty-ns

# Clean up resources
clean:
	@echo "🧹 Cleaning up..."
	@kubectl delete namespace bugbounty-ns --ignore-not-found
	@echo "✅ Cleanup complete"
