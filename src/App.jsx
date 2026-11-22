import { useCallback, useEffect, useRef, useState } from 'react';
import { getPassword, loadLocal, pullRemote, pushRemote, saveLocal, setPassword } from './sync.js';
import Overview from './views/Overview.jsx';
import Board from './views/Board.jsx';
import Roadmap from './views/Roadmap.jsx';
import StudyLog from './views/StudyLog.jsx';
import Settings from './views/Settings.jsx';

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'board', label: 'Board' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'log', label: 'Study log' },
  { id: 'settings', label: 'Settings' },
];

const SYNC_LABEL = {
  checking: 'Checking sync',
  synced: 'Synced across devices',
  saving: 'Saving',
  off: 'Saved on this device',
  locked: 'Sync needs password',
  error: 'Offline, saved on this device',
};

export default function App() {
  const [state, setState] = useState(loadLocal);
  const [view, setView] = useState('overview');
  const [sync, setSync] = useState({ status: 'checking' });

  const stateRef = useRef(state);
  const dirty = useRef(false); // true when there are local changes not yet pushed
  const canSync = useRef(false); // true once the server accepted us
  stateRef.current = state;

  const update = useCallback((fn) => {
    dirty.current = true;
    setState((prev) => ({ ...fn(prev), updatedAt: Date.now() }));
  }, []);

  const replaceAll = useCallback((next) => {
    dirty.current = true;
    setState({ ...next, version: 1, updatedAt: Date.now() });
  }, []);

  const connect = useCallback(async (password) => {
    setSync((s) => ({ ...s, status: 'checking' }));
    const res = await pullRemote(password);
    canSync.current = res.status === 'ok';
    if (res.status !== 'ok') {
      setSync({ status: res.status, reason: res.reason });
      return res.status;
    }
    const local = stateRef.current;
    const remoteTime = res.state && res.state.version === 1 ? res.state.updatedAt || 0 : -1;
    const localTime = local.updatedAt || 0;
    if (remoteTime > localTime) {
      dirty.current = false;
      setState(res.state);
    } else if (remoteTime < localTime) {
      dirty.current = true;
      setState((s) => ({ ...s })); // re-run the push effect
    }
    setSync({ status: 'synced' });
    return 'ok';
  }, []);

  const savePassword = useCallback(
    async (password) => {
      setPassword(password);
      return connect(password);
    },
    [connect],
  );

  // First load, and again whenever the tab becomes visible (picks up changes from another device).
  useEffect(() => {
    connect(getPassword());
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !dirty.current) connect(getPassword());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [connect]);

  // Save locally on every change, push to the server a moment later.
  useEffect(() => {
    saveLocal(state);
    if (!dirty.current || !canSync.current) return undefined;
    const timer = setTimeout(async () => {
      setSync({ status: 'saving' });
      const res = await pushRemote(getPassword(), state);
      if (res.status === 'ok') {
        if (stateRef.current === state) dirty.current = false;
        setSync({ status: 'synced' });
      } else {
        canSync.current = res.status !== 'locked';
        setSync({ status: res.status });
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [state]);

  const go = useCallback((id) => {
    setView(id);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">{'</>'}</span>
          <span>Stack Prep</span>
        </div>
        <nav className="nav" aria-label="Main">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={'nav-item' + (view === v.id ? ' is-active' : '')}
              aria-current={view === v.id ? 'page' : undefined}
              onClick={() => go(v.id)}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <div className="sync-pill" data-status={sync.status} role="status">
          {SYNC_LABEL[sync.status] || ''}
        </div>
      </aside>

      <main className="main">
        {view === 'overview' && <Overview state={state} update={update} go={go} />}
        {view === 'board' && <Board state={state} update={update} />}
        {view === 'roadmap' && <Roadmap state={state} update={update} />}
        {view === 'log' && <StudyLog state={state} update={update} />}
        {view === 'settings' && (
          <Settings
            state={state}
            update={update}
            replaceAll={replaceAll}
            sync={sync}
            savePassword={savePassword}
          />
        )}
      </main>
    </div>
  );
}
