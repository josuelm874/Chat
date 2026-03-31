# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Chat UI Sercon is a **static front-end web application** (vanilla HTML/CSS/JS) for a Brazilian accounting firm. There is **no build step, no package manager, no bundler, and no backend server**. All dependencies are loaded from CDNs at runtime.

### How to run

Serve static files from the repository root with any HTTP server:

```bash
serve . -p 3000
```

Then open the desired interface:
- **Operador**: http://localhost:3000/src/operador/index.html
- **Cliente**: http://localhost:3000/src/cliente/index.html
- **Público**: http://localhost:3000/src/publico/vagas.html

### Authentication

The Operador interface has a built-in admin account created on first load via `ensureAdminUser()`:
- **Username**: `adm`
- **Password**: `admin123`

### Key caveats

- There is no `package.json`, so there are **no lint, test, or build commands**. The project has zero build infrastructure.
- Data is stored in browser `localStorage`. Supabase integration is optional and gracefully degrades.
- All JS/CSS dependencies (Supabase, Lottie, jsPDF, html2canvas, SheetJS, Boxicons, Google Fonts) are loaded from CDNs — internet access is needed for full functionality.
- The `serve` command redirects directory URLs (e.g. `/src/operador`) to `/src/operador/` with a trailing slash, which then serves `index.html`. Always use the full path with `index.html` in automated tests.
- Configuration is hardcoded in `src/shared/config.js` — there is no `.env` file.
- See `README.md` and `docs/` for full documentation on architecture, interfaces, and modules.
