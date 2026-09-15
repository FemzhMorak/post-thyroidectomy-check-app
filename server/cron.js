const cron = require('node-cron');
const { sendToAll } = require('./webpush.js');
const { isDoseLoggedOn, getCurrentStreak, getLatestLabResult } = require('./db.js');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function startCronJobs() {
  // 1. Morning medication reminder — every day at 7:00 AM.
  cron.schedule('0 7 * * *', () => {
    sendToAll({
      title: 'ThyroTrack \u{1F48A}',
      body: 'Time to take your levothyroxine. Empty stomach, 30–60 min before food.',
      url: '/?action=log-dose',
      actions: [
        { action: 'taken', title: '✓ Taken' },
        { action: 'snooze', title: 'Remind in 30min' },
      ],
    });
  });

  // 2. Missed dose check — 10:00 AM, only if nothing logged yet today.
  cron.schedule('0 10 * * *', () => {
    if (!isDoseLoggedOn(today())) {
      sendToAll({
        title: 'ThyroTrack ⚠️',
        body: 'Did you take your levothyroxine today? Consistency matters for stable TSH.',
        url: '/?action=log-dose',
      });
    }
  });

  // 3. Evening missed dose warning — 8:00 PM, only if still not logged.
  cron.schedule('0 20 * * *', () => {
    if (!isDoseLoggedOn(today())) {
      sendToAll({
        title: 'ThyroTrack \u{1F6A8}',
        body: "You haven't logged your dose today. If you forgot, take it now unless it's close to bedtime.",
        url: '/?action=log-dose',
      });
    }
  });

  // 4. Weekly wellness check — every Sunday at 6:00 PM.
  cron.schedule('0 18 * * 0', () => {
    sendToAll({
      title: 'ThyroTrack \u{1FAC0}',
      body: 'Weekly check-in — how have you been feeling? Takes 5 seconds.',
      url: '/?action=wellness-checkin',
    });
  });

  // 5. Retest reminder — checked daily at 9:00 AM against the last lab
  // result's stored retest-due date.
  cron.schedule('0 9 * * *', () => {
    const last = getLatestLabResult();
    if (last?.retest_date && today() >= last.retest_date) {
      sendToAll({
        title: 'ThyroTrack \u{1F52C}',
        body: 'Your thyroid retest is due today. Time to check TSH, Free T3, and Free T4.',
        url: '/?action=log-results',
      });
    }
  });

  // 6. Streak encouragement — 7:30 PM, only on milestone streaks logged today.
  cron.schedule('30 19 * * *', () => {
    if (!isDoseLoggedOn(today())) return;
    const streak = getCurrentStreak(today());
    const milestones = [7, 14, 30, 60, 90];
    if (milestones.includes(streak)) {
      sendToAll({
        title: 'ThyroTrack \u{1F525}',
        body: `${streak} day streak! Consistent medication timing is the single biggest factor in stable TSH. Keep going.`,
        url: '/',
      });
    }
  });

  console.log('[cron] 6 scheduled notification jobs registered');
}

module.exports = { startCronJobs };
