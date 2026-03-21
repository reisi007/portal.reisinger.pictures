# Backlog & Task Management

## Offene Punkte

### Backend & API
- [ ] Implementierung: Validierung der Meilisearch-Filterregeln für berechtigten Zugriff auf Fotos im Such-Controller sicherstellen.
- [ ] Implementierung: Einzigartigkeit von Galerie-Namen sicherstellen (Namen müssen auf der gleichen Ebene / mit dem gleichen `parent_id` unique sein).
- [ ] Refactoring (Security): Alle bestehenden API-Endpoints prüfen und auf API Resources / DTOs umstellen, um sicherzustellen, dass `password_hash` nirgends geleakt wird. (siehe Architekturregel)
- [ ] Die Einhaltung der Architekturregeln im Gesamten Code überprüfen

### Frontend (UI/UX)
- [ ] UI-Update: Sidebar Bearbeiten-Dialog für Meta-Galerien und normale Galerien direkt aus der Seitenleiste ermöglichen.
- [ ] UI-Update: Löschen-Button in den Bearbeiten-Dialog verschieben (statt ihn direkt in der Sidebar-Zeile zu haben).
- [ ] Feature: Button in Sidebar hinzufügen, um eine Meta-Galerie zu öffnen (Ansicht, die alle Fotos aus allen darunterliegenden Sub-Galerien gesammelt anzeigt).
- [ ] Refactoring (Mobile): CSS-Hover-Klassen (`group-hover:opacity-100`) von allen bestehenden Aktions-Buttons (Karten, Sidebar) entfernen, um Touch-Bedienbarkeit zu gewährleisten.
