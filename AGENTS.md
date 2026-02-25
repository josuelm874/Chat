# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Chat UI – Sercon is a **static web application** (pure HTML/CSS/JS, no build step) for a Brazilian accounting firm. It has three interfaces:

| Interface | Entry point | Description |
|-----------|-------------|-------------|
| Operador | `src/operador/boot.html` | Internal operators: chat, NCM lookup, job vacancies, reports |
| Cliente | `src/cliente/boot.html` | External clients: support chat, NCM, recruitment |
| Público | `src/publico/vagas.html` | Public job listings and applications |

### Running the dev server

```bash
serve . -l 3000
```

Or any static HTTP file server from the project root. See README.md for details.

### Key caveats

- **No build step, no package.json, no automated tests, no linter configured.** The project is purely static HTML/CSS/JS.
- All external libraries (Boxicons, Lottie, jsPDF, html2canvas, Google Fonts, Supabase client) are loaded from **CDNs at runtime** — internet access is required.
- Data persistence uses **localStorage** with optional Supabase cloud sync (configured in `src/shared/config.js`).
- Firebase is configured but **disabled** (`FIREBASE.ENABLED: false`).
- The operator boot screen (`boot.html`) auto-redirects to `index.html` after the splash animation.
- First-time use requires creating an operator/user via the admin panel (operator interface).
