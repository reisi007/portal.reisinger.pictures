# Architectural Rules & AI Guidelines

Please read the [ARCHITECTURE.md](ARCHITECTURE.md) file first.

**1. Language Policy**
* Code & Docs: English.
* UI & Frontend Strings: German.
* **Frontend Code:** Strictly **TypeScript** (`.ts`, `.tsx`). Absolutely no plain JavaScript.

**2. Strict Separation of Concerns**
* **Backend (Laravel):** Completely stateless JSON API. Auth via JWT.
* **Frontend (React):** STRICT Separation of Logic (SWR data fetching) and UI (Dumb components).
* **Database:** Flyway is the single source of truth. Surrogate integer primary keys.

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
