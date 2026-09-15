import { useState } from 'react';
import { saveProfile, randomIdSuffix, slugifyName } from '../utils/profile.js';
import { requestNotificationPermission } from '../utils/notifications.js';

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState('');
  const [suffix] = useState(() => randomIdSuffix());
  const [closing, setClosing] = useState(false);
  const [notifNote, setNotifNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const id = `${slugifyName(name)}-${suffix}`;

  async function handleSubmit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);

    const profile = { name: name.trim(), id, createdAt: new Date().toISOString() };
    saveProfile(profile);

    let denied = false;
    try {
      const permission = await requestNotificationPermission();
      denied = permission !== 'granted';
    } catch {
      denied = true;
    }

    if (denied) {
      setNotifNote(true);
      setTimeout(() => {
        setClosing(true);
        setTimeout(() => onComplete(profile), 300);
      }, 2200);
    } else {
      setClosing(true);
      setTimeout(() => onComplete(profile), 300);
    }
  }

  return (
    <div className={`onboarding-overlay${closing ? ' closing' : ''}`}>
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <div className="logo-icon">{'\u{1FAC0}'}</div>
          <div className="logo-text">Thyro<span>Track</span></div>
        </div>
        <div className="onboarding-heading">Welcome to ThyroTrack</div>
        <div className="onboarding-sub">{"Let's set up your profile. This takes 30 seconds."}</div>

        <div className="field onboarding-field">
          <label>What should we call you?</label>
          <div className="field-inner">
            <input
              type="text"
              placeholder="First name or nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
        </div>
        <div className="onboarding-id">{`Your ID: ${id}`}</div>

        <button className="btn-analyze onboarding-submit" onClick={handleSubmit} disabled={!name.trim() || submitting}>
          {'Get started →'}
        </button>

        {notifNote && (
          <div className="onboarding-notif-note">Enable notifications in browser settings to get medication reminders</div>
        )}
      </div>
    </div>
  );
}
