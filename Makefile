.PHONY: all start deploy open clean

# Default target
all: start deploy open

# Start Minikube if not running
start:
	@echo "🚀 Checking Minikube status..."
	@minikube status > /dev/null 2>&1 || (echo "Minikube is not running. Starting..." && minikube start)
	@echo "Minikube is running"

# Deploy the application
deploy:
	@echo "Deploying application..."
	@chmod +x infrastructure/k8s/deploy.sh
	@cd infrastructure/k8s && ./deploy.sh

# Open the frontend
open:
	@echo "🌐 --- Starting Port-Forwarding to http://localhost:8080 and https://localhost:8443 ... ---"
	@echo "⚠️  Keep this terminal open. Press Ctrl+C to stop."
	@kubectl port-forward service/frontend 8080:80 8443:443 -n bugbounty-ns

# Clean up resources
clean:
	@echo "Cleaning up..."
	@kubectl delete namespace bugbounty-ns --ignore-not-found
	@echo "Cleanup complete"
