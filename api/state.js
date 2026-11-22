// Vercel serverless function (Node.js): optional cloud sync for the tracker.
// Needs an Upstash Redis database (Vercel Storage / Marketplace) and APP_PASSWORD.
// Without them the app still works fully using browser storage.
import { timingSafeEqual } from 'node:crypto';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const PASSWORD = process.env.APP_PASSWORD;
const KEY = 'stack-prep-tracker:state';
const MAX_BYTES = 900000;

function samePassword(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

async function redis(command) {
  const response = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`Redis responded ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(200).json({ configured: false, reason: 'No Redis database is connected to this project.' });
  }
  if (!PASSWORD) {
    return res.status(200).json({ configured: false, reason: 'Set the APP_PASSWORD environment variable to turn sync on.' });
  }
  if (!samePassword(req.headers['x-app-password'], PASSWORD)) {
    return res.status(401).json({ configured: true, error: 'Wrong password.' });
  }

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', KEY]);
      return res.status(200).json({ configured: true, state: raw ? JSON.parse(raw) : null });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = null; }
      }
      const state = body && body.state;
      if (!state || typeof state !== 'object' || state.version !== 1) {
        return res.status(400).json({ error: 'Invalid data.' });
      }
      const raw = JSON.stringify(state);
      if (raw.length > MAX_BYTES) {
        return res.status(413).json({ error: 'Data is too large to sync.' });
      }
      await redis(['SET', KEY, raw]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('state api error:', error.message);
    return res.status(500).json({ error: 'Sync storage failed.' });
  }
}
