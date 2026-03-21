# Backlog & Task Management

## Offene Punkte


### Lightroom Plugin (Feature Parity)
- [x] **Layout & Rollencheck**: Spacing der UI verbessern und prüfen, ob der eingeloggte User die Fotografen-Rolle hat (via `/api/auth/me`).
- [x] **Galerien bearbeiten**: Möglichkeit hinzufügen, bestehende Galerien umzubenennen und den Live-Modus zu toggeln.
- [x] **Meta-Galerien verwalten**: Erstellen und Bearbeiten von Ordnern / Meta-Galerien direkt aus LR heraus ermöglichen.
- [x] **Erweitertes Invite-Management**: Das "Einladungs-Link kopieren"-Feature ausbauen, um eine Liste von benannten Invites verwalten zu können (wie im React Frontend).

### Frontend
- [ ] **UI Refactoring**: Überprüfen und Sicherstellen, dass alle Infotexte/Beschreibungen in Formularen strikt *unterhalb* des jeweiligen Inputs angezeigt werden.
- [ ] **Feature (Galerie-Management)**: Möglichkeit schaffen, direkt aus der Galerie-Verwaltung heraus registrierte Nutzer der Galerie oder Meta-Galerie hinzuzufügen/zu entfernen (bisher nur global in /users möglich).
- [ ] **Frontend Refactoring**: Alle verbleibenden `alert()` Aufrufe (z.B. im Reset-Password, Login, Invites) entfernen und durch saubere UI-Toasts ersetzen.
- [ ] **Refactoring**: Reuse types in properties in the Props of the React hooks to make them more human readable and maintainable.

### Backend & Datenbank
- [ ] **Feature (Low Prio)**: Lokaler Toggle (z.B. .env oder UI) implementieren, um die rechenintensive Bildverarbeitung (Imagick/ExifTool) für schnelles lokales Testen zu deaktivieren.
- [ ] **Rechtemanagement (Privat)**: Sichtbarkeit für private Galerien strikt auf Fotografen und explizit eingeladene Nutzer (Rollen-/User-Basis) beschränken.
- [ ] **Rechtemanagement (Domains)**: Fotografen können private Galerien für alle Nutzer einer bestimmten (bereits bekannten) E-Mail-Domain freigeben.
- [ ] **Metadaten-Berechtigungen (Kunden)**: Das Bearbeiten von Metadaten durch Kunden muss pro Galerie explizit erlaubt werden.
- [ ] **Metadaten-Berechtigungen (Fotografen)**: Fotografen dürfen in Galerien, auf die sie Zugriff haben, Metadaten ändern. Das Feld "Urheber" (Artist) bleibt read-only.
- [ ] **Feature**: Backend-Endpoint für die "Sammelansicht" einer Meta-Galerie (Alle Fotos der Sub-Galerien) implementieren, da der UI-Button jetzt existiert.