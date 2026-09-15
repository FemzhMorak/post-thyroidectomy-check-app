// Local-only user profile, created once during first-launch onboarding.
const KEY = 'thyrotrack_profile';

export function getProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Storage unavailable — onboarding still completes for this session.
  }
}

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function randomIdSuffix(length = 6) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return out;
}

export function slugifyName(name) {
  return (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'user';
}
