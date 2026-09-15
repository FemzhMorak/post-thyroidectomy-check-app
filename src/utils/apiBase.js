// Resolves API calls against a configurable backend origin.
//
// Local dev: leave VITE_API_URL unset — Vite's dev-server proxy
// (vite.config.js) forwards relative /api/* calls to localhost:3001.
//
// Production: the built frontend is a static bundle with nothing to proxy
// through, so set VITE_API_URL to wherever server/ is actually deployed
// (e.g. https://thyrotrack-api.onrender.com) at build time, and every call
// below points there instead.
const API_BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
