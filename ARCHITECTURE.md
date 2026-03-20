# System Architecture: portal.reisinger.pictures

## 1. High-Level Components
* **Frontend (React SPA):** Built with Vite, React, TypeScript, TailwindCSS v4, and DaisyUI.
* **Backend (Laravel):** Stateless JSON API (JWT Auth). Handles business logic, **on-the-fly zip streaming**, and **synchronous ExifTool injection/thumbnail generation** to keep the infrastructure footprint small (no background queue workers required).
* **Database (MariaDB):** Managed via native **Laravel Migrations**.
* **Search Engine (Meilisearch):** Typo-tolerant search via Laravel Scout.
* **Lightroom Plugin (Lua):** Custom plugin with TWO distinct workflows (Selection vs. Delivery).

## 2. Core Workflows (Selection vs. Delivery)
The system strictly separates the selection phase (client rating) from the delivery phase (high-res downloads). Ratings are synced back to Lightroom via the API. 

## 3. Auditing, GDPR & Leak Tracing
* **Immutable Logs:** Denormalized snapshots (`gallery_name_snapshot`) and `ON DELETE SET NULL` ensure immutable audit trails in `download_logs`. 
* **No IP Tracking:** IP tracking is strictly disabled to comply with GDPR.
* **Leak Tracing (ExifTool):** During the delivery workflow, the `DownloadController` uses ExifTool to dynamically inject the downloader's name (e.g., "Downloaded by: Maria Muster") into the `SpecialInstructions` IPTC field of the JPEG. This allows tracing leaked images back to the exact client session without relying on visible watermarks.

## 4. URL-Driven State & Progressive Role Enhancement
* **Path-Based Routing:** The state of the frontend (active views like users, settings, stats) is driven strictly by React Router paths (e.g., `/users`, `/settings`).
* **Strict Role Separation:** Roles do not overlap. `admin` rights do NOT imply `photographer` rights. A system administrator who also uploads photos MUST have both roles explicitly assigned.
* **Role Upgrading:** We avoid role-specific routes. An admin visiting `/galleries/wedding-2026` gets the management UI injected, while a client visiting the exact same URL gets the download/rating UI. The view "upgrades" based on the JWT claims.
