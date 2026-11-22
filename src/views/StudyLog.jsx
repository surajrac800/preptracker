import { useEffect, useMemo, useState } from 'react';
import { addDays, computeStreak, fmtLongDate, fmtMinutes, toKey, todayKey, trackOf, uid, weekStart } from '../lib.js';
import { TrackDot } from '../ui.jsx';

const TIMER_KEY = 'stack-prep-timer';

function readTimer() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeTimer(value) {
  try {
    if (value) localStorage.setItem(TIMER_KEY, JSON.stringify(value));
    else localStorage.removeItem(TIMER_KEY);
  } catch {
    /* ignore */
  }
}
const clock = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
};

function Timer({ tracks, onSave }) {
  const [timer, setTimer] = useState(readTimer);
  const [trackId, setTrackId] = useState(tracks[0]?.id || '');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!timer) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const elapsed = timer ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0;
  const running = trackOf(tracks, timer?.trackId);

  const start = () => {
    const t = { trackId, startedAt: Date.now() };
    writeTimer(t);
    setNow(Date.now());
    setTimer(t);
  };
  const stop = () => {
    onSave(timer.trackId, Math.max(1, Math.round(elapsed / 60)), 'Focus timer');
    writeTimer(null);
    setTimer(null);
  };
  const cancel = () => {
    writeTimer(null);
    setTimer(null);
  };

  return (
    <section className="panel timer" aria-label="Focus timer">
      <h2>Focus timer</h2>
      {timer ? (
        <>
          <p className="timer-clock" role="timer" aria-live="off">
            {clock(elapsed)}
          </p>
          <p className="hint">
            <TrackDot color={running.color} /> Studying {running.name}
          </p>
          <div className="form-actions left">
            <button type="button" className="btn btn-primary" onClick={stop}>
              Stop and save
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancel}>
              Discard
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="hint">Start the timer when you sit down to study. It saves the time to your log when you stop.</p>
          <div className="inline-form">
            <select value={trackId} onChange={(e) => setTrackId(e.target.value)} aria-label="Track to study">
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={start} disabled={!tracks.length}>
              Start timer
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default function StudyLog({ state, update }) {
  const { tracks, logs } = state;
  const [date, setDate] = useState(todayKey());
  const [minutes, setMinutes] = useState(60);
  const [trackId, setTrackId] = useState(tracks[0]?.id || '');
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState(30);

  const addLog = (track, mins, text, day = todayKey()) =>
    update((s) => ({
      ...s,
      logs: [...s.logs, { id: uid(), date: day, minutes: mins, trackId: track, note: text || '', createdAt: Date.now() }],
    }));

  const submit = (e) => {
    e.preventDefault();
    const mins = Math.round(Number(minutes));
    if (!mins || mins < 1 || !date) return;
    addLog(trackId, mins, note.trim(), date);
    setNote('');
  };

  const remove = (id) => update((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) }));

  const stats = useMemo(() => {
    const today = todayKey();
    const start = toKey(weekStart());
    const end = toKey(addDays(weekStart(), 6));
    let t = 0;
    let w = 0;
    let all = 0;
    for (const l of logs) {
      all += l.minutes;
      if (l.date === today) t += l.minutes;
      if (l.date >= start && l.date <= end) w += l.minutes;
    }
    return { today: t, week: w, all };
  }, [logs]);

  const sorted = useMemo(
    () => [...logs].sort((a, b) => (a.date === b.date ? (b.createdAt || 0) - (a.createdAt || 0) : a.date < b.date ? 1 : -1)),
    [logs],
  );
  const shown = sorted.slice(0, limit);
  const groups = [];
  for (const l of shown) {
    const last = groups[groups.length - 1];
    if (last && last.date === l.date) last.items.push(l);
    else groups.push({ date: l.date, items: [l] });
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Study log</h1>
      </header>

      <div className="stats">
        <div className="stat boxed">
          <span className="stat-num">{fmtMinutes(stats.today)}</span>
          <span className="stat-label">today</span>
        </div>
        <div className="stat boxed">
          <span className="stat-num">{fmtMinutes(stats.week)}</span>
          <span className="stat-label">this week</span>
        </div>
        <div className="stat boxed">
          <span className="stat-num">{fmtMinutes(stats.all)}</span>
          <span className="stat-label">all time</span>
        </div>
        <div className="stat boxed">
          <span className="stat-num">{computeStreak(logs)}</span>
          <span className="stat-label">day streak</span>
        </div>
      </div>

      <div className="two-col">
        <Timer tracks={tracks} onSave={addLog} />

        <form className="panel form" onSubmit={submit}>
          <h2>Add a session</h2>
          <div className="field-row">
            <label className="field">
              <span>Date</span>
              <input type="date" required max={todayKey()} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Minutes</span>
              <input
                type="number"
                min="1"
                max="1440"
                step="5"
                required
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>Track</span>
            <select value={trackId} onChange={(e) => setTrackId(e.target.value)}>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>What did you cover?</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: useEffect cleanup" />
          </label>
          <div className="form-actions left">
            <button type="submit" className="btn btn-primary" disabled={!tracks.length}>
              Add session
            </button>
          </div>
        </form>
      </div>

      <section className="panel" aria-label="Sessions">
        <h2>Sessions</h2>
        {groups.length === 0 && <p className="hint">No sessions yet. Use the timer or add one above.</p>}
        {groups.map((g) => (
          <div key={g.date} className="log-group">
            <div className="log-date">
              <h3>{fmtLongDate(g.date)}</h3>
              <span>{fmtMinutes(g.items.reduce((a, l) => a + l.minutes, 0))}</span>
            </div>
            <ul className="plain">
              {g.items.map((l) => {
                const t = trackOf(tracks, l.trackId);
                return (
                  <li key={l.id} className="log-row">
                    <span className="log-track">
                      <TrackDot color={t.color} />
                      {t.name}
                    </span>
                    <span className="log-note">{l.note}</span>
                    <span className="log-min">{fmtMinutes(l.minutes)}</span>
                    <button
                      type="button"
                      className="icon-btn subtle"
                      aria-label={`Delete ${fmtMinutes(l.minutes)} ${t.name} session`}
                      onClick={() => remove(l.id)}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {sorted.length > limit && (
          <button type="button" className="btn btn-ghost" onClick={() => setLimit((n) => n + 30)}>
            Show older sessions
          </button>
        )}
      </section>
    </div>
  );
}
