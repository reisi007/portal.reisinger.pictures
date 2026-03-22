# Backlog & Task Management

## Offene Punkte

### Phase 1: Datenbank & Schema (Höchste Priorität)
- [ ] **Datenmodell Metadaten (Photos & Galerien)**: Migration für `photos` (`headline`, `keywords`, `location`, `city`, `state`, `country`, `iso_country`) und `galleries` (`apply_metadata_to_photos`, `default_headline`, `default_title`, `default_description`, `default_keywords`, `default_location`, `default_city`, `default_state`, `default_country`, `default_iso_country`).
  > **Wissen / Architektur-Entscheidung (Galerie-Split):** Wir nutzen "Single Table Inheritance" (Soft Split). Selection- und Delivery-Galerien bleiben in derselben Tabelle (`galleries`), unterschieden durch die Spalte `type`. Ein "Hard Split" (zwei Tabellen) würde die Datenbank-Relationen (Fotos, Invites, Rechte) massiv verkomplizieren. Die Trennung der Features erfolgt strikt über die Code-Logik.
- [ ] **Metadaten-Berechtigungen (Galerie-Ebene)**: Ein neues Boolean-Feld (z.B. `allow_client_metadata_edit`) in `galleries` hinzufügen, um pro Galerie explizit steuern zu können, ob Kunden Metadaten ändern dürfen.
- [ ] **Metadaten-Versionierung (Tabelle)**: Neue Tabelle `photo_metadata_versions` (photo_id, user_id, alle IPTC-Felder, created_at) erstellen.

### Phase 2: Backend API, Logik & Security
- [ ] **Auth / Security (Token Refresh)**: Backend-Route `POST /api/auth/refresh` im `AuthController` anlegen. In `config/jwt.php`: `ttl` auf 240 (4h), `refresh_ttl` auf 20160 (14 Tage) und `refresh_iat` auf `true` setzen. Frontend-Interceptor in `api.ts` für Silent-Refresh bauen.
  > **Wissen / Architektur-Entscheidung (JWT Storage):** Das Token liegt im `localStorage`. Das ist ein bewusster Trade-off zugunsten der Entwickler-Ergonomie (Debugging des Payloads), obwohl HttpOnly-Cookies sicherer gegen XSS wären. Das 4h-Limit + Rolling Refresh via Interceptor minimiert das Risiko und maximiert die User-Experience (kein Logout bei aktiver Nutzung).
- [ ] **Metadaten-Berechtigungen (Prüfung)**: Logik implementieren: Kunden dürfen Metadaten nur bearbeiten, wenn `allow_client_metadata_edit` der Galerie `true` ist. Fotografen dürfen in ihren Galerien immer ändern. Das Feld "Urheber" (Artist) bleibt generell read-only und wird aus dem Fotografen-Profil gezogen.
- [ ] **Metadaten-Versionierung (Speichern & Revert)**: API-Logik anpassen: Nur wenn ein *Kunde* Metadaten ändert, wird der Vorzustand in `photo_metadata_versions` gespeichert.
  > **Wissen / Architektur-Entscheidung:** Wir speichern absichtlich keine Historie, wenn Fotografen/Admins etwas ändern, um die Datenbank nicht mit Tippfehler-Korrekturen aufzublähen.
- [ ] **Metadaten-Revert (Endpoint)**: API-Route `POST /api/photos/{id}/revert/{version_id}` zum Wiederherstellen implementieren (Zugriff strikt nur für Fotografen/Admins!).
- [ ] **Upload Logik (Fallback-Kette)**: `PhotoProcessingService` liest alle neuen IPTC-Felder aus dem Originalbild aus. Fallback-Kette: EXIF im Bild -> Galerie-Defaults -> null.
  > **Wissen / Architektur-Entscheidung:** Bei Selection-Galerien wird die IPTC/EXIF-Extraktion beim Upload komplett übersprungen. Dies spart CPU-Ressourcen, da Selection-Bilder ohnehin nicht final ausgeliefert werden.
- [ ] **Download Logik & Nutzungsbedingungen**: `DownloadController` injiziert alle DB-Felder beim Download ins JPEG.
  > **Wissen / Architektur-Entscheidung:** Die `RightsUsageTerms` erhalten fest eincodiert die URL `https://reisinger.pictures/agb` (kein DB-Feld, um Fehler zu vermeiden). Das Leak-Tracking ("Downloaded by...") bleibt davon unberührt und läuft parallel über das Feld `SpecialInstructions`.
- [ ] **Rechtemanagement (Privat)**: Sichtbarkeit für private Galerien strikt auf Fotografen und explizit eingeladene Nutzer (Rollen-/User-Basis) beschränken.
- [ ] **Rechtemanagement (Domains)**: Fotografen können private Delivery-Galerien für alle Nutzer einer bestimmten E-Mail-Domain freigeben. (Für Selection-Galerien bleibt es bei konkreten Einzelnutzern).
- [ ] **Feature**: Backend-Endpoint für die "Sammelansicht" einer Meta-Galerie (Alle Fotos der Sub-Galerien) implementieren.

### Phase 3: Frontend (React UI & Komponenten)
- [ ] **Unified IPTC Editor**: Eine wiederverwendbare React-Komponente `<IptcMetadataEditor />` erstellen.
  > **Wissen / Architektur-Entscheidung (DRY-Prinzip):** Diese Komponente wird sowohl in den Galerie-Einstellungen (für die Defaults) als auch in der Foto-Detailansicht (für Einzelbilder) exakt identisch wiederverwendet.
- [ ] **Galerie-Einstellungen (Modals)**: Den `<IptcMetadataEditor />` in `GalleryModals.tsx` für Galerie-Defaults einbauen. *Bedingung: Dieser Bereich wird nur angezeigt, wenn `type === 'delivery'` ist.* Checkbox für "Kunden dürfen Metadaten bearbeiten" hinzufügen.
- [ ] **Foto-Detailansicht**: Den `<IptcMetadataEditor />` in `PhotoDetailView.tsx` integrieren.
- [ ] **Historie & Revert UI**: In der `PhotoDetailView.tsx` für Fotografen einen Button "Änderungshistorie" einbauen, der die Versionen auflistet und den Revert-Aufruf ermöglicht.
- [ ] **Frontend-Splitting (Refactoring)**: Vorbereitung, um das `ClientGalleryView.tsx` künftig in saubere `<SelectionView />` und `<DeliveryView />` Komponenten aufzuteilen, um Spaghetti-Code aufgrund der stark abweichenden Featuresets zu vermeiden.

### Phase 4: Rechtliches & Compliance
- [ ] **DSGVO / Privacy**: DSGVO in der EU beachten. Eine Datenschutzbestimmung erstellen, im Frontend unter einer eigenen Route (z.B. `/privacy`) einbinden und bei zukünftigen Features (wie dem Leak-Tracking) stets rechtlich aktuell halten.