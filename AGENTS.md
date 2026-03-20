# Architectural Rules & AI Guidelines

Please read the [ARCHITECTURE.md](ARCHITECTURE.md) file first.

**0. Planning Phase & TODO Management (CRITICAL)**
* Always start your response with a clear "**Planungsphase**".
* During this phase, review `AGENTS.todo.md`. Remove completed (`[x]`) tasks, add new ones if necessary, and **NEVER** drop or delete unchecked (`[ ]`) tasks. All pending tasks must be preserved.

**1. Language Policy**
* Code & Docs: English.
* UI & Frontend Strings: German.
* **Frontend Code:** Strictly **TypeScript** (`.ts`, `.tsx`). Absolutely no plain JavaScript.

**2. Strict Separation of Concerns & Roles (CRITICAL)**
* **No Overlapping Roles:** Roles must NEVER overlap or imply each other. An 'admin' does NOT automatically have 'photographer' rights. If an admin needs to upload photos, they MUST explicitly be assigned the 'photographer' role. Admins manage the system, Photographers manage content, Clients view content.
* **Backend (Laravel):** Completely stateless JSON API. Auth via JWT.
* **Frontend (React):** STRICT Separation of Logic (SWR data fetching) and UI (Dumb components).
* **Database:** Native **Laravel Migrations** are the single source of truth. Surrogate integer primary keys. (Flyway is deprecated).

**3. Security, State & Auditing**
* Unprivileged users are implicitly `pending`.
* Audit logs use `ON DELETE SET NULL` and denormalized snapshots. No IP tracking.

**4. Code Output & Script Generation (THE RULE OF 3)**
* Always output complete files. No placeholders.
* **CRITICAL RULE:** For changes spanning 3 or more files, output a single `import_gemini.mjs` script.
* **CRITICAL RULE:** Always provide a markdown summary of changed files *before* outputting the script, so the user knows exactly what is being modified.

**5. Search & Replace Scripts for Refactoring**
* For small string replacements, variable renaming, or refactoring across many files, generate a Node.js script that reads the files, performs `content.replace(/old/g, 'new')`, and writes them back. This saves tokens and keeps the output concise.

**6. Documentation & Setup Guides (CRITICAL)**
* Always update `README.md` or `deployment/DEPLOYMENT.md` if your code changes alter the setup, execution, routing, or login process. 
* Never leave the documentation out of sync with the codebase.

**7. Component Architecture & Fachlichkeit (React)**
* **Keep Components Small & Focused:** Components should rarely exceed 150 lines.
* **Domain Separation:** Do not mix completely different business domains in one view.
* **Modals & Forms:** Always extract Modals and complex forms into their own distinct `.tsx` components.

**8. URL-Driven State & Progressive Role Enhancement (CRITICAL)**
* **Path & Query Parameters First:** Application state MUST be derived from the URL. Use **Path Parameters** (e.g., `/users`, `/settings`) for main views. Use **Query Parameters** (e.g., `?tab=mappings`) for sub-views, tabs, or filters. Do not use local `useState` for navigation or tab selection.
* **Progressive View Upgrading:** The same URL must be used across different roles. An admin visiting `/users` sees the management UI. A client visiting `/users` gracefully falls back to their standard dashboard view without errors.

**9. Security Rules (CRITICAL)**
* **IDOR Prevention:** Whenever modifying, rating, or reading an object, you MUST verify that the authenticated user has access to the *parent* entity (Gallery).
* **No Blind `firstOrCreate` in Auth:** Never issue a JWT for a user found via `firstOrCreate` on public/invite routes without verifying if the user already has a password or admin rights.
* **XSS Prevention in 3rd Party Libs:** When using DOM manipulation for 3rd party libraries, data from the database MUST be escaped or injected safely.

**10. Database & Migrations Rule (CRITICAL)**
* During development, there must be exactly ONE migration file (`V001__initial_portal_schema.php`).
* Do not create new migration files for schema changes. Instead, append or modify the existing `V001` file.

**11. Graceful Degradation & Error Boundaries (CRITICAL)**
* **Isolate Failures:** The application must not crash entirely due to a localized bug or malformed API response.
* **Implementation:** Always use React Error Boundaries (`ErrorBoundary`) to wrap distinct UI sections.
