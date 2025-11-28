# Aufgabe 1 – Projektstart und Anforderungsdefinition  
## Security by Design – Bug Bounty Tracker

## 1. Projektbeschreibung

Der Bug Bounty Tracker ist eine interne Webanwendung, die es Entwickler:innen, Security-Researchern und Teams ermöglicht, entdeckte Sicherheitslücken zentral zu dokumentieren, zu klassifizieren und den Behebungsstatus nachvollziehbar zu verfolgen.  
Das System erlaubt anonyme Meldungen, verschlüsselt die gespeicherten Daten und ordnet eingehende Bugs automatisch dem zuständigen Entwicklerteam zu.

Ziel ist eine sichere, reproduzierbare und nachvollziehbare Systemlandschaft, die moderne Security-by-Design-Prinzipien von der Entwicklung bis zum Deployment konsequent umsetzt.

---

## 2. Architekturübersicht (Beschreibung)

Das System folgt einer klassischen Webarchitektur mit klar getrennten Verantwortlichkeiten:

### **Frontend**
- Umsetzung als Web-UI (SPA oder klassische Webapp).
- Ermöglicht die Erfassung, Anzeige und Suche von Bug-Reports.
- Unterstützt anonyme Eingaben.
- Kommuniziert ausschließlich über die API des Backends.
- Läuft im Browser der Nutzer:innen.

### **Backend**
- Implementiert eine REST- oder GraphQL-API.
- Zuständig für:
  - Authentifizierung registrierter Entwickler:innen und Teams.
  - Verarbeitung eingehender Bug-Reports.
  - Zuweisung der Bugs an Teams.
  - Zugriffskontrolle basierend auf Rollen (Reporter, Entwickler, Admin).
- Führt serverseitige Validierung, Logging, Sanitizing und Sicherheitsmechanismen durch.

### **Datenbank**
- Speichert alle Bug-Reports, Nutzerkonten, Rollen, Teams und Status-Informationen.
- Alle sicherheitsrelevanten Daten werden verschlüsselt gespeichert („Encryption at Rest“).
- Zugriff ausschließlich über das Backend, niemals direkt durch das Frontend.

### **CI/CD-Pipeline**
Die Pipeline automatisiert:
1. SBOM-Erstellung  
2. SAST, SCA und Secret-Scan  
3. Build & Container-Build  
4. Image Signing  
5. Quality Gate (Abbruch bei Sicherheitsverstößen)  
6. Deployment ins Kubernetes-Cluster  

### **Kubernetes-Cluster**
- Ausrollen aller Services in einem dedizierten Namespace.
- Minimale Service-Accounts.
- Strenge Sicherheitskonfiguration:
  - runAsNonRoot, readOnlyRootFilesystem, Drop Capabilities, no privilege escalation  
- Netzwerkrestriktionen durch Network Policies.

---

## 3. Rollen im System

### **1. Anonyme Meldende**
- Können ohne Anmeldung Bugs einreichen.
- Haben keinen Zugriff auf andere Inhalte.

### **2. Authentifizierte Entwickler:innen**
- Können Bugs einsehen, kommentieren, bearbeiten und abschließen.
- Gehören jeweils zu einem Team.

### **3. Admin / Security-Lead**
- Verwalten Teams, Rollen und Kategorien.
- Überprüfen kritische Meldungen.
- Haben erweiterten Zugriff auf Systemlogs.

---

## 4. Security Requirements (mindestens fünf, wie gefordert)

### **1. Encryption at Rest**
Alle sensiblen Daten (Bug-Details, Reporter-Metadaten, Nutzeraccounts) werden in der Datenbank verschlüsselt gespeichert.

### **2. TLS-only Communication**
Jeglicher Traffic zwischen Frontend, Backend und Pipeline-Endpunkten erfolgt ausschließlich über HTTPS/TLS.

### **3. Eingabevalidierung & Sanitizing**
Alle Eingaben werden serverseitig validiert und gereinigt, um Injection-Angriffe zu verhindern.

### **4. Rollenbasierte Zugriffskontrolle (RBAC)**
Nur berechtigte Nutzerrollen dürfen Bugs einsehen, bearbeiten oder schließen.

### **5. Secret-Management**
Keine Secrets im Repository. Secrets werden in Kubernetes-Secrets oder einem Secret-Manager gespeichert.

### **6. Minimal Privilege Deployment**
Services laufen mit minimalen Rechten:
- non-root
- read-only filesystem
- eingeschränkte Netzwerkports

