# portal.reisinger.pictures

Moderne, zustandslose SaaS-Plattform für Fotografen zur Bildauswahl und Auslieferung.

## 🚀 Hybrides Login-Verfahren

Das Portal unterscheidet strikt zwischen zwei Nutzertypen:

1. **Fotografen (Admins):** Loggen sich über `/login` mit E-Mail und Passwort ein, um Galerien zu verwalten.
2. **Kunden (Gäste):** Erhalten einen individuellen **Magic Link** (`/invite/{token}`). Beim ersten Aufruf identifizieren sie sich einmalig mit Name/E-Mail (und ggf. Passwort) und erhalten danach ein JWT für den direkten Zugriff.

## Lokales Setup (Quickstart mit IntelliJ / PhpStorm)

Das lokale Setup ist vollständig in VS Code integriert. Öffne einfach den **Run & Debug** Tab (`Ctrl+Shift+D` oder `Cmd+Shift+D`) in VS Code.

### 1. Der reguläre Start
Wähle im Dropdown **`🚀 [Run] Start Alles (Docker + Frontend)`** und klicke auf Play.
Das startet automatisch MariaDB, Meilisearch und deinen Vite-Dev-Server (Frontend auf **http://localhost:4321**).

### 2. Einmaliges Setup (beim ersten Mal oder nach Pulls)
Falls du das Projekt neu eingerichtet hast oder sich die Datenbankstruktur geändert hat, führe nacheinander folgende Launches aus dem Dropdown aus:
1. `⚙️ [Setup] Backend: Init (.env & Cache)`
2. `🔑 [Setup] Backend: JWT Secret generieren`
3. `💾 [Setup] Backend: DB Migration (Update)`

*(Tipp: Vergiss nicht, lokal `herd secure portal.test` auszuführen, falls du Laravel Herd nutzt!)*

### 3. Wartung & Herunterfahren
* **Index aktualisieren:** Wenn du Probleme mit der Suche hast, führe `🔍 [Wartung] Meilisearch Sync & Import` aus.
* **Feierabend:** Nutze `🛑 [Core] Stop Docker (Graceful)` um die Datenbank und Suche sauber herunterzufahren, bevor du den PC ausschaltest.
* **Achtung:** `🧨 [Gefahr] DB Reset & Seed` löscht deine gesamte lokale Datenbank unwiderruflich und baut sie neu auf!

### Login-Daten (Lokal)
- **Dashboard:** `florian@reisinger.pictures` / `admin`
- **Datenbank:** user: `portal_user` / pass: `admin`
