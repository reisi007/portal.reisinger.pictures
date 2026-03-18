# Backlog, Security & Future Architectures

## 🔐 Auth, Registrierung & User Management (Prio 1)
* [ ] **Offene Registrierung (Standard):** Frontend-UI für die Registrierung bauen. Registrierung ist der Standardweg (Gäste via Magic-Link sind nur ein Bonus/Fallback und werden primär für Bewertungs-Galerien genutzt).
* [ ] **Automatische Domain-Zuordnung (`domain_mappings`):** Neue Datenbank-Tabelle anlegen (wird direkt in die initiale Flyway-Migration `V1__Initial_SaaS_Architecture.sql` integriert). Wenn sich ein User registriert (z.B. `@firma.de`), prüft das Backend, ob die Domain gemappt ist, und weist automatisch die vorkonfigurierten Rollen/Galerie-Gruppen zu.
* [ ] **User Management UI:** Ansicht im Admin-Dashboard, um Kunden zu verwalten, `domain_mappings` anzulegen und manuelle Rechte zu vergeben.

## 🌍 Frontend Routing & Public Access (Prio 1)
* [ ] **Anonymen Zugriff erlauben:** Das strikte Frontend-Routing (`ProtectedRoute`) aufweichen. Bei Aufruf von `/g/{slug}` fragt das Frontend das Backend. Wenn die Galerie `is_public` ist, wird sie auch ohne JWT für Gäste gerendert.
* [ ] **Schönere Kunden-URLs:** Konzept für "schönere" und kürzere URLs für Kunden ausarbeiten (mit Ausnahme der Magic-Links, die aus Sicherheitsgründen kryptisch bleiben müssen).
* [ ] **Wasserzeichen für Gäste:** Gäste dürfen öffentliche Galerien ansehen und herunterladen, erhalten aber serverseitig zwingend Wasserzeichen in die Bilder gerendert (bei Einzel- und ZIP-Download).
* [ ] **Dynamische Sitemaps (SEO):** SEO ist wichtig für öffentliche Galerien. Das React-Projekt verweist auf Backend-Routen, die korrektes XML generieren (z.B. `/api/sitemap-galleries.xml` und `/api/sitemap-images.xml`).

## 🖼️ Bildverarbeitung & Wasserzeichen (Prio 2)
* [ ] **Wasserzeichen-Optimierung (SVG -> PNG):** Logik aus dem alten `live`-System ins Laravel-Backend portieren und verbessern. Ein globales SVG wird bei Änderung serverseitig in vordefinierte PNG-Größenstufen gerendert (Caching). Bei on-the-fly Downloads wird das bestpassende PNG geladen und skaliert, um CPU-Zeit bei großen ZIP-Archiven zu sparen.
* [ ] **Wasserzeichen Admin-UI & Fallback:** Das globale SVG wird über das Admin-Dashboard hochgeladen und verwaltet. Fehlt das SVG, darf *kein Fehler* auftreten (Bilder werden dann ohne Wasserzeichen ausgeliefert), aber im Admin-Dashboard wird eine sichtbare Warnung angezeigt.
* [ ] **IPTC Metadaten Anzeige:** In der großen Einzelbild-Ansicht (`PhotoDetailView.tsx`) sowie im **Vollbildmodus von PhotoSwipe** sollen die IPTC/EXIF-Daten des Bildes (Titel, Beschreibung, Copyright) angezeigt werden.
* [ ] **Kunden-Rechteverwaltung (Metadaten):** Der Kunde erhält ein *globales* Recht (z.B. via Rolle oder Spalte `can_edit_metadata` in der `users`-Tabelle). Wenn aktiv, darf der Kunde Metadaten für *alle* Galerien, die er sehen kann, im Frontend bearbeiten. Diese werden via ExifTool live geschrieben.
* [ ] **Cache-Invalidierung:** Sicherstellen, dass der Bilder-Cache (Thumbnails, WebP-Varianten) bei jeglichen Metadaten-Updates (z.B. neue Beschreibung) sofort und korrekt verworfen/neu generiert wird.

## ⚙️ Workflow & Dashboard Features (Prio 3)
* [ ] **Generalisiertes E-Mail-System:** Nicht nur "Auswahl beendet", sondern ein flexibles E-Mail-System via `GmailRestTransport` (Kunde meldet fertige Bewertung, Fotograf benachrichtigt Kunden über Galerie-Updates, etc.). *Hinweis: Wird konzeptionell gemeinsam ausgearbeitet, sobald dieses Ticket gestartet wird.*
* [ ] **Dashboard-Statistiken:** Backend-Routen und Frontend-Kacheln zur Anzeige von Gesamt-Downloads und Galerie-Anzahl (inkl. Berücksichtigung von Soft-Deletes).
* [ ] **Audit-Log Viewer:** Eigene Tabellen-Ansicht im Fotografen-Dashboard, um die `download_logs` (DSGVO-konform ohne IPs) auszuwerten. Hierbei sollen Downloads auch nach den automatisch zugeordneten Domains (`domain_mappings`) gruppiert und analysiert werden können.