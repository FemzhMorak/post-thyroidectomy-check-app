import { apiUrl } from './apiBase.js';

// Converts a VAPID base64url public key into the Uint8Array shape the Push
// API's applicationServerKey actually requires.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const res = await fetch(apiUrl('/api/notifications/vapid-public-key'));
    const { publicKey } = await res.json();
    if (!publicKey) return { ok: false, reason: 'no-vapid-key' };

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await fetch(apiUrl('/api/notifications/subscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err?.message || 'error' };
  }
}
