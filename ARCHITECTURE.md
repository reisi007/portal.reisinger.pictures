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

## 4. Search & Indexing (Meilisearch & Scout)
* **Real-time Synchronization (No Cronjobs):** The search index is updated synchronously without the need for scheduled tasks. Models (`Photo`, `Gallery`) utilize the `Laravel\Scout\Searchable` trait. Whenever an Eloquent model is created, updated, or deleted, Scout automatically hooks into these lifecycle events and pushes the updated payload directly to the Meilisearch REST API.
* **Configuration:** This real-time push relies on `SCOUT_QUEUE=false` in the configuration.
* **Filterable Attributes:** We use Meilisearch natively to enforce our robust permission system (`whereIn('gallery_id', [...])`). 
* **Maintenance & Desyncs:** Manual intervention is only required if the database is modified outside of Eloquent (e.g., direct SQL queries) or when index settings change. In such cases, run `php artisan scout:sync-index-settings` and `php artisan scout:import "App\Models\Photo"` manually.

## 5. Local Development & Storage Paths
For a clean reset of the development environment (especially on Windows), the following physical paths must be cleared alongside the database reset to prevent orphaned files and cache collisions:
* **`photos/`**: Contains all uploaded galleries, watermarked copies, and thumbnails (defined via `PHOTO_STORAGE_PATH`).
* **`ftp/`**: Contains the FTP inbox folders per user (defined via `FTP_STORAGE_PATH`).
* **`backend/storage/app/private/temp/`**: Temporary files created during ZIP downloads.
* **`backend/storage/app/private/watermark_master_*.png`**: Cached rasterized watermark files.
* **`backend/storage/framework/cache/data/`**: Laravel's internal file cache.

*A cross-platform cleanup tool (`clean_dev_storage.mjs`) is provided in the root directory to automate this process.*

## 6. URL-Driven State & Progressive Role Enhancement
* **Path-Based Routing:** The state of the frontend (active views like users, settings, stats) is driven strictly by React Router paths (e.g., `/users`, `/settings`).
* **Strict Role Separation:** Roles do not overlap. `admin` rights do NOT imply `photographer` rights. A system administrator who also uploads photos MUST have both roles explicitly assigned.
* **Role Upgrading:** We avoid role-specific routes. An admin visiting `/galleries/wedding-2026` gets the management UI injected, while a client visiting the exact same URL gets the download/rating UI. The view "upgrades" based on the JWT claims.

## 7. Configuration & Environment Variables
* **No Local `.env` Dependency:** For local development, we strictly avoid relying on a `.env` file. Instead, the application uses default overrides directly within the configuration files (e.g., `config/database.php`). These defaults must always mirror the local Docker setup defined in `docker-compose.local.yml`.
