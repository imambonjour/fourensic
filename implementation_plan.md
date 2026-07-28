# Migrate Fourensic to Next.js (App Router)

The core problem is that the current stack — `express` + `fs-extra` + `server.js` — fundamentally does not work on Vercel's serverless model. Even with the `ensureDirs` fix, `/tmp` is ephemeral and wiped between cold starts, meaning all history, lock state, and config are lost constantly. The right solution is to rebuild in **Next.js**, which Vercel was built for, and replace the filesystem storage with **Vercel KV** (a free Redis-backed key-value store) so data actually persists.

## What the App Does (Preserved Features)
- **Seating chart**: Displays paired seat assignments (M+M or F+F pairs per desk)
- **Reshuffle**: Randomizes seat assignments, saves to storage
- **Lock/Unlock**: Admin-password-gated toggle that blocks reshuffling for 2 weeks
- **History**: Browse, view, and restore past seating configurations
- **Download**: Export seating chart as PNG image

## User Review Required

> [!IMPORTANT]
> **Vercel KV is required for persistence.** The current app uses the local filesystem for storage, which doesn't work on serverless. Vercel KV (free tier: 256MB) is the natural replacement. You'll need to:
> 1. Go to your Vercel dashboard → Storage → Create a KV database
> 2. Link it to your project → it auto-adds `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` env vars
>
> Alternatively, I can use **in-memory state** (simpler, but resets on cold start — same as current) or **a free external DB** like Upstash. Let me know your preference.

> [!WARNING]
> **The old project directory will be replaced.** I'll scaffold a fresh Next.js project inside `/home/normies/Projects/fourensic`. The existing `server.js`, `index.html`, `history.html`, `script.js`, `history.js`, and `style.css` will be deleted or superseded. The `name.csv` and `current.json` data will be migrated and embedded.

## Open Questions

> [!IMPORTANT]
> **Storage backend choice** — which do you prefer?
> - **Vercel KV** (recommended): Free, persistent, built-in Redis. Requires linking in Vercel dashboard.
> - **Upstash Redis** (alternative): Free tier, works without Vercel dashboard setup. Requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars.
> - **In-memory / no persistence**: Simplest, but config/history/lock reset when the function cold-starts. Fine if you just need the UI to work.

## Proposed Changes

This is a **full rebuild** in the same directory. The stack will be:
- **Next.js 15** (App Router) — framework
- **Vercel KV** (`@vercel/kv`) — persistent storage replacing the filesystem
- **CSS Modules** — keeping the same visual design from `style.css`
- **`html2canvas`** — CDN-loaded, for the download feature (unchanged)

### Project Structure

```
fourensic/
├── app/
│   ├── layout.js          # Root layout (header, fonts)
│   ├── page.js            # Main seating chart page
│   ├── history/
│   │   └── page.js        # History page
│   └── api/
│       ├── names/route.js         # GET /api/names
│       ├── config/
│       │   ├── route.js           # POST /api/config (save new config)
│       │   └── latest/route.js    # GET /api/config/latest
│       ├── lock/route.js          # GET + POST /api/lock
│       └── history/
│           ├── route.js           # GET /api/history
│           └── [filename]/
│               ├── route.js       # GET /api/history/:filename
│               └── restore/route.js  # POST /api/history/:filename/restore
├── components/
│   ├── SeatingChart.js    # Renders seating pairs
│   ├── HistoryList.js     # History list + modal
│   └── Header.js          # Navigation header
├── lib/
│   └── storage.js         # Abstraction over Vercel KV
├── public/
│   ├── favicon.svg        # Copied from existing
│   └── name.csv           # Copied from existing (read at request time)
├── styles/
│   └── globals.css        # Ported from style.css
├── next.config.js
├── package.json
└── vercel.json            # Simplified (Next.js handles routing)
```

---

### [DELETE] All legacy files
- `server.js`, `index.html`, `history.html`, `script.js`, `history.js`, `style.css`
- `api/index.js`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`

---

### [NEW] next.config.js
Minimal Next.js config.

### [NEW] package.json
Replaces current `package.json`. Dependencies: `next`, `react`, `react-dom`, `@vercel/kv`.

### [NEW] app/layout.js
Root layout with `<html>`, `<head>` (fonts, favicon, Font Awesome), and `<Header>` component.

### [NEW] app/page.js
Client component. On mount, fetches `/api/config/latest` and `/api/lock`. Renders `<SeatingChart>`. Has Reshuffle, Download, and Lock buttons.

### [NEW] app/history/page.js
Client component. Fetches `/api/history`. Renders `<HistoryList>` with modal for viewing old layouts.

### [NEW] app/api/* (Route Handlers)
All 7 API routes, ported from `server.js`. Replace `fs.*` with `lib/storage.js` (Vercel KV calls).

### [NEW] lib/storage.js
Wrapper around `@vercel/kv` for:
- `getNames()` — reads `name.csv` from `public/`
- `getLock()` / `setLock(state)`
- `getCurrentConfig()` / `setCurrentConfig(config)`
- `getHistory()` / `getHistoryItem(filename)` / `saveHistoryItem(filename, config)`

### [NEW] components/SeatingChart.js
Ported from `script.js` render logic. Pure React component.

### [NEW] components/HistoryList.js
Ported from `history.js`. Includes modal.

### [NEW] styles/globals.css
Ported from `style.css` with minor additions for Next.js layout.

### [KEEP] public/favicon.svg, public/name.csv
Static assets served directly.

### [MODIFY] vercel.json
Simplified to `{}` — Next.js projects don't need manual routing config on Vercel.

## Verification Plan

### Automated Tests
- `npm run build` — must pass with zero errors

### Manual Verification
1. Run `npm run dev` locally and confirm:
   - Seating chart loads on `/`
   - Reshuffle generates and saves new config
   - Lock/unlock works with password
   - History page shows past configs
   - Modal shows old seating layout
   - Restore replaces current config
2. Deploy to Vercel and confirm no `FUNCTION_INVOCATION_FAILED`
