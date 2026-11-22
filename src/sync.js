import { seedState } from './data.js';

const STATE_KEY = 'stack-prep-state-v1';
const PASSWORD_KEY = 'stack-prep-sync-password';

function isValid(s) {
  return (
    s &&
    s.version === 1 &&
    Array.isArray(s.tracks) &&
    Array.isArray(s.topics) &&
    Array.isArray(s.tasks) &&
    Array.isArray(s.logs)
  );
}
export { isValid };

export function loadLocal() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValid(parsed)) return { settings: { weeklyGoalHours: 10 }, ...parsed };
    }
  } catch {
    /* ignore and fall back to starter data */
  }
  return seedState();
}

export function saveLocal(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* storage may be full or blocked */
  }
}

export function getPassword() {
  try {
    return localStorage.getItem(PASSWORD_KEY) || '';
  } catch {
    return '';
  }
}

export function setPassword(value) {
  try {
    localStorage.setItem(PASSWORD_KEY, value);
  } catch {
    /* ignore */
  }
}

// status: 'ok' | 'off' | 'locked' | 'error'
export async function pullRemote(password) {
  try {
    const res = await fetch('/api/state', {
      headers: { 'x-app-password': password || '' },
      cache: 'no-store',
    });
    if (res.status === 401) return { status: 'locked' };
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.includes('json')) return { status: 'off', reason: 'Sync API is not available here.' };
    const data = await res.json();
    if (!data.configured) return { status: 'off', reason: data.reason };
    return { status: 'ok', state: data.state };
  } catch {
    return { status: 'error', reason: 'You seem to be offline.' };
  }
}

export async function pushRemote(password, state) {
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-password': password || '' },
      body: JSON.stringify({ state }),
    });
    if (res.ok) return { status: 'ok' };
    return { status: res.status === 401 ? 'locked' : 'error' };
  } catch {
    return { status: 'error' };
  }
}
