import { useMemo } from 'react';
import {
  addDays,
  compareTasks,
  computeStreak,
  fmtDate,
  fmtMinutes,
  parseKey,
  relDue,
  toKey,
  todayKey,
  trackOf,
  weekStart,
} from '../lib.js';
import { TrackDot } from '../ui.jsx';

export default function Overview({ state, update, go }) {
  const { tracks, topics, tasks, logs, settings } = state;
  const today = todayKey();

  const week = useMemo(() => {
    const start = weekStart();
    const days = Array.from({ length: 7 }, (_, i) => {
      const key = toKey(addDays(start, i));
      const byTrack = {};
      let total = 0;
      for (const l of logs) {
        if (l.date === key) {
          byTrack[l.trackId] = (byTrack[l.trackId] || 0) + l.minutes;
          total += l.minutes;
        }
      }
      return { key, total, byTrack };
    });
    return { days, start: days[0].key, total: days.reduce((a, d) => a + d.total, 0) };
  }, [logs]);

  const goalMin = Math.max(1, (settings?.weeklyGoalHours || 0) * 60);
  const pct = Math.min(100, Math.round((week.total / goalMin) * 100));
  const left = goalMin - week.total;
  const scaleMax = Math.max(120, Math.ceil(Math.max(...week.days.map((d) => d.total)) / 60) * 60);
  const streak = computeStreak(logs);
  const upNext = tasks.filter((t) => t.status !== 'done').sort(compareTasks).slice(0, 5);
  const openCount = tasks.filter((t) => t.status !== 'done').length;
  const usedTrackIds = [...new Set(week.days.flatMap((d) => Object.keys(d.byTrack)))];

  const markDone = (id) =>
    update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'done' } : t)) }));

  return (
    <div className="page">
      <section className="hero" aria-label="This week">
        <div>
          <p className="hero-kicker">Week of {fmtDate(week.start)}</p>
          <h1 className="hero-time">{fmtMinutes(week.total)}</h1>
          <p className="hero-sub">
            studied so far. {left > 0 ? `${fmtMinutes(left)} left to reach your ${settings.weeklyGoalHours}h goal.` : 'Weekly goal reached.'}
          </p>
          <div
            className="goal"
            role="progressbar"
            aria-label="Weekly goal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div className="goal-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="hero-side">
          <div className="stat">
            <span className="stat-num">{streak}</span>
            <span className="stat-label">day streak</span>
          </div>
          <div className="stat">
            <span className="stat-num">{openCount}</span>
            <span className="stat-label">open tasks</span>
          </div>
        </div>
      </section>

      <section className="panel" aria-label="Study time by day">
        <div className="week" role="list">
          {week.days.map((d) => {
            const date = parseKey(d.key);
            return (
              <div
                key={d.key}
                role="listitem"
                className={'day' + (d.key === today ? ' is-today' : '')}
                aria-label={`${date.toLocaleDateString('en-IN', { weekday: 'long' })}: ${fmtMinutes(d.total)}`}
              >
                <div className="day-total">{d.total ? fmtMinutes(d.total) : ''}</div>
                <div className="day-bar" style={{ '--scale': scaleMax }}>
                  <div className="day-stack" style={{ height: `${(d.total / scaleMax) * 100}%` }}>
                    {Object.entries(d.byTrack).map(([id, m]) => {
                      const t = trackOf(tracks, id);
                      return (
                        <span
                          key={id}
                          className="seg"
                          title={`${t.name}: ${fmtMinutes(m)}`}
                          style={{ flex: `${m} 0 0`, background: t.color }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="day-label">
                  <span>{date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  <span className="day-date">{date.getDate()}</span>
                </div>
              </div>
            );
          })}
        </div>
        {usedTrackIds.length > 0 ? (
          <ul className="legend">
            {usedTrackIds.map((id) => {
              const t = trackOf(tracks, id);
              return (
                <li key={id}>
                  <TrackDot color={t.color} />
                  {t.name}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="hint">
            Nothing logged this week yet.{' '}
            <button type="button" className="link" onClick={() => go('log')}>
              Log your first session
            </button>
          </p>
        )}
      </section>

      <div className="two-col">
        <section className="panel" aria-label="Progress by track">
          <div className="panel-head">
            <h2>Progress by track</h2>
            <button type="button" className="link" onClick={() => go('roadmap')}>
              Open roadmap
            </button>
          </div>
          {tracks.length === 0 && <p className="hint">No tracks yet. Add one in the roadmap.</p>}
          <ul className="plain">
            {tracks.map((t) => {
              const own = topics.filter((x) => x.trackId === t.id);
              const done = own.filter((x) => x.status === 'done').length;
              const learning = own.filter((x) => x.status === 'learning').length;
              const total = own.length;
              return (
                <li key={t.id}>
                  <button type="button" className="track-row" onClick={() => go('roadmap')}>
                    <span className="track-name">
                      <TrackDot color={t.color} />
                      {t.name}
                    </span>
                    <span className="track-bar" aria-hidden="true">
                      <i style={{ width: `${total ? (done / total) * 100 : 0}%`, background: t.color }} />
                      <i
                        className="learning"
                        style={{ width: `${total ? (learning / total) * 100 : 0}%`, background: t.color }}
                      />
                    </span>
                    <span className="track-count">
                      {done}/{total}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel" aria-label="Up next">
          <div className="panel-head">
            <h2>Up next</h2>
            <button type="button" className="link" onClick={() => go('board')}>
              Open board
            </button>
          </div>
          {upNext.length === 0 && <p className="hint">All caught up. Add a task on the board.</p>}
          <ul className="plain">
            {upNext.map((t) => {
              const track = trackOf(tracks, t.trackId);
              const due = t.due ? relDue(t.due) : null;
              return (
                <li key={t.id} className="next-row">
                  <button
                    type="button"
                    className="check"
                    aria-label={`Mark "${t.title}" as done`}
                    onClick={() => markDone(t.id)}
                  />
                  <div className="next-main">
                    <span className="next-title">{t.title}</span>
                    <span className="next-meta">
                      <TrackDot color={track.color} />
                      {track.name}
                      {due && <span className={'due due-' + due.tone}>{due.label}</span>}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
