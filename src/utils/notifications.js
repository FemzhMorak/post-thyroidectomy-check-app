// setTimeout-based local notification scheduling via the Web Notifications
// API. This app has no backend or service worker, so these only fire while
// this browser tab is open — a deliberate, documented limitation rather
// than an attempt at background push notifications.
import { isLoggedToday } from './doseLogs.js';
import { getLastResult } from './history.js';

export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported');
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Promise.resolve(Notification.permission);
  }
  return Notification.requestPermission();
}

function notify(title, body, onClickHandler) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const n = new Notification(title, { body });
  if (onClickHandler) {
    n.onclick = () => {
      window.focus();
      onClickHandler();
      n.close();
    };
  }
}

function msUntilDaily(hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

function msUntilWeekly(dayOfWeek, hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  target.setDate(now.getDate() + ((dayOfWeek - now.getDay() + 7) % 7));
  if (target <= now) target.setDate(target.getDate() + 7);
  return target - now;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// Schedules the four reminder types and returns a cleanup function that
// cancels every pending timer.
export function scheduleAllNotifications({ onOpenMedication, onOpenWellness, onOpenAnalyze }) {
  const timers = [];

  function loopDaily(hour, minute, fn) {
    const run = () => {
      fn();
      timers.push(setTimeout(run, DAY_MS));
    };
    timers.push(setTimeout(run, msUntilDaily(hour, minute)));
  }

  function loopWeekly(dayOfWeek, hour, minute, fn) {
    const run = () => {
      fn();
      timers.push(setTimeout(run, WEEK_MS));
    };
    timers.push(setTimeout(run, msUntilWeekly(dayOfWeek, hour, minute)));
  }

  // 1. Morning medication reminder — 7:00 AM daily.
  loopDaily(7, 0, () => {
    notify('ThyroTrack 💊', 'Time to take your levothyroxine. Take on empty stomach, 30-60 min before food.', onOpenMedication);
  });

  // 2. Missed dose check — 10:00 AM, only if nothing logged yet today.
  loopDaily(10, 0, () => {
    if (!isLoggedToday()) {
      notify('ThyroTrack ⚠️', 'Did you take your levothyroxine today?', onOpenMedication);
    }
  });

  // 3. Weekly wellness check — every Sunday at 6:00 PM.
  loopWeekly(0, 18, 0, () => {
    notify('ThyroTrack 🫀', 'How are you feeling this week? Quick check-in takes 10 seconds.', onOpenWellness);
  });

  // 4. Retest reminder — checked once a day; fires once the stored
  // retest-due date (from the last saved result) has arrived.
  loopDaily(9, 0, () => {
    const last = getLastResult();
    if (last?.retestDate && new Date().toISOString().slice(0, 10) >= last.retestDate) {
      notify('ThyroTrack 🔬', 'Your thyroid retest is due. Time to check TSH, Free T3, Free T4.', onOpenAnalyze);
    }
  });

  return () => timers.forEach(clearTimeout);
}
