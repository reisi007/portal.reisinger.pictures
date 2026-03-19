# Backlog, Security & Future Architectures

## 🔐 Auth, Registrierung & User Management
* [ ] **Neue Rolle: Fotograf:** Das System unterstützt mehrere Fotografen. Nicht jeder Fotograf ist Admin. Fotografen haben eigene Profile (Name, Metadaten/Copyright-Infos) und können eigene Galerien verwalten oder zugewiesen bekommen.
* [ ] **Offene Registrierung (Standard):** Frontend-UI für die Registrierung bauen. Registrierung ist der Standardweg.

## 🛡️ Security & File Access
* [ ] **Kein direkter Dateizugriff:** X-Accel-Redirect für die Produktion ausarbeiten, Nginx Location mit `internal;` sichern. Überlegen, wie das lokal mit Herd funktioniert und so implementieren
* [ ] **Sichere Admin-Credentials:** Fallback Admin-Credentials (`env('ADMIN_EMAIL')` / `admin`) im `AuthController` strikt auf die lokale Entwicklungsumgebung (`app()->environment('local')`) beschränken.
* [ ] **Rate-Limiting:** Throttle-Middleware für sensible Routen (`/api/auth/login`, `/api/auth/register`, `/api/invites/redeem`) hinzufügen, um Brute-Force-Angriffe zu verhindern.
* [ ] **Sichere Shell-Kommandos:** Aufrufe von `exiftool` (`exec`, `shell_exec`) in `Symfony\Component\Process\Process` refactoren, um das Restrisiko von Command-Injections komplett zu eliminieren.

## 🌍 Frontend Routing & Public Access
* [ ] **Anonymen Zugriff erlauben:** Bei Aufruf von `/g/{slug}` checken ob Galerie public ist. Wenn ja, auch ohne JWT rendern. --> warte, das sollte zumindest in react /gallery sein und REST konforme URLs ausliefern
* [ ] **Schönere Kunden-URLs:** Konzept für "schönere" und kürzere URLs ausarbeiten. (REST basiert, ganze Wörter, Gallerien sollen unter dem Parent sichtbar sein)
* [ ] **Wasserzeichen für Gäste:** Gäste dürfen öffentliche Galerien ansehen und herunterladen, erhalten aber serverseitig Wasserzeichen.

## 🖼️ Bildverarbeitung, FTP & Wasserzeichen
* [ ] **Persönliche FTP-Inbox pro Fotograf:** Eigener FTP Ordner pro Fotograf. Auto-Zuweisung & Metadaten aktualisieren bei neuen JPEGs.
* [ ] **Wasserzeichen-Optimierung (SVG -> PNG):** Globale SVG serverseitig in vordefinierte PNG-Größenstufen rendern.
* [ ] **ZIP-Download asynchron (Optional):** Evaluieren, ob IPTC-Metadaten für ZIPs asynchron im Hintergrund (Queue) vorbereitet werden können, **ohne** den sofortigen Download-Start (Stream) für den Kunden zu verzögern.

## ⚙️ Workflow & Dashboard Features
* [ ] **Audit-Log Viewer:** Eigene Tabellen-Ansicht im Dashboard um Downloads auszuwerten (DSGVO-konform ohne IPs). Statistiken wer (nach email domain gruppiert) wie viel runterlädt (im vergleich zu anonymen Nutzern))
* [x] **Suche**: Bilder und Gallerien sollen mittels meilisearch gesucht werden können. Inklusive backend und Frontend Implementierung

## 🏗️ Architektur
* [x] **Migration auf Laravel Migrations:** Flyway restlos entfernen und Datenbank-Schema vollständig über Laravel-Migrations abbilden.
