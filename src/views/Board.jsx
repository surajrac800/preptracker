import { useState } from 'react';
import { PRIORITIES, compareTasks, relDue, trackOf, uid } from '../lib.js';
import { Modal, TrackDot } from '../ui.jsx';

const COLUMNS = [
  { id: 'todo', label: 'To do', empty: 'Nothing waiting. Add a task to plan your next session.' },
  { id: 'doing', label: 'In progress', empty: 'Drag a task here when you start it.' },
  { id: 'done', label: 'Done', empty: 'Finished tasks show up here.' },
];

function TaskForm({ task, tracks, defaultTrack, onSave, onDelete, onClose }) {
  const [f, setF] = useState(() =>
    task
      ? { ...task }
      : { title: '', trackId: defaultTrack || tracks[0]?.id || '', priority: 'med', status: 'todo', due: '', notes: '' },
  );
  const set = (key, value) => setF((p) => ({ ...p, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    onSave({ ...f, title: f.title.trim() });
  };

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Task</span>
          <input
            autoFocus
            required
            value={f.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="For example: Build login with JWT"
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Track</span>
            <select value={f.trackId} onChange={(e) => set('trackId', e.target.value)}>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              {!tracks.some((t) => t.id === f.trackId) && <option value={f.trackId}>Other</option>}
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select value={f.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Status</span>
            <select value={f.status} onChange={(e) => set('status', e.target.value)}>
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Due date</span>
            <input type="date" value={f.due || ''} onChange={(e) => set('due', e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea
            rows={3}
            value={f.notes || ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Links, ideas, what to revise"
          />
        </label>
        <div className="form-actions">
          {task && (
            <button type="button" className="btn btn-danger" onClick={onDelete}>
              Delete task
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {task ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Board({ state, update }) {
  const { tracks, tasks } = state;
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | 'new' | task
  const [over, setOver] = useState(null);

  const visible = tasks.filter((t) => filter === 'all' || t.trackId === filter);

  const move = (id, status) =>
    update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }));

  const save = (data) => {
    if (data.id) {
      update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === data.id ? { ...t, ...data } : t)) }));
    } else {
      update((s) => ({ ...s, tasks: [...s.tasks, { ...data, id: uid(), createdAt: Date.now() }] }));
    }
    setEditing(null);
  };

  const remove = (id) => {
    update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
    setEditing(null);
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Board</h1>
        <div className="head-actions">
          <label className="inline-field">
            <span className="sr-only">Filter by track</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by track">
              <option value="all">All tracks</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            Add task
          </button>
        </div>
      </header>

      <div className="board">
        {COLUMNS.map((col, colIndex) => {
          const list = visible.filter((t) => t.status === col.id).sort(compareTasks);
          return (
            <section
              key={col.id}
              className={'col' + (over === col.id ? ' is-over' : '')}
              aria-label={col.label}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOver(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                setOver(null);
                if (id) move(id, col.id);
              }}
            >
              <header className="col-head">
                <h2>{col.label}</h2>
                <span className="count">{list.length}</span>
              </header>

              {list.map((t) => {
                const track = trackOf(tracks, t.trackId);
                const due = t.due && t.status !== 'done' ? relDue(t.due) : null;
                const prev = COLUMNS[colIndex - 1];
                const next = COLUMNS[colIndex + 1];
                return (
                  <article
                    key={t.id}
                    className={'task' + (t.status === 'done' ? ' is-done' : '')}
                    style={{ '--track': track.color }}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                  >
                    <button type="button" className="task-title" onClick={() => setEditing(t)}>
                      {t.title}
                    </button>
                    {t.notes && <p className="task-notes">{t.notes}</p>}
                    <div className="task-meta">
                      <span className="chip">
                        <TrackDot color={track.color} />
                        {track.name}
                      </span>
                      <span className={'prio prio-' + t.priority}>
                        {PRIORITIES.find((p) => p.id === t.priority)?.label}
                      </span>
                      {due && <span className={'due due-' + due.tone}>{due.label}</span>}
                    </div>
                    <div className="task-move">
                      {prev && (
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Move to ${prev.label}`}
                          onClick={() => move(t.id, prev.id)}
                        >
                          ‹
                        </button>
                      )}
                      {next && (
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Move to ${next.label}`}
                          onClick={() => move(t.id, next.id)}
                        >
                          ›
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}

              {list.length === 0 && <p className="col-empty">{col.empty}</p>}
            </section>
          );
        })}
      </div>

      {editing && (
        <TaskForm
          task={editing === 'new' ? null : editing}
          tracks={tracks}
          defaultTrack={filter !== 'all' ? filter : undefined}
          onSave={save}
          onDelete={() => remove(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
