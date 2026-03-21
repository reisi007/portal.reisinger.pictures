# Backlog & Task Management

## Offene Punkte

### Frontend
- [ ] **Refactoring**: Reuse types in properties in the Props of the React hooks to make them more human readable and maintainable.

### Backend & Datenbank
- [ ] **Feature (Low Prio)**: Lokaler Toggle (z.B. .env oder UI) implementieren, um die rechenintensive Bildverarbeitung (Imagick/ExifTool) für schnelles lokales Testen zu deaktivieren.
- [ ] **Rechtemanagement (Privat)**: Sichtbarkeit für private Galerien strikt auf Fotografen und explizit eingeladene Nutzer (Rollen-/User-Basis) beschränken.
- [ ] **Rechtemanagement (Domains)**: Fotografen können private Galerien für alle Nutzer einer bestimmten (bereits bekannten) E-Mail-Domain freigeben.
- [ ] **Metadaten-Berechtigungen (Kunden)**: Das Bearbeiten von Metadaten durch Kunden muss pro Galerie explizit erlaubt werden.
- [ ] **Metadaten-Berechtigungen (Fotografen)**: Fotografen dürfen in Galerien, auf die sie Zugriff haben, Metadaten ändern. Das Feld "Urheber" (Artist) bleibt read-only.
- [ ] **Feature**: Backend-Endpoint für die "Sammelansicht" einer Meta-Galerie (Alle Fotos der Sub-Galerien) implementieren, da der UI-Button jetzt existiert.
