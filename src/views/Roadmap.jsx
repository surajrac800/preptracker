import { useState } from 'react';
import { COLORS } from '../data.js';
import { uid } from '../lib.js';
import { TrackDot } from '../ui.jsx';

const ORDER = ['todo', 'learning', 'done'];
const LABEL = { todo: 'Not started', learning: 'Learning', done: 'Done' };

function AddTopic({ onAdd }) {
  const [text, setText] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    onAdd(title);
    setText('');
  };
  return (
    <form className="inline-form" onSubmit={submit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a topic"
        aria-label="New topic"
      />
      <button type="submit" className="btn btn-ghost" disabled={!text.trim()}>
        Add topic
      </button>
    </form>
  );
}

function AddTrack({ onAdd }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[6]);
  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, color);
    setName('');
  };
  return (
    <form className="panel new-track" onSubmit={submit}>
      <h2>Add a track</h2>
      <div className="inline-form">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="For example: TypeScript"
          aria-label="Track name"
        />
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          Add track
        </button>
      </div>
      <div className="swatches" role="radiogroup" aria-label="Track colour">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={`Colour ${c}`}
            className={'swatch' + (color === c ? ' is-picked' : '')}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
    </form>
  );
}

export default function Roadmap({ state, update }) {
  const { tracks, topics } = state;

  const cycle = (id) =>
    update((s) => ({
      ...s,
      topics: s.topics.map((t) =>
        t.id === id ? { ...t, status: ORDER[(ORDER.indexOf(t.status) + 1) % ORDER.length] } : t,
      ),
    }));

  const addTopic = (trackId, title) =>
    update((s) => ({ ...s, topics: [...s.topics, { id: uid(), trackId, title, status: 'todo' }] }));

  const removeTopic = (id) => update((s) => ({ ...s, topics: s.topics.filter((t) => t.id !== id) }));

  const addTrack = (name, color) =>
    update((s) => ({ ...s, tracks: [...s.tracks, { id: uid(), name, color }] }));

  const removeTrack = (track) => {
    const count = topics.filter((t) => t.trackId === track.id).length;
    const ok = window.confirm(
      `Remove "${track.name}" and its ${count} topics? Tasks and study sessions stay, but lose their track.`,
    );
    if (!ok) return;
    update((s) => ({
      ...s,
      tracks: s.tracks.filter((t) => t.id !== track.id),
      topics: s.topics.filter((t) => t.trackId !== track.id),
    }));
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Roadmap</h1>
        <p className="page-note">Click the circle next to a topic to move it from not started to learning to done.</p>
      </header>

      <div className="stack">
        {tracks.map((track) => {
          const own = topics.filter((t) => t.trackId === track.id);
          const done = own.filter((t) => t.status === 'done').length;
          const learning = own.filter((t) => t.status === 'learning').length;
          return (
            <details key={track.id} className="panel track" open>
              <summary className="track-head">
                <span className="track-title">
                  <TrackDot color={track.color} />
                  <h2>{track.name}</h2>
                </span>
                <span className="track-bar wide" aria-hidden="true">
                  <i style={{ width: `${own.length ? (done / own.length) * 100 : 0}%`, background: track.color }} />
                  <i
                    className="learning"
                    style={{ width: `${own.length ? (learning / own.length) * 100 : 0}%`, background: track.color }}
                  />
                </span>
                <span className="track-count">
                  {done} of {own.length} done
                </span>
              </summary>

              <ul className="topics">
                {own.map((topic) => (
                  <li key={topic.id} className="topic" data-status={topic.status}>
                    <button
                      type="button"
                      className="status-btn"
                      data-status={topic.status}
                      aria-label={`${topic.title}: ${LABEL[topic.status]}. Click to change.`}
                      title={LABEL[topic.status]}
                      onClick={() => cycle(topic.id)}
                      style={{ '--track': track.color }}
                    />
                    <span className="topic-title">{topic.title}</span>
                    <span className="topic-state">{LABEL[topic.status]}</span>
                    <button
                      type="button"
                      className="icon-btn subtle"
                      aria-label={`Remove ${topic.title}`}
                      onClick={() => removeTopic(topic.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              {own.length === 0 && <p className="hint">No topics yet. Add the first one below.</p>}

              <div className="track-foot">
                <AddTopic onAdd={(title) => addTopic(track.id, title)} />
                <button type="button" className="link danger" onClick={() => removeTrack(track)}>
                  Remove track
                </button>
              </div>
            </details>
          );
        })}
        <AddTrack onAdd={addTrack} />
      </div>
    </div>
  );
}
