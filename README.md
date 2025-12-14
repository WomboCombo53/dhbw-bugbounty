# DHBW Bug Bounty Tracker
Projekt als Prüfungsleistung der Vorlesung Security by Design

## Setup & Installation

### Voraussetzungen
- Ubuntu (>v24.04.3, getestet in VirtualBox)/Debian-System
- sudo-Rechte zur Installation der notwendigen Pakete

### Starten der Anwendung
Um die gesamte Umgebung (Kubernetes Cluster, Backend, Frontend, Datenbank) zu starten, führe folgenden Befehl aus:

```bash
make up
```

Dieser Befehl führt automatisch folgende Schritte aus:
1. Überprüfung und Installation von Abhängigkeiten (Docker, minikube etc.)
2. Starten von Minikube (falls nicht aktiv)
3. Deployment der Services in den Cluster
4. Einrichten von Port-Forwarding für den Zugriff

Nach erfolgreichem Start ist die Anwendung unter folgenden URLs erreichbar:
- Frontend: https://localhost:8443
- Backend API: https://localhost:3000

### Troubleshooting

Falls Probleme beim Starten auftreten:

**Minikube startet nicht:**
- Stelle sicher, dass Docker Desktop läuft.
- Versuche `minikube delete` und anschließend erneut `make up`.

**Pods werden nicht "Ready":**
- Überprüfe den Status der Pods mit:
  ```bash
  kubectl get pods -n bugbounty-ns
  ```
- Für Details zu einem fehlerhaften Pod:
  ```bash
  kubectl describe pod <pod-name> -n bugbounty-ns
  ```

**Port-Forwarding schlägt fehl:**
- Prüfe, ob die Ports 8443 oder 3000 bereits belegt sind.
- Beende eventuell hängende `kubectl` Prozesse:
  ```bash
  pkill kubectl
  ```

**Bereinigen der Umgebung:**
Um die Umgebung neu zu bauen (inkl. Docker Images):
```bash
make cleanbuild
```