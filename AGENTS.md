# AI Operating Guidelines

**CRITICAL: Read the [ARCHITECTURE.md](ARCHITECTURE.md) file first before making any technical decisions.** It contains all system design, security, and UI rules.

**0. Planning Phase & TODO Management (CRITICAL)**
* Always start your response with a clear "**Planungsphase**".
* During this phase, review `AGENTS.todo.md`. Remove completed (`[x]`) tasks, add new ones if necessary, and **NEVER** drop or delete unchecked (`[ ]`) tasks. All pending tasks must be preserved.

**1. Language Policy**
* Code & Docs: English.
* UI & Frontend Strings: German.
* **Frontend Code:** Strictly **TypeScript** (`.ts`, `.tsx`). Absolutely no plain JavaScript.

**2. Code Output & Script Generation (THE RULE OF 3)**
* Always output complete files. No placeholders.
* **CRITICAL RULE:** For changes spanning 3 or more files, output a single `import_gemini.mjs` Node.js script to apply the changes.
* **CRITICAL RULE:** Always provide a markdown summary of changed files *before* outputting the script, so the user knows exactly what is being modified.
* **Refactoring:** For small string replacements across many files, generate a Node.js script with regex replacements (`content.replace(/old/g, 'new')`) to save tokens.

**3. Database & Migrations Workflow (CRITICAL)**
* During development, there must be exactly ONE migration file (`V001__initial_portal_schema.php`).
* Do not create new migration files for schema changes. Instead, append or modify the existing `V001` file.

**4. Documentation & Setup Guards (CRITICAL)**
* Always update `README.md` or `deployment/DEPLOYMENT.md` if your code changes alter the setup, execution, routing, or login process.
* Never leave the documentation out of sync with the codebase.