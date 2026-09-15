# ThyroTrack backend

Standalone Express + SQLite service for push notifications, scheduled
reminders (node-cron), the doctor-report PDF export, and lab-photo OCR.
Deployed separately from the frontend — this needs a **persistent, always-on
process**, which a static host (Vercel, Netlify, GitHub Pages) can't provide.

## Local development

```bash
cd server
npm install
cp .env.example .env
npx web-push generate-vapid-keys   # paste the two keys into .env
node index.js                      # listens on :3001
```

With the backend running, `npm run dev` at the repo root (Vite) proxies
`/api/*` to `localhost:3001` automatically — no extra frontend config needed
for local dev.

## Deploying

### Option A — Render (recommended, has a free tier + persistent disks)

1. Push this repo to GitHub if you haven't already.
2. In the Render dashboard: **New → Blueprint**, point it at this repo. It
   reads `render.yaml` at the repo root and provisions the service,
   including a 1GB persistent disk for the SQLite file.
3. In the service's **Environment** tab, set the three secrets the blueprint
   leaves blank:
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — from
     `npx web-push generate-vapid-keys` (run once locally, reuse the same
     pair going forward — regenerating invalidates every existing
     subscription).
   - `CORS_ORIGIN` — your deployed frontend's URL, e.g.
     `https://thyrotrack.vercel.app`.
4. Note the resulting backend URL (e.g. `https://thyrotrack-api.onrender.com`).

### Option B — Railway / Fly.io / any Node host

The same `server/` directory runs anywhere that gives you a persistent Node
process:

```bash
npm install
node index.js
```

Set `PORT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL`,
`CORS_ORIGIN`, and (if the platform's local disk isn't persistent) `DB_PATH`
pointing at a mounted volume — see `.env.example` for all of them.

### Wiring the frontend to the deployed backend

The frontend calls relative `/api/*` paths by default (works via the Vite
dev proxy, or if you ever put both behind one reverse proxy). Once the
backend is deployed on its own domain, set an environment variable at
**frontend build time** so the static bundle calls it directly:

```bash
# wherever the frontend is deployed (e.g. Vercel project settings ->
# Environment Variables):
VITE_API_URL=https://thyrotrack-api.onrender.com
```

Rebuild/redeploy the frontend after setting this — Vite inlines env vars at
build time, so it won't take effect until the next build.

## What's in here

| File | Purpose |
|---|---|
| `index.js` | Express app entry point, CORS, mounts routes, starts cron |
| `routes.js` | All HTTP endpoints |
| `db.js` | SQLite schema + queries (better-sqlite3) |
| `webpush.js` | VAPID setup + `sendToAll()` |
| `cron.js` | The 6 scheduled notification jobs |
| `export.js` | 5-page doctor report PDF (pdfkit) |
| `ocr.js` | Lab-photo text extraction (tesseract.js) |

## Known limitation

Everything here (push delivery, cron reminders, PDF/OCR) only works while
this process is actually running. There's no queue or retry layer — if the
service is down when a cron job would fire, that notification is simply
skipped, not deferred.
