const express = require('express');
const multer = require('multer');
const { sendToAll } = require('./webpush.js');
const {
  addSubscription,
  addDoseLog,
  getDoseLogs,
  addWellnessLog,
  getWellnessLogs,
  addLabResult,
  getLabResults,
} = require('./db.js');
const { generateDoctorReportPdf } = require('./export.js');
const { scanLabReport } = require('./ocr.js');

const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } });
const router = express.Router();

// --- push notifications ---
router.post('/notifications/subscribe', (req, res) => {
  const { subscription } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'subscription is required' });
  }
  addSubscription(subscription);
  res.json({ success: true });
});

router.post('/notifications/send', async (req, res) => {
  const { title, body, url, actions } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });
  const sent = await sendToAll({ title, body, url, actions });
  res.json({ sent });
});

router.get('/notifications/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// --- dose logs (mirrors the client's localStorage copy, so cron jobs and
// the doctor-report PDF can see it too) ---
router.post('/dose-logs', (req, res) => {
  const { date, time, taken, missedReason } = req.body || {};
  if (!date || typeof taken !== 'boolean') {
    return res.status(400).json({ error: 'date and taken (boolean) are required' });
  }
  addDoseLog({ date, time, taken, missedReason });
  res.json({ success: true });
});

router.get('/dose-logs', (req, res) => {
  res.json({ logs: getDoseLogs() });
});

// --- wellness logs ---
router.post('/wellness-logs', (req, res) => {
  const { date, time, feeling } = req.body || {};
  if (!date || !feeling) return res.status(400).json({ error: 'date and feeling are required' });
  addWellnessLog({ date, time, feeling });
  res.json({ success: true });
});

router.get('/wellness-logs', (req, res) => {
  res.json({ logs: getWellnessLogs() });
});

// --- lab results ---
router.post('/lab-results', (req, res) => {
  const { date, tsh, ft3, ft4, dose, dx, status, retestDate } = req.body || {};
  if (!date) return res.status(400).json({ error: 'date is required' });
  addLabResult({ date, tsh, ft3, ft4, dose, dx, status, retestDate });
  res.json({ success: true });
});

router.get('/lab-results', (req, res) => {
  res.json({ results: getLabResults() });
});

// --- doctor report PDF ---
router.get('/export/doctor-report', (req, res) => {
  const { name, patientId, status, dose } = req.query;
  generateDoctorReportPdf({ name, patientId, status, dose }, res);
});

// --- lab photo OCR scan ---
router.post('/scan-lab-report', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  try {
    const result = await scanLabReport(req.file.buffer);
    res.json(result);
  } catch (err) {
    console.error('[ocr] scan failed:', err);
    res.status(500).json({ error: 'OCR scan failed' });
  }
});

module.exports = router;
