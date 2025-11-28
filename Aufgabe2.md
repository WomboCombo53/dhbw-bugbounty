# 2. Threat Modeling

## 2.1 Systemmodell & Vertrauensgrenzen (Textuelle Beschreibung)

Der Bug Bounty Tracker besteht aus einem Web-Frontend, einem Backend-API-Service und einer Datenbank. Nutzer:innen interagieren ausschließlich über das Frontend. Das Backend übernimmt Authentifizierung, Autorisierung, Validierung sowie CRUD-Operationen für Bug Reports und User-Accounts. Die Datenbank speichert alle sicherheitsrelevanten Informationen.

Es existieren drei zentrale Vertrauensgrenzen:

1. **Externe Nutzende → Frontend**  
   Alle Eingaben stammen aus einer nicht vertrauenswürdigen Umgebung und müssen validiert werden.

2. **Frontend → Backend**  
   Der Übergang vom öffentlich erreichbaren Client in die geschützte Serverumgebung erfordert strenge Authentifizierungs- und Autorisierungskontrollen.

3. **Backend → Datenbank**  
   Nur das Backend hat direkten Zugriff auf die Datenbank. Nutzer:innen kommunizieren niemals direkt mit ihr.

Sensible Daten umfassen Bug-Details, Exploit-Code, Benutzerinformationen und Authentifizierungsdaten.

---

# 2.2 STRIDE-Analyse

Die STRIDE-Analyse wird für alle Komponenten sowie für alle Datenflüsse durchgeführt, die Vertrauensgrenzen überschreiten.

---

## 2.2.1 Komponentenbasierte STRIDE-Tabelle

### C1 – Frontend

| Element | STRIDE | Bedrohung | Auswirkung | Gegenmaßnahme | Implementiert |
|--------|--------|-----------|-------------|----------------|----------------|
| Frontend | Spoofing | Gestohlene Sessiontokens | Unautorisierter Zugriff | Secure Cookies, HTTP-only, SameSite | Ja |
| Frontend | Tampering | Manipulation von Requests | Rechteausweitung, Datenmanipulation | Serverseitige Autorisierung | Ja |
| Frontend | Repudiation | Benutzer bestreitet Aktionen | Fehlende Nachvollziehbarkeit | Serverseitige Audit-Logs | Ja |
| Frontend | Information Disclosure | Sensible Daten im LocalStorage | Token-Diebstahl | Keine Tokens im LocalStorage, TLS | Ja |
| Frontend | DoS | Flooding von Requests | Frontend nicht erreichbar | Rate-Limiting im Backend | Teilweise |
| Frontend | Elevation of Privilege | Manipuliertes UI | Keine serverseitige Wirkung | Serverseitige Rollenprüfungen | Nicht nötig |

---

### C2 – Backend

| Element | STRIDE | Bedrohung | Auswirkung | Gegenmaßnahme | Implementiert |
|--------|--------|-----------|-------------|----------------|----------------|
| Backend | Spoofing | Gestohlene JWTs | Accountübernahme | Token-Signierung, Expiration | Ja |
| Backend | Tampering | Manipulierte JSON-Payload | Falsche Bug-Daten | Input-Validation, Typprüfung | Ja |
| Backend | Repudiation | Fehlende Logs | Keine Nachvollziehbarkeit | Audit-Logger | Ja |
| Backend | Information Disclosure | Zu detaillierte Fehlermeldungen | Angriffsfläche erhöht | Generische Fehlermeldungen | Ja |
| Backend | DoS | Übermäßige Requests | Systemausfall | Rate-Limits, Timeouts | Teilweise |
| Backend | Elevation | Fehlende RBAC | Vollzugriff | Role-Based Access Control | Ja |

---

### C3 – Datenbank

| Element | STRIDE | Bedrohung | Auswirkung | Gegenmaßnahme | Implementiert |
|--------|--------|-----------|-------------|----------------|----------------|
| DB | Spoofing | Gefälschte Service-Anfragen | Datenmanipulation | Netzwerkisolation, Service Accounts | Ja |
| DB | Tampering | SQL-Injection | Datenverlust | Prepared Statements, ORM | Ja |
| DB | Repudiation | Keine Änderungsprotokolle | Keine Nachvollziehbarkeit | Audit-Table | Ja |
| DB | Information Disclosure | Unverschlüsselter Traffic | Mitlesen von Bug-Daten | TLS intern | Teilweise |
| DB | DoS | Query-Flooding | Ausfall | Query-Limits | Teilweise |
| DB | Elevation | Manipulierte DB-Credentials | Root-Zugriff | Least Privilege | Ja |

