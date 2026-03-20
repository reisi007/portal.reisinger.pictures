# Backlog, Security & Future Architectures

## Kürzlich abgeschlossen
- [x] **Rollen-Trennung (Admin vs. Fotograf):** Strikte Trennung im Backend und UI. Admin verwaltet das System, Fotograf lädt Bilder hoch und erstellt Galerien.
- [x] **Fotografen-Dashboard:** Eigener Bilder- und Galerie-Feed für Fotografen unterhalb der Strukturansicht.
- [x] **Wasserzeichen:** Geprüft und bestätigt. Gäste erhalten Wasserzeichen, authentifizierte User (Kunden, Fotografen, Admins) erhalten das Original.
- [x] **Refactoring (Architektur):** `Dashboard.tsx` in `ProtectedDashboard.tsx` umbenannt. Fungiert als saubere Rollen-Weiche.
- [x] **Wording-Refactoring:** Admin-Komponenten und API-Routen systematisch in `Management...` umbenannt.
- [x] **Bugfix (Routing):** White Screen bei unbekannten URLs gefixt (Catch-All Redirect auf `/` eingebaut).
- [x] **UX/Sicherheit:** SVG-Wasserzeichen-Warnung in eine globale Komponente ausgelagert.
- [x] **UI/UX & State:** Tabs in der Benutzerverwaltung auf DaisyUI `tabs-box` umgestellt und strikt an URL Query Parameter (`?tab=...`) gebunden.

## Offene Punkte
- [ ] Test des vollständigen Bild-Upload-Workflows (Web & FTP).
- [ ] Validierung der Meilisearch-Filterregeln für berechtigten Zugriff auf Fotos.
- [ ] Implementierung/Test der Magic-Link-Logik für Gäste.
