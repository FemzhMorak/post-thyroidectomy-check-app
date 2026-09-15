# ThyroTrack — Thyroid Health Monitor

ThyroTrack is a thyroid lab-result tracker and medication companion. You
enter your TSH, Free T3, and Free T4 values, and it explains what they
mean, how urgent (or not) they are, what to do next, and helps you stay
consistent with your levothyroxine dose over time.

It's built specifically for **post-thyroidectomy patients** — people whose
thyroid has been fully or partially removed and now rely on daily
medication to keep their hormone levels stable — though it also supports
Hashimoto's, Graves', nodules, and other thyroid statuses with their own
therapeutic targets.

All analysis happens locally in the app; nothing about how the app
reasons about your labs depends on a server being reachable.

> **Screenshot / demo:** _add a screenshot or a link to a live demo here._

## Features

**Lab analysis**
- Lab results entry for TSH, Free T3, and Free T4, with support for
  optional markers (Total T4, Total T3, TPO antibodies, Thyroglobulin,
  Reverse T3) and per-field unit switching (e.g. pmol/L ↔ ng/dL)
- Clinical interpretation derived from the actual numbers entered — no
  hardcoded or preset results
- Side-by-side comparison table against lab reference ranges and your
  personal "optimal" target, sourced from ATA, BTA, NHS, ARUP, Quest
  Diagnostics, and LabCorp guidelines
- Risk gauge with a 0–100 score and five zones (Stable → Critical), plus a
  compact version in the form header
- 4 result cards (Overview, What This Means, Supplements & Food, Action
  Plan) that flip open into a floating detail panel
- Clinical interpretation paragraph explaining the TSH/Free T3/Free T4
  pattern in plain language
- Symptoms panel matched to your diagnosis state
- Dose management guidance (suggested 25mcg adjustments, direction, and
  reasoning)
- Supplement and food recommendations tailored to your result
- Clinic visit / retest timeline
- Levothyroxine absorption rules (timing, interactions, storage)
- TSH trend prediction once 2+ prior results exist, projecting when you
  might reach your optimal range (or flagging a worsening trend)
- Dose-to-TSH correlation table showing which dose has historically kept
  your TSH most stable
- Lab photo scan (OCR) — upload a photo of a lab report and auto-fill the
  TSH/Free T3/Free T4 fields, with a confidence indicator

**Medication & wellness tracking**
- Medication logging with streaks, monthly adherence %, and a
  missed-doses-this-week warning
- Wellness check-in (good / okay / not great) with a short follow-up note
  based on your answer
- "Generate doctor report" — a 5-page PDF (patient summary, lab history,
  TSH trend chart, medication adherence, wellness trend) built from your
  logged data

**Notifications**
- Push notifications (6 types — see below) sent from the backend via
  `web-push`, for anyone using the web/PWA version
- The same 6 reminders also scheduled as on-device local notifications in
  the native app builds, so they still fire without a server connection

**Platform**
- Installable PWA (manifest, service worker, offline app-shell caching,
  install prompt for both Android and iOS)
- Native iOS and Android apps via Capacitor, with haptic feedback on key
  interactions (card flip, analyze, dose logged, wellness check-in, sheet
  open, and stronger feedback for optimal vs. urgent results)

**Look and feel**
- Animated particle-network background that shifts color to match your
  most recent diagnosis
- Layered gradient/blob background underneath the particle network
- Dark, clinical dashboard UI throughout

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | SQLite via `better-sqlite3` |
| Mobile | Capacitor 8 |
| Notifications | `@capacitor/local-notifications` + `@capacitor/push-notifications` (native), `web-push` (browser/PWA) |
| OCR | `tesseract.js` |
| PDF | `pdfkit` |
| Charts/gauges | Hand-built inline SVG (the risk gauge, mini gauge, and marker gauges) — `recharts` is present in `package.json` but not currently used by any component |
| Styling | Plain CSS (`src/index.css`) — no CSS framework |
| Icons | Emoji + custom inline SVG illustrations — no icon library |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Deployment | Vercel (frontend) + your choice of Node host for the backend — steps below use Railway, and a Render blueprint (`render.yaml`) is also included in the repo |

