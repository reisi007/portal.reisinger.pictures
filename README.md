# portal.reisinger.pictures

Moderne, zustandslose SaaS-Plattform für Fotografen zur Bildauswahl und Auslieferung.

## 🚀 Hybrides Login-Verfahren

Das Portal unterscheidet strikt zwischen zwei Nutzertypen:

1. **Fotografen (Admins):** Loggen sich über `/login` mit E-Mail und Passwort ein, um Galerien zu verwalten.
2. **Kunden (Gäste):** Erhalten einen individuellen **Magic Link** (`/invite/{token}`). Beim ersten Aufruf identifizieren sie sich einmalig mit Name/E-Mail (und ggf. Passwort) und erhalten danach ein JWT für den direkten Zugriff.

## Lokales Setup (Quickstart)

Wir nutzen ein hybrides lokales Setup: **Laravel Herd** für PHP/Nginx und **Docker** für Infrastruktur-Dienste.

### 1. Backend, Datenbank & Suche
1. Infrastruktur starten: `docker compose -f docker-compose.local.yml up -d` (Startet MariaDB & Meilisearch)
2. Config kopieren: `cd backend && cp .env.local .env`
3. SSL aktivieren: `herd secure portal.test`
4. Datenbank migrieren: `php artisan migrate`

### 2. Frontend (React / Vite)
1. Install: `pnpm install` (im `frontend/` Ordner)
2. Start: `pnpm dev` -> erreichbar unter **http://localhost:4321**

### 3. Login-Daten (Lokal)
- **Dashboard:** `florian@reisinger.pictures` / `admin`
- **Datenbank:** user: `portal_user` / pass: `admin`