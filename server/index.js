require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes.js');
const { startCronJobs } = require('./cron.js');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS_ORIGIN: comma-separated list of allowed frontend origins in
// production (e.g. "https://thyrotrack.vercel.app"). Left unset, every
// origin is allowed — fine for local dev, worth locking down once deployed.
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`[server] ThyroTrack backend listening on http://localhost:${PORT}`);
  startCronJobs();
});
