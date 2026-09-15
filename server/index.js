require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes.js');
const { startCronJobs } = require('./cron.js');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`[server] ThyroTrack backend listening on http://localhost:${PORT}`);
  startCronJobs();
});
