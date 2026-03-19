# Architectural Rules & AI Guidelines

Please read the [ARCHITECTURE.md](ARCHITECTURE.md) file first.

**0. Planning Phase & TODO Management (CRITICAL)**
* Always start your response with a clear "**Planungsphase**".
* During this phase, review `AGENTS.todo.md`. Remove completed (`[x]`) tasks, add new ones if necessary, and **NEVER** drop or delete unchecked (`[ ]`) tasks. All pending tasks must be preserved.

**1. Language Policy**
* Code & Docs: English.
* UI & Frontend Strings: German.
* **Frontend Code:** Strictly **TypeScript** (`.ts`, `.tsx`). Absolutely no plain JavaScript.

**2. Strict Separation of Concerns**
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

**5. Documentation & Setup Guides (CRITICAL)**
* Always update `README.md` or `deployment/DEPLOYMENT.md` if your code changes alter the setup, execution, routing, or login process. 
* Never leave the documentation out of sync with the codebase.

**6. Component Architecture & Fachlichkeit (React)**
* **Keep Components Small & Focused:** Components should rarely exceed 150 lines.
* **Domain Separation:** Do not mix completely different business domains in one view.
* **Modals & Forms:** Always extract Modals and complex forms into their own distinct `.tsx` components. Do not bloat the main View with Modal-State.

**7. Security Rules (CRITICAL)**
* **IDOR Prevention:** Whenever modifying, rating, or reading an object (Photo, Comment, Log), you MUST verify that the authenticated user has access to the *parent* entity (Gallery).
* **No Blind `firstOrCreate` in Auth:** Never issue a JWT for a user found via `firstOrCreate` on public/invite routes without verifying if the user already has a password or admin rights.
* **XSS Prevention in 3rd Party Libs:** When using DOM manipulation for 3rd party libraries, data from the database MUST be escaped or injected safely.
* **Legacy APIs (Lightroom):** Keep API endpoints backward compatible where possible.