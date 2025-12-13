#!/usr/bin/env bash

set -euo pipefail

log() {
	echo "[dependency-check] $*"
}

require_cmd() {
	command -v "$1" >/dev/null 2>&1
}

ensure_ubuntu_like() {
	if [[ "$(uname -s)" != "Linux" ]]; then
		echo "ERROR: This script is intended to run on Ubuntu/Debian Linux." >&2
		exit 1
	fi

	if [[ ! -f /etc/os-release ]]; then
		echo "ERROR: /etc/os-release not found; cannot detect distro." >&2
		exit 1
	fi

	# shellcheck disable=SC1091
	. /etc/os-release
	case "${ID:-}" in
		ubuntu|debian) : ;;
		*)
			if [[ "${ID_LIKE:-}" != *debian* ]]; then
				echo "ERROR: Unsupported distro '${ID:-unknown}'. Expected Ubuntu/Debian." >&2
				exit 1
			fi
			;;
	esac

	if ! require_cmd apt-get; then
		echo "ERROR: apt-get not found; cannot install dependencies." >&2
		exit 1
	fi
}

sudo_init() {
	if [[ "${EUID}" -eq 0 ]]; then
		return
	fi

	if ! require_cmd sudo; then
		echo "ERROR: sudo not installed. Please install sudo or run as root." >&2
		exit 1
	fi

	log "Requesting sudo (one time)..."
	sudo -v
}

apt_update_upgrade() {
	log "Running apt update..."
	sudo -E apt-get update -y

	log "Running apt upgrade (non-interactive)..."
	sudo -E DEBIAN_FRONTEND=noninteractive \
		apt-get upgrade -yq \
		-o Dpkg::Options::=--force-confdef \
		-o Dpkg::Options::=--force-confnew
}

apt_install_base_tools() {
	log "Installing base packages required for Minikube/Kubernetes tooling..."
	sudo -E DEBIAN_FRONTEND=noninteractive \
		apt-get install -yq \
		ca-certificates \
		curl \
		gpg \
		jq \
		apt-transport-https \
		conntrack \
		socat \
		iptables \
		ebtables \
		ethtool \
		iproute2 \
		net-tools \
		openssl \
		acl \
		procps
}

install_docker_if_missing() {
	if require_cmd docker; then
		log "Docker already installed"
		return
	fi

	log "Installing Docker (docker.io from Ubuntu repos)..."
	sudo -E DEBIAN_FRONTEND=noninteractive apt-get install -yq docker.io
	sudo systemctl enable --now docker >/dev/null 2>&1 || true
}

enable_docker_for_user() {
	if [[ "${EUID}" -eq 0 ]]; then
		return
	fi

	if ! require_cmd docker; then
		return
	fi

	# Try to grant immediate access without requiring logout/login.
	# Group change would require a new session; ACL works right away.
	if [[ -S /var/run/docker.sock ]] && require_cmd setfacl; then
		log "Granting current user access to /var/run/docker.sock (no re-login needed)"
		sudo setfacl -m "user:${USER}:rw" /var/run/docker.sock || true
	fi

	if getent group docker >/dev/null 2>&1; then
		log "Adding '${USER}' to docker group (takes effect after re-login; ACL already applied)"
		sudo usermod -aG docker "${USER}" || true
	fi
}

install_kubectl_if_missing() {
	if require_cmd kubectl; then
		log "kubectl already installed"
		return
	fi

	log "Installing kubectl from Kubernetes apt repo..."
	sudo mkdir -p /etc/apt/keyrings
	curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | \
		sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

	echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" | \
		sudo tee /etc/apt/sources.list.d/kubernetes.list >/dev/null

	sudo -E apt-get update -y
	sudo -E DEBIAN_FRONTEND=noninteractive apt-get install -yq kubectl
}

install_minikube_if_missing() {
	if require_cmd minikube; then
		log "minikube already installed"
		return
	fi

	local arch
	arch="$(uname -m)"
	case "$arch" in
		x86_64|amd64) arch="amd64" ;;
		aarch64|arm64) arch="arm64" ;;
		*)
			echo "ERROR: Unsupported CPU architecture '$arch' for minikube installer." >&2
			exit 1
			;;
	esac

	log "Installing minikube (latest) for linux/${arch}..."
	local tmp_dir
	tmp_dir="$(mktemp -d)"
	trap 'rm -rf "$tmp_dir"' RETURN
	curl -fsSL -o "$tmp_dir/minikube" "https://storage.googleapis.com/minikube/releases/latest/minikube-linux-${arch}"
	chmod +x "$tmp_dir/minikube"
	sudo mv "$tmp_dir/minikube" /usr/local/bin/minikube
}

configure_minikube_defaults() {
	# Make default driver docker so Makefile's `minikube start` works.
	if ! require_cmd minikube; then
		return
	fi

	if [[ "${EUID}" -eq 0 ]]; then
		return
	fi

	log "Configuring minikube default driver to 'docker'"
	minikube config set driver docker >/dev/null 2>&1 || true
}

main() {
	ensure_ubuntu_like
	sudo_init

	apt_update_upgrade
	apt_install_base_tools
	install_docker_if_missing
	enable_docker_for_user
	install_kubectl_if_missing
	install_minikube_if_missing
	configure_minikube_defaults

	log "Done. You can now run: make up"
}

main "$@"
