export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const pad = (n) => String(n).padStart(2, '0');

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x;
}

// Weeks start on Monday.
export function weekStart(date = new Date()) {
  const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function fmtMinutes(total) {
  const m = Math.round(total || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  if (!r) return `${h}h`;
  return `${h}h ${r}m`;
}

export function fmtDate(key) {
  return parseKey(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function fmtLongDate(key) {
  if (key === todayKey()) return 'Today';
  if (key === toKey(addDays(new Date(), -1))) return 'Yesterday';
  return parseKey(key).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function relDue(key) {
  const diff = Math.round((parseKey(key) - parseKey(todayKey())) / 86400000);
  if (diff < 0) return { label: `Overdue by ${-diff}d`, tone: 'late' };
  if (diff === 0) return { label: 'Due today', tone: 'soon' };
  if (diff === 1) return { label: 'Due tomorrow', tone: 'soon' };
  return { label: `Due ${fmtDate(key)}`, tone: 'ok' };
}

export const PRIORITIES = [
  { id: 'high', label: 'High' },
  { id: 'med', label: 'Medium' },
  { id: 'low', label: 'Low' },
];
const RANK = { high: 0, med: 1, low: 2 };

export function compareTasks(a, b) {
  if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
  if (a.due && !b.due) return -1;
  if (!a.due && b.due) return 1;
  return (RANK[a.priority] ?? 1) - (RANK[b.priority] ?? 1) || (a.createdAt || 0) - (b.createdAt || 0);
}

export function trackOf(tracks, id) {
  return tracks.find((t) => t.id === id) || { id: 'none', name: 'Other', color: '#8892A0' };
}

export function computeStreak(logs) {
  const days = new Set(logs.filter((l) => l.minutes > 0).map((l) => l.date));
  let d = new Date();
  if (!days.has(toKey(d))) d = addDays(d, -1);
  let n = 0;
  while (days.has(toKey(d))) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}
