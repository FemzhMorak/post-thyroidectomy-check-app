const webpush = require('web-push');
const { getAllSubscriptions, deleteSubscription } = require('./db.js');

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT_EMAIL } = process.env;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn(
    '[webpush] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set — push sending will fail. ' +
    'Run `npx web-push generate-vapid-keys` and put them in server/.env (see .env.example).'
  );
} else {
  webpush.setVapidDetails(
    `mailto:${VAPID_CONTACT_EMAIL || 'morakinyofemii@gmail.com'}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// Sends payload to every stored subscription, pruning any that have expired
// or been revoked (HTTP 410 Gone) from the DB as we go.
async function sendToAll(payload) {
  const subscriptions = getAllSubscriptions();
  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(JSON.parse(sub.subscription), body);
        sent += 1;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          deleteSubscription(sub.id);
        } else {
          console.error('[webpush] send failed:', err.statusCode, err.body || err.message);
        }
      }
    })
  );

  return sent;
}

module.exports = { webpush, sendToAll };
