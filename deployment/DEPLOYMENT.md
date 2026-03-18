# Deployment Guide (Production)

Dieses Projekt wird via **Portainer** als Docker-Stack bereitgestellt.

## 1. Automatisierte Initialisierung
Der Stack nutzt eine Abhängigkeitskette (DB -> Flyway -> Backend-Init -> Backend), um einen fehlerfreien Kaltstart zu garantieren. 

**Wichtig:** Der Container `backend-init` generiert beim ersten Start vollautomatisch den `APP_KEY` und das `JWT_SECRET`, sofern diese in der `.env` leer sind. Es ist kein manueller Eingriff via Konsole nötig.

## 2. Portainer Umgebungsvariablen
Alle Konfigurationen erfolgen direkt in der Portainer-Oberfläche. Diese überschreiben die Werte in der `.env`.

### Datenbank & Suche
* `DB_ROOT_PASSWORD`, `DB_PASSWORD`, `MEILI_MASTER_KEY`

### E-Mail / SMTP (Gmail App-Passwort)
* `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`
* `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`

## 3. Frontend Build & Routing
1. Frontend lokal bauen: `pnpm build` im Ordner `frontend/`.
2. Den resultierenden `dist/` Ordner auf den Server laden.
3. Im Nginx Proxy Manager / Traefik:
   - `/api/*` -> `portal_backend` (Port 80)
   - `/*` -> `portal_frontend` (Port 80)