## Project structure

```
post-thyroidectomy-check-app/
├── src/
│   ├── components/          # UI: result cards, flip-card mechanic, gauges,
│   │                         # medication/wellness bottom sheets, doctor
│   │                         # report button, lab scan button, etc.
│   ├── pages/
│   │   └── Home.jsx          # The app's single page — form, header, cards
│   ├── services/
│   │   └── notifications.js  # Capacitor push/local notification wiring
│   ├── utils/                 # Diagnosis logic, unit conversion, streaks,
│   │                          # results history, haptics, localStorage helpers
│   ├── data/
│   │   └── thyroidReference.js  # Clinical reference ranges (ATA/BTA/NHS/etc.)
│   ├── App.jsx
│   ├── main.jsx               # React entry point + service worker registration
│   └── index.css              # All app styling
├── server/                    # Standalone Express + SQLite backend
│   ├── index.js                # App entry point
│   ├── routes.js               # All HTTP endpoints
│   ├── db.js                   # SQLite schema + queries
│   ├── webpush.js              # VAPID setup + push sending
│   ├── cron.js                 # The 6 scheduled notification jobs
│   ├── export.js               # Doctor report PDF generation
│   ├── ocr.js                  # Lab photo text extraction
│   └── README.md               # Backend-specific setup/deploy notes
├── public/                    # PWA assets: manifest.json, sw.js, icons
├── scripts/
│   └── generate-icons.cjs     # Generates native app icons + splash screens
├── ios/                       # Native iOS project (generated by Capacitor —
│                               # don't hand-edit; re-run `npx cap sync` instead)
├── android/                   # Native Android project (same note as above)
├── capacitor.config.ts        # Capacitor native app configuration
├── render.yaml                # Render deployment blueprint for the backend
├── vite.config.js
└── package.json
```

## Getting started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Xcode 15+ (for iOS builds — Mac only)
- Android Studio (for Android builds)
- Apple ID (free — for device testing)
- Apple Developer account ($99/yr — only needed for App Store submission)

### Clone and install

```bash
git clone https://github.com/FemzhMorak/post-thyroidectomy-check-app.git
cd post-thyroidectomy-check-app
npm install
cd server && npm install && cd ..
```

## Running locally

Start the frontend (`localhost:5173`):

```bash
npm run dev
```

Start the backend (`localhost:3001`), in a separate terminal:

```bash
cd server && node index.js
```

There's no `npm run dev:all` script set up yet — that would need the
`concurrently` package added as a dependency first. Until then, run the
two commands above in separate terminals.

## Environment variables

Create a `.env` file in the `server` folder:

```
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
CORS_ORIGIN=http://localhost:5173
DB_PATH=./thyrotrack.db
PORT=3001
```

Generate VAPID keys by running:

```bash
npx web-push generate-vapid-keys
```

Create a `.env` file in the **root** folder:

```
VITE_API_URL=http://localhost:3001
```

## Building for mobile

### iOS

**Step 1 — Build the web app:**
```bash
npm run build
```

**Step 2 — Sync with Capacitor:**
```bash
npx cap sync
```

**Step 3 — Open in Xcode:**
```bash
npm run cap:ios
```

**Step 4 — In Xcode:**
- Select your iPhone from the device dropdown
- Click the Play button (▶)
- The app installs and launches on your phone

**First time on a new iPhone:**
- Your iPhone will show "Developer Mode disabled"
- Go to **Settings → Privacy & Security → Developer Mode → turn ON →
  restart phone**
- Then go to **Settings → General → VPN & Device Management → tap your
  Apple ID → tap Trust**
- Run again in Xcode

### Android

**Step 1 — Build the web app:**
```bash
npm run build
```