---

## 2.3 Datenflüsse über Vertrauensgrenzen

### D1 – Nutzer → Frontend

| Dataflow | STRIDE | Bedrohung | Impact | Gegenmaßnahme | Implementiert |
|----------|--------|-----------|--------|----------------|----------------|
| D1 | Spoofing | Gestohlene Cookies | Accountübernahme | Secure Cookies, MFA optional | Ja |
| D1 | Tampering | Manipulierte Form-Inputs | XSS, CSRF | Escaping, CSRF-Token | Ja |
| D1 | Information Disclosure | Sniffing | Klartext-Daten sichtbar | TLS | Ja |

---

### D2 – Frontend → Backend

| Dataflow | STRIDE | Bedrohung | Impact | Gegenmaßnahme | Implementiert |
|----------|--------|-----------|--------|----------------|----------------|
| D2 | Spoofing | Gefälschte JWTs | Unautorisierter Zugriff | Signaturprüfung, Token-Validation | Ja |
| D2 | Tampering | Payload-Manipulation | Datenverfälschung | JSON-Schema-Validation | Ja |
| D2 | Information Disclosure | Plaintext-Traffic | Abfangen sensibler Daten | TLS | Ja |

---

### D3 – Backend → Datenbank

| Dataflow | STRIDE | Bedrohung | Impact | Gegenmaßnahme | Implementiert |
|----------|--------|-----------|--------|----------------|----------------|
| D3 | Tampering | SQL-Injection | Datenverlust | Prepared Statements | Ja |
| D3 | Information Disclosure | Abhören des DB-Traffics | Zugriff auf Reports | TLS intern | Teilweise |
| D3 | DoS | Query-Flooding | DB-Ausfall | Backend-Rate-Limits | Teilweise |

---

# 2.4 Begründung für nicht vollständig umgesetzte STRIDE-Kategorien

Drei STRIDE-Kategorien werden vollständig umgesetzt, drei ausreichend begründet, aber nicht in voller Tiefe implementiert.

### Repudiation  
Ein vollständiger Non-Repudiation-Mechanismus (digitale Aktionssignaturen) wäre überdimensioniert für ein internes Tool. Basis-Audit-Logs sind vorhanden, mehr ist nicht notwendig.

### Denial of Service (DoS)  
Komplette DoS-Abwehr wie CDN-WAF, CAPTCHA oder Bot-Mitigation ist für ein internes System nicht erforderlich. Rate-Limiting reicht für den Scope.

### Elevation of Privilege  
Ein einfaches Rollenmodell ist vorhanden. Hochkomplexe Rechteverwaltungssysteme wären unnötig aufwendig im Vergleich zum Nutzen.

---

# 2.5 Worst-Case-Szenario & Attack Tree

## Worst-Case-Szenario

Ein Angreifer erlangt über einen Validierungsfehler im Backend vollständige Kontrolle über die Datenbank und erhält dadurch Zugang zu unveröffentlichten Sicherheitslücken. Diese Informationen werden genutzt, um die Organisation durch gezielte Angriffe zu kompromittieren.

---

## Attack Tree (Textuell)

**Ziel: Zugriff auf alle unveröffentlichten Sicherheitslücken**

1. **Backend kompromittieren**
   - 1.1 SQL-Injection über Bug-Report-Endpoint
   - 1.2 Manipuliertes JWT umgehen Autorisierung
   - 1.3 Zero-Day im Backend-Framework ausnutzen

2. **Privilegien erweitern**
   - 2.1 Fehlkonfigurierte DB-User ausnutzen
   - 2.2 Gestohlene Credentials wiederverwenden
   - 2.3 Netzwerksegmentierung umgehen

3. **Daten exfiltrieren**
   - 3.1 SQL-Dump erstellen
   - 3.2 Logs mit sensiblen Daten lesen
   - 3.3 API-Endpunkte mit breiteren Datenabfragen missbrauchen

---