**Step 2 — Sync with Capacitor:**
```bash
npx cap sync
```

**Step 3 — Open in Android Studio:**
```bash
npm run cap:android
```

**Step 4 — In Android Studio:**
- Select your device from the dropdown
- Click the Run button
- The app installs on your phone

### Live reload during development

Update `capacitor.config.ts`:

```ts
server: {
  url: 'http://YOUR_LOCAL_IP:5173',
  cleartext: true
}
```

Then run `npm run dev`. Changes reflect on your phone instantly on save.
Find your local IP with:

```bash
ipconfig getifaddr en0
```

Remove the `url`/`cleartext` lines again before shipping a real build —
they point at your dev machine, not a real deployment.

## Deploying to production

### Frontend (Vercel)

- Push to GitHub — Vercel auto-deploys
- Set `VITE_API_URL` in Vercel's environment variables to your backend's
  deployed URL

### Backend (Railway)

- Go to [railway.app](https://railway.app)
- **New Project → Deploy from GitHub repo**
- Select the `server` folder as the root
- Add environment variables:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `CORS_ORIGIN` (your Vercel URL)
  - `DB_PATH=/data/thyrotrack.db`
- Add a persistent volume at `/data` so the SQLite database survives
  redeploys
- Railway gives you a URL like `https://thyrotrack-server.up.railway.app`
- Set that as `VITE_API_URL` in Vercel

_(If you'd rather use Render instead of Railway, the repo already includes
a ready-to-use blueprint at `render.yaml` — see `server/README.md` for
those steps.)_

## Notifications

The app sends 6 types of notifications:

1. **Morning medication reminder**
   Time: 7:00 AM daily (configurable)
   "Time to take your levothyroxine"
   Tap → opens the medication log sheet

2. **Missed dose check**
   Time: 10:00 AM daily — only fires if no dose has been logged today
   "Did you take your levothyroxine today?"
   Tap → opens the medication log sheet

3. **Evening missed dose warning**
   Time: 8:00 PM daily — only fires if no dose has been logged today
   "You haven't logged your dose today"
   Tap → opens the medication log sheet

4. **Weekly wellness check-in**
   Time: Sunday 6:00 PM
   "How have you been feeling this week?"
   Tap → opens the wellness check sheet

5. **Retest reminder**
   Time: calculated from your last lab result date + the recommended
   retest interval for your diagnosis
   "Your thyroid retest is due today"
   Tap → opens the results entry form

6. **Streak milestone**
   Fires the day before you hit a 7, 14, 30, 60, or 90-day streak
   "X day streak tomorrow — keep going"

On the web/PWA, these are sent from the backend via `web-push`. In the
native iOS/Android app, the same 6 reminders are scheduled directly on
the device with `@capacitor/local-notifications` — they fire even when
the app is closed, as long as it's been opened at least once and
notification permission was granted.

## How to update the app after making changes

### Web version (automatic)

```bash
git add .
git commit -m "describe your change"
git push
```

Vercel redeploys automatically in about 30 seconds.

### iPhone/iPad

```bash
npm run build
npx cap sync
npm run cap:ios
```

Then click Play in Xcode with your phone plugged in.

### Android

```bash
npm run build
npx cap sync
npm run cap:android
```

Then click Run in Android Studio with your phone plugged in.

**Tip:** use live reload (above) during active development so you don't
have to rebuild for every small change.

## Medical disclaimer

ThyroTrack is an informational tool only and does not constitute medical
advice, diagnosis, or treatment. All dosage changes must be discussed
with and approved by a qualified physician or endocrinologist. Never
adjust your levothyroxine dose without medical supervision. Reference
ranges are sourced from ATA, BTA, NHS, ARUP, Quest Diagnostics, and
LabCorp guidelines and may vary by lab.

## Author

Built by Morakinyo Olorunfemi
GitHub: [github.com/FemzhMorak](https://github.com/FemzhMorak)

## License

MIT License — free to use and modify. Attribution appreciated but not
required.
